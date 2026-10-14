namespace OpsIq.Services;

public class QueryService
{
    // private readonly QueryService _queryService;

    // public QueryService(QueryService queryService)
    // {
    //     _queryService = queryService;
    // }
    public async Task<string> GetQuestionAsync(string query)
    {
        // var answer = "answer";
        // var answer = await _queryService.GetQuestionAsync(query);
        return await Task.FromResult("This is a stubbed answer.");
    }
}
