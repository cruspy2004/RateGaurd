local key           = KEYS[1]
local limit         = tonumber(ARGV[1])
local window_s      = tonumber(ARGV[2])
local now_ms        = tonumber(ARGV[3])

local tokens        = tonumber(redis.call('HGET', key, 'tokens'))
local last_refill   = tonumber(redis.call('HGET', key, 'last_refill'))

if not tokens then
    tokens = limit
    last_refill = now_ms
end

local elapsed = math.max(0, now_ms - last_refill)
local refill = elapsed * (limit / window_s) / 1000
tokens = math.min(limit, tokens + refill)

if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HSET', key, 'tokens', tokens, 'last_refill', now_ms)
    redis.call('EXPIRE', key, window_s * 2)
    return { 1, math.floor(tokens), 0 }
else
    local wait_ms = (1 - tokens) / (limit / window_s) * 1000
    return { 0, 0, math.ceil(wait_ms / 1000) }
end
