const express = require('express');
const router = express.Router();
const slidingWindow = require('../services/strategies/slidingWindow');

router.get('/data', async (req, res) => {
    const rule = { name: 'demo-rule', limit_count: 100, window_seconds: 60, strategy: 'sliding' };
    const key = req.ip || 'demo-user';
    
    try {
        const result = await slidingWindow.check(rule, key);
        
        if (result.allowed) {
            res.json({ data: "here is your fake API response", timestamp: Date.now() });
        } else {
            res.status(429).json({ error: "rate limit exceeded", retry_after: result.retry_after });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
