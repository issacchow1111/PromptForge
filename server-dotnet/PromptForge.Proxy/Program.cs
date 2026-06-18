using System.Net.Http.Headers;
using System.Text.Json;
using PromptForge.Proxy.Middleware;
using PromptForge.Proxy.Models;
using PromptForge.Proxy.Models.OpenAI;
using PromptForge.Proxy.PromptModes;
using PromptForge.Proxy.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuration keys match Docker -e with double underscores, e.g. Proxy__BaseUrl
builder.Configuration.AddEnvironmentVariables();

// Kestrel body size limit
var maxBodySizeKb = builder.Configuration.GetValue<int?>("MaxBodySizeKb") ?? 100;
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = maxBodySizeKb * 1024;
});

// CORS
var corsOrigin = builder.Configuration["Cors:Origin"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("PromptForgePolicy", policy =>
    {
        if (!string.IsNullOrWhiteSpace(corsOrigin))
        {
            policy.WithOrigins(corsOrigin.Trim());
        }
        else
        {
            policy.AllowAnyOrigin();
        }

        policy.AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// HttpClient for upstream LLM
builder.Services.AddHttpClient("Upstream", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

// Services
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<PromptModeRegistry>();
builder.Services.AddScoped<IUpstreamService, UpstreamService>();

var app = builder.Build();

// Middleware order is important: exception handler must be first.
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();
app.UseMiddleware<RequestValidationMiddleware>();
app.UseCors("PromptForgePolicy");

var jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web)
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
};

// Health check
app.MapGet("/api/health", () =>
{
    var configured = !string.IsNullOrWhiteSpace(builder.Configuration["Proxy:BaseUrl"])
                  && !string.IsNullOrWhiteSpace(builder.Configuration["Proxy:ApiKey"])
                  && !string.IsNullOrWhiteSpace(builder.Configuration["Proxy:Model"]);

    return Results.Json(new { success = true, proxyConfigured = configured }, jsonOptions);
});

// Non-streaming chat proxy
app.MapPost("/api/proxy/chat", async (ChatRequest req, IUpstreamService upstream, PromptModeRegistry registry, CancellationToken ct) =>
{
    var upstreamRequest = BuildUpstreamRequest(req, builder.Configuration, registry);
    var data = await upstream.PostChatCompletionAsync(upstreamRequest, ct);
    return Results.Json(new { success = true, data }, jsonOptions);
});

// Streaming chat proxy
app.MapPost("/api/proxy/chat/stream", async (ChatRequest req, IUpstreamService upstream, PromptModeRegistry registry, HttpContext context, CancellationToken ct) =>
{
    var upstreamRequest = BuildUpstreamRequest(req, builder.Configuration, registry);
    upstreamRequest.Stream = true;

    context.Response.StatusCode = StatusCodes.Status200OK;
    context.Response.ContentType = "text/event-stream";
    context.Response.Headers.CacheControl = "no-cache";
    context.Response.Headers.Connection = "keep-alive";

    await upstream.StreamChatCompletionAsync(
        upstreamRequest,
        async bytes =>
        {
            await context.Response.Body.WriteAsync(bytes, ct);
            await context.Response.Body.FlushAsync(ct);
        },
        ct);

    await context.Response.Body.FlushAsync(ct);
});

app.Run();

static OpenAIChatCompletionRequest BuildUpstreamRequest(ChatRequest req, IConfiguration config, PromptModeRegistry registry)
{
    var model = config["Proxy:Model"] ?? throw new InvalidOperationException("Proxy:Model is not configured");

    List<OpenAIMessage> messages;

    if (string.Equals(req.Type, "iteration", StringComparison.OrdinalIgnoreCase))
    {
        var iterationContext = new
        {
            modeId = req.ModeId ?? "general",
            originalPrompt = req.OriginalPrompt ?? string.Empty,
            precondition = req.Precondition ?? string.Empty,
            currentPrompt = req.CurrentPrompt ?? string.Empty,
            iterationInstruction = req.Instruction ?? string.Empty,
            diagnosis = req.Diagnosis,
            score = req.Score
        };

        messages =
        [
            new OpenAIMessage { Role = "system", Content = registry.IterationSystemPrompt },
            new OpenAIMessage { Role = "user", Content = JsonSerializer.Serialize(iterationContext, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }) }
        ];
    }
    else if (string.Equals(req.Type, "clarify", StringComparison.OrdinalIgnoreCase))
    {
        messages =
        [
            new OpenAIMessage { Role = "system", Content = registry.GetClarificationSystemPrompt(req.ModeId) },
            new OpenAIMessage { Role = "user", Content = registry.BuildClarificationUserPrompt(req.UserPrompt, req.Precondition) }
        ];
    }
    else
    {
        var includeClarifications = string.Equals(req.Type, "optimizeWithClarifications", StringComparison.OrdinalIgnoreCase);

        messages =
        [
            new OpenAIMessage { Role = "system", Content = registry.GetOptimizationSystemPrompt(req.ModeId, includeClarifications) },
            new OpenAIMessage
            {
                Role = "user",
                Content = registry.BuildOptimizationUserPrompt(
                    req.UserPrompt,
                    req.Precondition,
                    includeClarifications ? req.Clarifications : null)
            }
        ];
    }

    return new OpenAIChatCompletionRequest
    {
        Model = model,
        Messages = messages
    };
}
