const express = require('express');
const router = express.Router();
const { getRule } = require('../services/ruleCache');
const slidingWindow = require('../services/strategies/slidingWindow');
const clock = require('../services/clock');
const { query } = require('../services/db');
const { redis } = require('../services/redis');

router.get('/data', async (req, res) => {
    // We use a fixed key for the demo so it's easy to see it hit the limit
    const key = 'demo-user';
    const ruleName = 'demo-rule';
    
    try {
        let rule = await getRule(ruleName);
        if (!rule) {
            return res.status(400).json({ error: `rule '${ruleName}' not found` });
        }

        const result = await slidingWindow.check(rule, key);
        
        // Log the event explicitly (replicating the /check endpoint logic)
        const decision = result.allowed ? 'allow' : 'deny';
        const statName = result.allowed ? 'allows' : 'denies';
        const lamport_ts = clock.tick();
        const nodeId = process.env.NODE_ID || 'node-1';

        await query(`INSERT INTO event_log (node_id, rule_name, client_key, decision, remaining, lamport_ts) 
               VALUES ($1, $2, $3, $4, $5, $6)`,
            [nodeId, ruleName, key, decision, result.remaining, lamport_ts])
        .catch(err => console.error('Error logging demo event:', err));

        await redis.incr(`rg:stats:${nodeId}:${statName}`).catch(e => console.error(e));

        if (result.allowed) {
            res.json({ data: "Successfully fetched secure API data payload.", timestamp: Date.now() });
        } else {
            res.status(429).json({ error: "rate limit exceeded", retry_after: result.retry_after });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
