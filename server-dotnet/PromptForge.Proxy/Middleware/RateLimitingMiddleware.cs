using Microsoft.Extensions.Caching.Memory;

namespace PromptForge.Proxy.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly int _windowMs;
    private readonly int _maxRequests;
    private readonly int _delayAfter;
    private const int MaxDelayMs = 5000;

    public RateLimitingMiddleware(RequestDelegate next, IMemoryCache cache, IConfiguration config)
    {
        _next = next;
        _cache = cache;
        _windowMs = config.GetValue<int?>("RateLimit:WindowMs") ?? 60_000;
        _maxRequests = config.GetValue<int?>("RateLimit:MaxRequests") ?? 10;
        _delayAfter = Math.Max(1, _maxRequests / 2);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var key = $"ratelimit:{ip}";

        var entry = _cache.GetOrCreate(key, e =>
        {
            e.AbsoluteExpirationRelativeToNow = TimeSpan.FromMilliseconds(_windowMs);
            return new RateLimitEntry();
        }) ?? new RateLimitEntry();

        var hits = Interlocked.Increment(ref entry.Hits);

        // Slow-down: progressive delay after delayAfter, capped at MaxDelayMs
        if (hits > _delayAfter && hits <= _maxRequests)
        {
            var delay = Math.Min((hits - _delayAfter) * 200, MaxDelayMs);
            if (delay > 0)
            {
                await Task.Delay(delay, context.RequestAborted);
            }
        }

        // Hard limit
        if (hits > _maxRequests)
        {
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                error = new { code = "RATE_LIMIT_EXCEEDED", message = "请求过于频繁，请稍后重试" }
            });
            return;
        }

        await _next(context);
    }

    private class RateLimitEntry
    {
        public int Hits;
    }
}
