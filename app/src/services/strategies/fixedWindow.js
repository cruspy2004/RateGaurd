const { redis } = require('../redis');

async function check(rule, key) {
    const windowSeconds = rule.window_seconds;
    const limit = rule.limit_count;
    
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / windowSeconds);
    const redisKey = `rg:fw:${rule.name}:${key}:${bucket}`;
    
    const replies = await redis.multi()
        .incr(redisKey)
        .expire(redisKey, windowSeconds)
        .exec();
        
    const count = replies[0][1];
    
    if (count <= limit) {
        return { allowed: true, remaining: limit - count, reset_in: windowSeconds - (now % windowSeconds) };
    } else {
        return { allowed: false, remaining: 0, retry_after: windowSeconds - (now % windowSeconds) };
    }
}

module.exports = { check };
