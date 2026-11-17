namespace TravelHub.Api.Common.Http;

public sealed record ListResponse<T>(IReadOnlyList<T> Data, int Count)
{
    public static ListResponse<T> From(IReadOnlyList<T> rows) => new(rows, rows.Count);
}

public sealed record ItemResponse<T>(T Data);

public sealed record MessageResponse(string Message);
