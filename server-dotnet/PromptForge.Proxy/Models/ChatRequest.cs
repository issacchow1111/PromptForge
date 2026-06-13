using System.Text.Json.Serialization;

namespace PromptForge.Proxy.Models;

public class ChatRequest
{
    public string? ModeId { get; set; }

    public string? UserPrompt { get; set; }

    public string? Precondition { get; set; }

    public string? Type { get; set; }

    public string? CurrentPrompt { get; set; }

    public string? Instruction { get; set; }

    public string? OriginalPrompt { get; set; }

    [JsonPropertyName("diagnosis")]
    public object? Diagnosis { get; set; }

    [JsonPropertyName("score")]
    public object? Score { get; set; }
}
