const { query } = require('./db');

let localCache = {};
let lastFetch = 0;

async function getRule(name) {
    const now = Date.now();
    // Cache for 60 seconds
    if (localCache[name] && (now - lastFetch < 60000)) {
        return localCache[name];
    }
    
    try {
        const res = await query('SELECT * FROM rules WHERE name = $1', [name]);
        if (res.rows.length > 0) {
            localCache[name] = res.rows[0];
            lastFetch = now;
            return localCache[name];
        }
    } catch (e) {
        console.error('Error fetching rule:', e);
    }
    return null;
}

async function invalidateRule(name) {
    delete localCache[name];
}

module.exports = { getRule, invalidateRule };
