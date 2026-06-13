using System.Text.Json;
using PromptForge.Proxy.Services;

namespace PromptForge.Proxy.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected, ignore.
        }
        catch (BadHttpRequestException ex)
        {
            _logger.LogWarning(ex, "Request body too large");
            await WriteErrorAsync(context, StatusCodes.Status413PayloadTooLarge, "PAYLOAD_TOO_LARGE", "请求体过大，请缩短输入内容");
        }
        catch (UpstreamException ex)
        {
            var status = ex.StatusCode >= 400 ? ex.StatusCode : StatusCodes.Status500InternalServerError;
            var (code, message) = MapUpstreamError(status, ex.Message);
            await WriteErrorAsync(context, status, code, message);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException || ex.Message.Contains("timeout", StringComparison.OrdinalIgnoreCase))
        {
            await WriteErrorAsync(context, StatusCodes.Status504GatewayTimeout, "UPSTREAM_TIMEOUT", "请求超时，请检查网络或稍后重试");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Upstream network error");
            await WriteErrorAsync(context, StatusCodes.Status502BadGateway, "UPSTREAM_NETWORK_ERROR", "网络连接失败，请检查网络或 API 地址是否正确");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, "PROXY_ERROR", "服务器内部错误，请稍后重试");
        }
    }

    private static (string Code, string Message) MapUpstreamError(int statusCode, string originalMessage)
    {
        return statusCode switch
        {
            StatusCodes.Status401Unauthorized => ("UPSTREAM_UNAUTHORIZED", "API Key 无效或已过期"),
            StatusCodes.Status429TooManyRequests => ("UPSTREAM_RATE_LIMITED", "上游请求过于频繁，请稍后重试"),
            StatusCodes.Status413PayloadTooLarge => ("PAYLOAD_TOO_LARGE", "请求体过大，请缩短输入内容"),
            >= StatusCodes.Status500InternalServerError => ("UPSTREAM_ERROR", "服务器内部错误，请稍后重试"),
            _ => ("PROXY_ERROR", originalMessage)
        };
    }

    private static async Task WriteErrorAsync(HttpContext context, int statusCode, string code, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            success = false,
            error = new { code, message }
        }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }
}
