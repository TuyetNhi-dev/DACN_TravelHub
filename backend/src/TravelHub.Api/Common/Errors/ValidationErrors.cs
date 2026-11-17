namespace TravelHub.Api.Common.Errors;

/// <summary>Collects field errors so a request reports every problem at once instead of one per round trip.</summary>
public sealed class ValidationErrors
{
    private readonly Dictionary<string, List<string>> errors = [];

    public bool HasErrors => errors.Count > 0;

    public void Add(string field, string message)
    {
        if (!errors.TryGetValue(field, out var messages))
            errors[field] = messages = [];
        messages.Add(message);
    }

    public void AddIf(bool condition, string field, string message)
    {
        if (condition) Add(field, message);
    }

    public void ThrowIfAny()
    {
        if (HasErrors)
            throw new ApiValidationException(errors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray()));
    }
}
