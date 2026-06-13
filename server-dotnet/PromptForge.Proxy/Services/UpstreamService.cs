using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using PromptForge.Proxy.Models.OpenAI;

namespace PromptForge.Proxy.Services;

public interface IUpstreamService
{
    Task<JsonElement> PostChatCompletionAsync(OpenAIChatCompletionRequest request, CancellationToken ct = default);
    Task StreamChatCompletionAsync(OpenAIChatCompletionRequest request, Func<byte[], Task> onChunk, CancellationToken ct = default);
}

public class UpstreamService : IUpstreamService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<UpstreamService> _logger;

    private static readonly JsonSerializerOptions UpstreamJsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public UpstreamService(IHttpClientFactory factory, IConfiguration config, ILogger<UpstreamService> logger)
    {
        _httpClient = factory.CreateClient("Upstream");
        _config = config;
        _logger = logger;
    }

    public async Task<JsonElement> PostChatCompletionAsync(OpenAIChatCompletionRequest request, CancellationToken ct = default)
    {
        using var response = await SendRequestAsync(request, HttpCompletionOption.ResponseContentRead, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        return JsonDocument.Parse(json).RootElement;
    }

    public async Task StreamChatCompletionAsync(OpenAIChatCompletionRequest request, Func<byte[], Task> onChunk, CancellationToken ct = default)
    {
        using var response = await SendRequestAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        await using var stream = await response.Content.ReadAsStreamAsync(ct);

        var buffer = new byte[8192];
        while (true)
        {
            var read = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct);
            if (read == 0) break;

            await onChunk(buffer.AsMemory(0, read).ToArray());
        }
    }

    private async Task<HttpResponseMessage> SendRequestAsync(OpenAIChatCompletionRequest request, HttpCompletionOption completionOption, CancellationToken ct)
    {
        var baseUrl = (_config["Proxy:BaseUrl"] ?? string.Empty).TrimEnd('/');
        var apiKey = _config["Proxy:ApiKey"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(apiKey))
        {
            throw new UpstreamException("服务端未配置上游模型接口") { StatusCode = (int)HttpStatusCode.InternalServerError };
        }

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions")
        {
            Content = JsonContent.Create(request, options: UpstreamJsonOptions)
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(httpRequest, completionOption, ct);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException || ex.Message.Contains("timeout", StringComparison.OrdinalIgnoreCase))
        {
            throw new UpstreamException("请求超时，请检查网络或稍后重试") { StatusCode = (int)HttpStatusCode.GatewayTimeout };
        }
        catch (HttpRequestException ex)
        {
            throw new UpstreamException("网络连接失败，请检查网络或 API 地址是否正确", ex) { StatusCode = (int)HttpStatusCode.BadGateway };
        }

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            var message = TryExtractUpstreamError(body) ?? $"请求失败 ({(int)response.StatusCode})";
            throw new UpstreamException(message) { StatusCode = (int)response.StatusCode, ResponseBody = body };
        }

        return response;
    }

    private static string? TryExtractUpstreamError(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("error", out var error))
            {
                if (error.TryGetProperty("message", out var msg))
                    return msg.GetString();
                if (error.TryGetProperty("code", out var code))
                    return code.GetString();
            }
            if (doc.RootElement.TryGetProperty("message", out var m))
                return m.GetString();
        }
        catch
        {
            // ignore parse errors
        }
        return null;
    }
}

public class UpstreamException : Exception
{
    public int StatusCode { get; set; }
    public string? ResponseBody { get; set; }

    public UpstreamException(string message) : base(message) { }

    public UpstreamException(string message, Exception inner) : base(message, inner) { }
}
