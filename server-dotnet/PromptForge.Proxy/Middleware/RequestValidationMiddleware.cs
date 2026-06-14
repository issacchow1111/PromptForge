using System.Text.Json;

namespace PromptForge.Proxy.Middleware;

public class RequestValidationMiddleware
{
    private readonly RequestDelegate _next;
    private const int MaxPromptLength = 10_000;
    private const int MaxInstructionLength = 5_000;
    private const int MaxPreconditionLength = 10_000;
    private const int MaxTotalTextLength = 25_000;

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

            var userPrompt = GetString(root, "userPrompt") ?? string.Empty;
            var currentPrompt = GetString(root, "currentPrompt") ?? string.Empty;
            var originalPrompt = GetString(root, "originalPrompt") ?? string.Empty;
            var instruction = GetString(root, "instruction") ?? string.Empty;
            var precondition = GetString(root, "precondition") ?? string.Empty;

            if (userPrompt.Length > MaxPromptLength)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "PROMPT_TOO_LONG", "待优化提示词过长，请控制在 10000 字符以内");
                return;
            }

            if (currentPrompt.Length > MaxPromptLength)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "CURRENT_PROMPT_TOO_LONG", "当前版本提示词过长，请控制在 10000 字符以内");
                return;
            }

            if (originalPrompt.Length > MaxPromptLength)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "ORIGINAL_PROMPT_TOO_LONG", "原始提示词过长，请控制在 10000 字符以内");
                return;
            }

            if (instruction.Length > MaxInstructionLength)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "INSTRUCTION_TOO_LONG", "迭代要求过长，请控制在 5000 字符以内");
                return;
            }

            if (precondition.Length > MaxPreconditionLength)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "PRECONDITION_TOO_LONG", "前置条件过长，请控制在 10000 字符以内");
                return;
            }

            var totalTextLength = userPrompt.Length + currentPrompt.Length + originalPrompt.Length + instruction.Length + precondition.Length;
            if (totalTextLength > MaxTotalTextLength)
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "REQUEST_TOO_LONG", "请求文本总量过长，请缩短输入后重试");
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
