local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local window   = tonumber(ARGV[2])
local limit    = tonumber(ARGV[3])
local expire   = tonumber(ARGV[4])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
    redis.call('EXPIRE', key, expire)
    return { 1, limit - count - 1, 0 }
else
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry  = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
    return { 0, 0, retry }
end
