const express = require('express');
const router = express.Router();
const { getRule } = require('../services/ruleCache');
const fixedWindow = require('../services/strategies/fixedWindow');
const slidingWindow = require('../services/strategies/slidingWindow');
const tokenBucket = require('../services/strategies/tokenBucket');
const clock = require('../services/clock');
const { query } = require('../services/db');
const { redis } = require('../services/redis');

router.post('/', async (req, res) => {
    const start = Date.now();
    const { key, rule: ruleName } = req.body;

    const rule = await getRule(ruleName);
    if (!rule) {
        return res.status(400).json({ error: `rule '${ruleName}' not found` });
    }

    let result;
    if (rule.strategy === 'fixed_window') {
        result = await fixedWindow.check(rule, key);
    } else if (rule.strategy === 'token_bucket') {
        result = await tokenBucket.check(rule, key);
    } else {
        result = await slidingWindow.check(rule, key);
    }

    const decision = result.allowed ? 'allow' : 'deny';
    const statName = result.allowed ? 'allows' : 'denies';
    const lamport_ts = clock.tick();
    const nodeId = process.env.NODE_ID || 'node-1';

    query(`INSERT INTO event_log (node_id, rule_name, client_key, decision, remaining, lamport_ts) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
        [nodeId, ruleName, key, decision, result.remaining, lamport_ts])
    .catch(err => console.error('Error logging event:', err));

    redis.incr(`rg:stats:${nodeId}:${statName}`).catch(e => console.error(e));

    const latency = Date.now() - start;
    res.set('X-Node-ID', nodeId);
    res.set('X-Latency-Ms', latency.toString());
    res.set('X-Strategy', rule.strategy);

    if (result.allowed) {
        res.json({ allowed: true, remaining: result.remaining, reset_in: result.reset_in });
    } else {
        res.json({ allowed: false, remaining: 0, retry_after: result.retry_after });
    }
});

module.exports = router;
