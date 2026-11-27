using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Configuration;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Tests;

/// <summary>GET /api/tours/suggest (ROADMAP 8.2): what the search box may ask while the customer types.</summary>
public sealed class TourSuggestTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    [InlineData("a")]
    [InlineData(" Đ ")]
    public void Text_shorter_than_two_letters_suggests_nothing(string? q)
        => Assert.Null(TourSearchRules.ParseSuggestion(q));

    [Theory]
    [InlineData("Đà", "da")]
    [InlineData("  HẠ   LONG ", "ha long")]
    public void Suggestions_use_the_same_accent_free_text_as_the_list(string q, string expected)
        => Assert.Equal(expected, TourSearchRules.ParseSuggestion(q));

    [Fact]
    public void Text_longer_than_the_list_search_accepts_is_refused()
    {
        var error = Assert.Throws<ApiValidationException>(() =>
            TourSearchRules.ParseSuggestion(new string('a', TourSearchRules.MaxQueryLength + 1)));
        Assert.Contains("q", error.Errors.Keys);
    }

    [Fact]
    public async Task A_too_short_text_answers_empty_without_touching_the_database()
    {
        // No database is configured: any query would throw DatabaseConfigurationException.
        var repository = new TourRepository(new MySqlConnectionFactory(Options.Create(new DatabaseOptions())));
        var service = new TourService(repository, new VietnamClock(TimeProvider.System));

        var result = await service.SuggestAsync("h", CancellationToken.None);

        Assert.Same(TourSuggestionsDto.Empty, result);
    }
}
