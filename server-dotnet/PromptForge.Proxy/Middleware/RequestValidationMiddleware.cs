using System.Text.Json;

namespace PromptForge.Proxy.Middleware;

public class RequestValidationMiddleware
{
    private readonly RequestDelegate _next;
    private const int MaxPromptLength = 10_000;

    public RequestValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (HttpMethods.IsPost(context.Request.Method) && path.StartsWith("/api/proxy", StringComparison.OrdinalIgnoreCase))
        {
            context.Request.EnableBuffering();
            var body = await new StreamReader(context.Request.Body).ReadToEndAsync(context.RequestAborted);
            context.Request.Body.Position = 0;

            if (string.IsNullOrWhiteSpace(body))
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "INVALID_BODY", "请求体格式错误");
                return;
            }

            JsonElement root;
            try
            {
                using var doc = JsonDocument.Parse(body);
                root = doc.RootElement.Clone();
            }
            catch
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "INVALID_BODY", "请求体格式错误");
                return;
            }

            if (root.ValueKind != JsonValueKind.Object)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "INVALID_BODY", "请求体格式错误");
                return;
            }

            if (root.TryGetProperty("modeId", out var modeId) && modeId.ValueKind != JsonValueKind.String)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "INVALID_MODE_ID", "模式 ID 格式错误");
                return;
            }

            var text = GetString(root, "userPrompt")
                    ?? GetString(root, "currentPrompt")
                    ?? GetString(root, "instruction")
                    ?? string.Empty;

            if (text.Length > MaxPromptLength)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "PROMPT_TOO_LONG", "输入内容过长，请控制在 10000 字符以内");
                return;
            }
        }

        await _next(context);
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String)
        {
            return prop.GetString();
        }
        return null;
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
