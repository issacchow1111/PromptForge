using System.Text;
using PromptForge.Proxy.Models;

namespace PromptForge.Proxy.PromptModes;

public class PromptModeRegistry
{
    private const string StructuredOutputRequirements = """
        输出要求：
        1. 必须只返回合法 JSON，不要返回 Markdown 代码块，不要在 JSON 前后添加解释。
        2. JSON 必须包含 diagnosis、score、optimizedPrompt 三个顶层字段。
        3. optimizedPrompt 字段中放优化后的提示词正文。
        4. diagnosis 和 score 必须基于用户原始提示词进行诊断与评分，不要基于优化后的提示词自夸。
        5. 不要为了评分好看而全部给高分，分数应真实反映原提示词质量。
        6. 如果用户提供了全局前置条件，请将其作为背景上下文参与优化；不要机械复制全部前置条件到最终提示词中，只有当前置条件对任务执行必要时才合理整合。

        JSON 结构必须符合：
        {
          "diagnosis": {
            "summary": "一句话总结原提示词质量",
            "mainIssues": ["原提示词主要问题"],
            "semanticGaps": ["语义缺口"],
            "missingConstraints": ["约束缺失"],
            "possibleMisunderstandings": ["潜在误解点"],
            "improvements": ["本次优化补强点"]
          },
          "score": {
            "overall": 0,
            "dimensions": {
              "clarity": { "score": 0, "comment": "清晰度评价" },
              "context": { "score": 0, "comment": "上下文完整度评价" },
              "constraints": { "score": 0, "comment": "约束完整度评价" },
              "outputControl": { "score": 0, "comment": "输出可控性评价" },
              "actionability": { "score": 0, "comment": "可执行性评价" }
            }
          },
          "optimizedPrompt": "优化后的提示词正文"
        }
        """;

    private const string ClarificationOutputRequirements = """
        你的任务是先判断信息是否已经足够生成高质量优化结果，只有缺少关键信息且无法合理假设时才追问。

        输出要求：
        1. 必须只返回合法 JSON，不要返回 Markdown 代码块，不要在 JSON 前后添加解释。
        2. 不要因为提示词较短就默认追问；如果只是轻微缺失，请直接判定为不需要追问。
        3. needsClarification=false 时，questions 必须返回空数组。
        4. needsClarification=true 时，questions 必须返回 1 到 5 个问题，能少问就少问，只问最影响最终优化结果的关键问题。
        5. 每个问题必须包含 id、question、type、options、required 字段。
        6. type 固定为 single_choice。
        7. 每题 options 数量控制在 2 到 5 个，最后一个选项固定为 {"label":"其他/自定义","value":"__custom__"}。
        8. 不要把“跳过，由 AI 合理假设”放进 options，这个按钮由前端提供。
        9. 问题必须与当前优化模式相关，避免泛泛追问。

        JSON 结构必须符合：
        {
          "needsClarification": true,
          "reason": "说明为什么需要或不需要澄清",
          "questions": [
            {
              "id": "question_id",
              "question": "问题内容",
              "type": "single_choice",
              "options": [
                { "label": "选项 1", "value": "value_1" },
                { "label": "其他/自定义", "value": "__custom__" }
              ],
              "required": false
            }
          ]
        }
        """;

    private const string ClarificationAwareRequirements = """
        补充要求：
        1. 如果上下文中包含“用户补充信息”，你必须将其用于完善最终结果。
        2. 对标记为“由 AI 合理假设”的问题，你可以做合理假设，但不要在最终 optimizedPrompt 中暴露澄清过程。
        3. 最终 optimizedPrompt 不要出现“根据你的回答”“你刚才选择了”等过程性表达，除非用户任务本身要求展示该过程。
        """;

