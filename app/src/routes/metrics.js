const express = require('express');
const router = express.Router();
const { redis } = require('../services/redis');
const { query } = require('../services/db');
const { getLeaderId } = require('../services/election');

router.get('/health', (req, res) => {
    res.json({
        node_id: process.env.NODE_ID || 'node-1',
        status: 'ok',
        uptime_s: Math.floor(process.uptime()),
        redis: redis.status === 'ready' ? 'connected' : 'disconnected',
        postgres: 'connected'
    });
});

router.get('/metrics', async (req, res) => {
    try {
        const leaderId = await redis.get('rg:leader') || 'Pending election...';
        
        const keys = await redis.keys('rg:stats:*:allows');
        const nodes = [];
        let total_allows = 0;
        let total_denies = 0;
        
        for (const key of keys) {
            const nodeId = key.split(':')[2];
            const allows = parseInt(await redis.get(`rg:stats:${nodeId}:allows`) || '0');
            const denies = parseInt(await redis.get(`rg:stats:${nodeId}:denies`) || '0');
            nodes.push({ id: nodeId, allows, denies });
            total_allows += allows;
            total_denies += denies;
        }
        
        const topKeysRes = await query(`
            SELECT client_key as key, COUNT(*) as requests 
            FROM event_log 
            WHERE wall_ts > NOW() - INTERVAL '1 hour'
            GROUP BY client_key 
            ORDER BY requests DESC LIMIT 10
        `);

        const eventsRes = await query(`
            SELECT * FROM event_log ORDER BY lamport_ts DESC LIMIT 50
        `);

        const rulesBreakdown = await query(`
            SELECT rule_name, 
                   COUNT(*) as checks,
                   SUM(CASE WHEN decision = 'allow' THEN 1 ELSE 0 END) as allows,
                   SUM(CASE WHEN decision = 'deny' THEN 1 ELSE 0 END) as denies
            FROM event_log
            GROUP BY rule_name
        `);

        res.json({
            leader_id: leaderId,
            nodes,
            total_allows,
            total_denies,
            top_keys: topKeysRes.rows,
            events: eventsRes.rows,
            rules: rulesBreakdown.rows
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
