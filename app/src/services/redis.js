const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));

async function loadScript(scriptContent) {
    return await redis.script('LOAD', scriptContent);
}

module.exports = {
    redis,
    loadScript
};
