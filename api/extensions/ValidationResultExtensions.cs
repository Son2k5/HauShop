using api.common;
using FluentValidation.Results;

namespace api.extensions;

public static class ValidationResultExtensions
{
    public static IDictionary<string, string[]> ToClientSafeDictionary(this ValidationResult result)
    {
        return result.Errors
            .GroupBy(error => string.IsNullOrWhiteSpace(error.PropertyName) ? "request" : error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(_ => ClientErrorMessages.FieldInvalid).Distinct().ToArray());
    }
}