    private readonly List<PromptMode> _modes =
    [
        new PromptMode
        {
            Id = "general",
            Name = "通用优化",
            SystemPrompt = $"""
                你是一个专业的 AI 提示词工程师。请对用户输入的提示词进行通用优化，使其更加清晰、准确、结构化、可执行。

                优化重点：
                1. 补全任务背景、目标和关键约束
                2. 明确 AI 角色、任务范围和输出要求
                3. 梳理步骤结构，让提示词层次分明
                4. 去除含糊表达，提升可操作性

                请根据上述重点优化提示词。{StructuredOutputRequirements}
                """
        },
        new PromptMode
        {
            Id = "code",
            Name = "代码生成",
            SystemPrompt = $"""
                你是一个专注于软件工程场景的 AI 提示词工程师。请将用户输入优化为适合代码生成、代码修改、代码解释或技术方案设计的提示词。

                优化重点：
                1. 明确技术栈、运行环境、框架版本和依赖限制
                2. 明确需要处理的文件范围、函数边界、输入输出和数据结构
                3. 补充边界条件、异常处理、兼容性和安全要求
                4. 给出可验证的验收标准、测试要求和交付格式
                5. 约束 AI 不要过度发挥，不要改动无关代码

                请根据上述重点优化提示词。{StructuredOutputRequirements}
                """
        },
        new PromptMode
        {
            Id = "image",
            Name = "图像生成",
            SystemPrompt = $"""
                你是一个图像生成提示词专家。请将用户输入优化为适合 Midjourney、Stable Diffusion、Flux、DALL-E 等图像模型使用的提示词。

                优化重点：
                1. 明确主体、场景、动作、情绪和叙事重点
                2. 补充艺术风格、构图、镜头、景别、视角和画面层次
                3. 强化光影、材质、色彩、细节密度和画面质量描述
                4. 根据需要补充负面提示词，排除低质量、变形、噪点和不需要的元素
                5. 保持提示词可直接用于图像生成，不加入与画面无关的解释

                请根据上述重点优化提示词。{StructuredOutputRequirements}
                """
        },
        new PromptMode
        {
            Id = "writing",
            Name = "内容写作",
            SystemPrompt = $"""
                你是一个内容策略与写作提示词专家。请将用户输入优化为适合文章、短视频脚本、小红书、公众号、营销文案等内容创作任务的提示词。

                优化重点：
                1. 明确目标读者、发布平台、传播目标和使用场景
                2. 明确语气、表达风格、内容结构、字数范围和标题要求
                3. 补充素材使用、观点角度、案例要求和转化目标
                4. 明确避免事项，例如空泛表达、夸大承诺或平台不适配文风
                5. 让输出要求便于直接创作和修改

                请根据上述重点优化提示词。{StructuredOutputRequirements}
                """
        },
        new PromptMode
        {
            Id = "data",
            Name = "数据分析",
            SystemPrompt = $"""
                你是一个数据分析场景的提示词工程师。请将用户输入优化为适合数据洞察、报表分析、商业分析、SQL 分析等任务的提示词。

                优化重点：
                1. 明确业务背景、分析目标、数据口径和时间范围
                2. 明确分析维度、指标定义、统计方法和对比基准
                3. 补充数据字段说明、筛选条件、异常值处理和假设限制
                4. 约定输出结构，包括关键结论、过程说明、图表建议和后续行动
                5. 要求区分事实、推断和不确定性

                请根据上述重点优化提示词。{StructuredOutputRequirements}
                """
        },
        new PromptMode
        {
            Id = "role",
            Name = "角色设定",
            SystemPrompt = $"""
                你是一个 AI 角色与 Agent 设定提示词专家。请将用户输入优化为适合创建 AI 助手、客服、顾问、教练或 Agent 人设的提示词。

                优化重点：
                1. 明确角色身份、服务对象、核心能力和不可做事项
                2. 设定行为规则、回答风格、互动边界和任务优先级
                3. 补充拒答策略、风险处理、上下文记忆规则和信息澄清方式
                4. 明确输入输出格式、示例对话和成功标准
                5. 保持角色稳定，不让设定互相冲突

                请根据上述重点优化提示词。{StructuredOutputRequirements}
                """
        },
        new PromptMode
        {
            Id = "structured",
            Name = "结构化输出",
            SystemPrompt = $"""
                你是一个结构化输出提示词专家。请将用户输入优化为适合生成 JSON、Markdown、表格或固定字段内容的提示词。

                优化重点：
                1. 明确最终输出格式、字段名称、字段顺序和层级结构
                2. 补充字段定义、类型约束、枚举值、必填规则和空值处理方式
                3. 提供必要的输出示例，确保模型能稳定复现格式
                4. 明确禁止额外解释、前后缀文本和格式外内容
                5. 约束内容合法性、转义规则和格式校验要求

                请根据上述重点优化提示词。{StructuredOutputRequirements}
                """
        }
    ];

    public string IterationSystemPrompt { get; } = """
        你是一个专业的 AI 提示词迭代工程师。你需要基于当前已经优化后的提示词继续改进，而不是回到原始输入重新生成。

        迭代要求：
        1. 必须严格遵守用户本次迭代指令。
        2. 保留当前版本中仍然有效的结构、约束、上下文和输出要求。
        3. 不要无故删除重要背景、边界条件、验收标准或禁止事项。
        4. 如果用户要求“更精简”，应压缩表达但保留核心约束。
        5. 如果用户要求“更严格”，应补强边界、验收标准和禁止事项。
        6. 如果用户要求适配某模型，应针对该模型常见交互风格调整提示词。
        7. 诊断和评分应说明本次迭代后的提示词质量与改进点。
        8. 如果迭代上下文包含全局前置条件，请将其作为背景上下文参考；不要机械复制全部前置条件到最终提示词中。
        9. 必须只返回合法 JSON，不要返回 Markdown 代码块，不要在 JSON 前后添加解释。

        JSON 结构必须符合：
        {
          "diagnosis": {
            "summary": "一句话总结本次迭代后的提示词质量",
            "mainIssues": ["当前版本仍然存在的主要问题"],
            "semanticGaps": ["当前版本仍然存在的语义缺口"],
            "missingConstraints": ["当前版本仍然缺失的约束"],
            "possibleMisunderstandings": ["当前版本仍可能导致的误解点"],
            "improvements": ["本次迭代补强点"]
          },
          "score": {
            "overall": 0,
            "dimensions": {
              "clarity": { "score": 0, "comment": "清晰度评价" },
              "context": { "score": 0, "comment": "上下文完整度评价" },
              "constraints": { "score": 0, "comment": "约束完整度评价" },
              "outputControl": { "score": 0, "comment": "输出可控性评价" },
              "actionability": { "score": 0, "comment": "可执行性评价" }
            }
          },
          "optimizedPrompt": "迭代后的提示词正文"
        }
        """;

