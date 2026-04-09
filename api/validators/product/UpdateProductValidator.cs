using FluentValidation;
using api.DTOs.product;

namespace api.validators.product
{
    public class UpdateProductValidator : AbstractValidator<UpdateProductDto>
    {
        public UpdateProductValidator()
        {
            RuleFor(x => x.Sku)
                .MaximumLength(50).WithMessage("SKU tối đa 50 ký tự")
                .Matches(@"^[a-zA-Z0-9\-_]+$").WithMessage("SKU chỉ được chứa chữ, số, dấu - và _")
                .When(x => x.Sku != null);

            RuleFor(x => x.Name)
                .MaximumLength(200).WithMessage("Tên sản phẩm tối đa 200 ký tự")
                .When(x => x.Name != null);

            RuleFor(x => x.Description)
                .MaximumLength(5000).WithMessage("Mô tả tối đa 5000 ký tự")
                .When(x => x.Description != null);

            RuleFor(x => x.Price)
                .GreaterThan(0).WithMessage("Giá phải lớn hơn 0")
                .LessThan(1_000_000_000).WithMessage("Giá không hợp lệ")
                .When(x => x.Price.HasValue);
        }
    }
}