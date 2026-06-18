using System.Text.Json;

namespace PromptForge.Proxy.Middleware;

public class RequestValidationMiddleware
{
    private readonly RequestDelegate _next;
    private const int MaxPromptLength = 10_000;
    private const int MaxInstructionLength = 5_000;
    private const int MaxPreconditionLength = 10_000;
    private const int MaxTotalTextLength = 25_000;
    private const int MaxClarificationCount = 5;
    private const int MaxClarificationAnswerLength = 1_000;
    private const string SkipAnswerValue = "AI_REASONABLE_ASSUMPTION";

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
            var type = GetString(root, "type") ?? string.Empty;

            if (!IsSupportedType(type))
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "INVALID_TYPE", "type 只允许 optimize、iteration、clarify、optimizeWithClarifications");
                return;
            }

            if ((string.Equals(type, "clarify", StringComparison.OrdinalIgnoreCase)
                || string.Equals(type, "optimizeWithClarifications", StringComparison.OrdinalIgnoreCase))
                && string.IsNullOrWhiteSpace(userPrompt))
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "MISSING_USER_PROMPT", "澄清请求缺少待分析提示词");
                return;
            }

            if (string.Equals(type, "iteration", StringComparison.OrdinalIgnoreCase)
                && (string.IsNullOrWhiteSpace(currentPrompt) || string.IsNullOrWhiteSpace(instruction)))
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "INVALID_ITERATION_REQUEST", "迭代请求缺少 currentPrompt 或 instruction");
                return;
            }

            if (!TryValidateClarifications(root, out var clarificationsTextLength, out var clarificationErrorCode, out var clarificationErrorMessage))
            {
                await WriteErrorAsync(context, StatusCodes.Status400BadRequest, clarificationErrorCode, clarificationErrorMessage);
                return;
            }

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

            var totalTextLength = userPrompt.Length + currentPrompt.Length + originalPrompt.Length + instruction.Length + precondition.Length + clarificationsTextLength;
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

    private static bool TryValidateClarifications(
        JsonElement root,
        out int totalTextLength,
        out string errorCode,
        out string errorMessage)
    {
        totalTextLength = 0;
        errorCode = string.Empty;
        errorMessage = string.Empty;

        if (!root.TryGetProperty("clarifications", out var clarifications) || clarifications.ValueKind == JsonValueKind.Null)
        {
            return true;
        }

        if (clarifications.ValueKind != JsonValueKind.Array)
        {
            errorCode = "INVALID_CLARIFICATIONS";
            errorMessage = "澄清答案格式错误";
            return false;
        }

        if (clarifications.GetArrayLength() > MaxClarificationCount)
        {
            errorCode = "TOO_MANY_CLARIFICATIONS";
            errorMessage = "澄清答案最多只能提交 5 条";
            return false;
        }

        foreach (var item in clarifications.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)
            {
                errorCode = "INVALID_CLARIFICATION_ITEM";
                errorMessage = "单条澄清答案格式错误";
                return false;
            }

            if (!TryGetNonEmptyString(item, "questionId", out var questionId)
                || !TryGetNonEmptyString(item, "question", out var question)
                || !TryGetNonEmptyString(item, "answerType", out var answerType)
                || !TryGetNonEmptyString(item, "answerLabel", out var answerLabel)
                || !TryGetNonEmptyString(item, "answerValue", out var answerValue))
            {
                errorCode = "INVALID_CLARIFICATION_ITEM";
                errorMessage = "澄清答案字段不完整";
                return false;
            }

            if (answerValue.Length > MaxClarificationAnswerLength)
            {
                errorCode = "CLARIFICATION_ANSWER_TOO_LONG";
                errorMessage = "单条澄清答案内容过长，请控制在 1000 字符以内";
                return false;
            }

            if (string.Equals(answerType, "custom", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(answerValue))
                {
                    errorCode = "INVALID_CUSTOM_CLARIFICATION";
                    errorMessage = "自定义澄清答案不能为空";
                    return false;
                }
            }
            else if (string.Equals(answerType, "skip", StringComparison.OrdinalIgnoreCase))
            {
                if (!string.Equals(answerValue, SkipAnswerValue, StringComparison.Ordinal))
                {
                    errorCode = "INVALID_SKIP_CLARIFICATION";
                    errorMessage = "跳过类型的澄清答案必须为 AI_REASONABLE_ASSUMPTION";
                    return false;
                }
            }
            else if (!string.Equals(answerType, "option", StringComparison.OrdinalIgnoreCase))
            {
                errorCode = "INVALID_CLARIFICATION_TYPE";
                errorMessage = "answerType 只允许 option、custom、skip";
                return false;
            }

            totalTextLength += questionId.Length + question.Length + answerType.Length + answerLabel.Length + answerValue.Length;
        }

        return true;
    }

    private static bool TryGetNonEmptyString(JsonElement element, string propertyName, out string value)
    {
        value = string.Empty;

        if (!element.TryGetProperty(propertyName, out var prop) || prop.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        value = prop.GetString() ?? string.Empty;
        return !string.IsNullOrWhiteSpace(value);
    }

    private static bool IsSupportedType(string type) => string.IsNullOrWhiteSpace(type)
        || string.Equals(type, "optimize", StringComparison.OrdinalIgnoreCase)
        || string.Equals(type, "iteration", StringComparison.OrdinalIgnoreCase)
        || string.Equals(type, "clarify", StringComparison.OrdinalIgnoreCase)
        || string.Equals(type, "optimizeWithClarifications", StringComparison.OrdinalIgnoreCase);

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
