namespace TravelHub.Api.Common.Http;

public sealed record ListResponse<T>(IReadOnlyList<T> Data, int Count, int Total)
{
    /// <summary>Non-paginated: Total equals Count (all items returned).</summary>
    public static ListResponse<T> From(IReadOnlyList<T> rows) => new(rows, rows.Count, rows.Count);

    /// <summary>Paginated: Total is the full count across all pages.</summary>
    public static ListResponse<T> Paged(IReadOnlyList<T> rows, int total) => new(rows, rows.Count, total);
}

public sealed record ItemResponse<T>(T Data);

public sealed record MessageResponse(string Message);