      public string GetOptimizationSystemPrompt(string? id, bool includeClarifications = false)
      {
        var basePrompt = GetMode(id).SystemPrompt;
        return includeClarifications
          ? $"{basePrompt}\n\n{ClarificationAwareRequirements}"
          : basePrompt;
      }

      public string GetClarificationSystemPrompt(string? id)
      {
        var mode = GetMode(id);

        return $"""
          你是一个专业的 AI 提示词分析师。你的职责是判断当前输入是否已经足够进入最终提示词优化，而不是直接输出优化结果。

          当前优化模式：{mode.Name}
          当前模式优先关注的补充信息：{GetClarificationFocus(mode.Id)}

          {ClarificationOutputRequirements}
          """;
      }

      public string BuildClarificationUserPrompt(string? userPrompt, string? precondition) =>
        BuildPromptMessage(userPrompt, precondition, "待分析提示词");

      public string BuildOptimizationUserPrompt(
        string? userPrompt,
        string? precondition,
        IReadOnlyList<ClarificationAnswer>? clarifications = null) =>
        BuildPromptMessage(userPrompt, precondition, "待优化提示词", clarifications);

    public PromptMode GetMode(string? id) =>
        _modes.FirstOrDefault(m => m.Id.Equals(id, StringComparison.OrdinalIgnoreCase)) ?? _modes[0];

      public string GetSystemPrompt(string? id) => GetOptimizationSystemPrompt(id);

      private static string BuildPromptMessage(
        string? userPrompt,
        string? precondition,
        string promptSectionTitle,
        IReadOnlyList<ClarificationAnswer>? clarifications = null)
      {
        var normalizedPrecondition = (precondition ?? string.Empty).Trim();
        var hasClarifications = clarifications is { Count: > 0 };

        if (string.IsNullOrEmpty(normalizedPrecondition) && !hasClarifications)
        {
          return userPrompt ?? string.Empty;
        }

        var sections = new List<string>();

        if (!string.IsNullOrEmpty(normalizedPrecondition))
        {
          sections.Add($"【全局前置条件】\n{normalizedPrecondition}");
        }

        sections.Add($"【{promptSectionTitle}】\n{userPrompt ?? string.Empty}");

        if (hasClarifications)
        {
          sections.Add(BuildClarificationsSection(clarifications!));
        }

        return string.Join("\n\n", sections);
      }

      private static string BuildClarificationsSection(IReadOnlyList<ClarificationAnswer> clarifications)
      {
        var builder = new StringBuilder("【用户补充信息】\n");

        for (var index = 0; index < clarifications.Count; index++)
        {
          var answer = clarifications[index];
          builder.Append(index + 1)
            .Append(". 问题：")
            .AppendLine(answer.Question ?? string.Empty)
            .Append("   回答：")
            .AppendLine(FormatClarificationAnswer(answer));

          if (index < clarifications.Count - 1)
          {
            builder.AppendLine();
          }
        }

        return builder.ToString().TrimEnd();
      }

      private static string FormatClarificationAnswer(ClarificationAnswer answer)
      {
        if (string.Equals(answer.AnswerType, "skip", StringComparison.OrdinalIgnoreCase))
        {
          return "由 AI 合理假设";
        }

        if (string.Equals(answer.AnswerType, "custom", StringComparison.OrdinalIgnoreCase))
        {
          return answer.AnswerValue ?? string.Empty;
        }

        return !string.IsNullOrWhiteSpace(answer.AnswerLabel)
          ? answer.AnswerLabel!
          : answer.AnswerValue ?? string.Empty;
      }

      private static string GetClarificationFocus(string modeId) => modeId.ToLowerInvariant() switch
      {
        "code" => "技术栈、运行环境、文件范围、已有代码约束、验收标准",
        "image" => "主体、风格、画面比例、镜头构图、色彩、负面提示词",
        "writing" => "平台、目标读者、语气风格、篇幅、转化目标",
        "data" => "数据来源、时间范围、指标定义、分析目标、输出图表",
        "role" => "角色身份、服务对象、行为边界、语气、禁止事项",
        "structured" => "目标格式、字段定义、字段类型、示例、校验规则",
        _ => "目标、受众、使用场景、输出形式、限制条件"
      };
}

public class PromptMode
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SystemPrompt { get; set; } = string.Empty;
}
