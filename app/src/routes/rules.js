const express = require('express');
const router = express.Router();
const { query } = require('../services/db');
const { invalidateRule } = require('../services/ruleCache');

router.post('/', async (req, res) => {
    const { name, limit, window: window_seconds, strategy = 'sliding' } = req.body;
    try {
        const result = await query(
            'INSERT INTO rules (name, limit_count, window_seconds, strategy) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, limit, window_seconds, strategy]
        );
        res.status(201).json({ rule: result.rows[0] });
    } catch (e) {
        if (e.code === '23505') { // unique violation
            res.status(409).json({ error: 'rule already exists' });
        } else {
            res.status(500).json({ error: e.message });
        }
    }
});

router.get('/', async (req, res) => {
    const result = await query('SELECT * FROM rules');
    res.json({ rules: result.rows });
});

router.delete('/:name', async (req, res) => {
    const { name } = req.params;
    const result = await query('DELETE FROM rules WHERE name = $1', [name]);
    if (result.rowCount > 0) {
        await invalidateRule(name);
        res.status(204).send();
    } else {
        res.status(404).json({ error: 'rule not found' });
    }
});

module.exports = router;
