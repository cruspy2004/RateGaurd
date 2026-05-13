const fs = require('fs');
const path = require('path');
const { redis, loadScript } = require('../redis');

let sha = null;

async function init() {
    const script = fs.readFileSync(path.join(__dirname, '../../scripts/token_bucket.lua'), 'utf8');
    sha = await loadScript(script);
}

async function check(rule, key) {
    if (!sha) await init();
    
    const limit = rule.limit_count;
    const nowMs = Date.now();
    const redisKey = `rg:tb:${rule.name}:${key}`;
    
    try {
        const result = await redis.evalsha(sha, 1, redisKey, limit, rule.window_seconds, nowMs);
        const allowed = result[0] === 1;
        const remaining = result[1];
        const retryAfter = result[2];
        
        if (allowed) {
            return { allowed: true, remaining, reset_in: rule.window_seconds };
        } else {
            return { allowed: false, remaining: 0, retry_after: retryAfter };
        }
    } catch (e) {
        if (e.message.includes('NOSCRIPT')) {
            await init();
            return check(rule, key);
        }
        throw e;
    }
}

module.exports = { check };
