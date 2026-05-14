const express = require('express');
const router = express.Router();

router.get('/data', async (req, res) => {
    // We use a fixed key for the demo so it's easy to see it hit the limit
    const key = 'demo-user';
    
    try {
        // Call the internal check endpoint to ensure it logs to DB and updates stats
        const checkRes = await fetch('http://localhost:3000/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, rule: 'demo-rule' })
        });
        
        if (!checkRes.ok) {
            // If the rule wasn't found (e.g. 400 Bad Request), just pass the error
            const err = await checkRes.json();
            return res.status(checkRes.status).json(err);
        }
        
        const result = await checkRes.json();
        
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
