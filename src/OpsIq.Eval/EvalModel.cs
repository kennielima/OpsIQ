public class EvalQuestions
{
    public List<AnswerableQuestion> Answerable { get; set; } = [];
    public List<UnanswerableQuestion> Unanswerable { get; set; } = [];
}

public class AnswerableQuestion
{
    public string Question { get; set; } = "";
    public string ExpectedDocument { get; set; } = "";
}

public class UnanswerableQuestion
{
    public string Question { get; set; } = "";
}