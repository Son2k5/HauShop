using FluentValidation;
using api.DTOs.product;

namespace api.validators.product
{
    public class CreateProductValidator : AbstractValidator<CreateProductDto>
    {
        public CreateProductValidator()
        {
            RuleFor(x => x.Sku)
                .NotEmpty().WithMessage("SKU không được để trống")
                .MaximumLength(50).WithMessage("SKU tối đa 50 ký tự")
                .Matches(@"^[a-zA-Z0-9\-_]+$").WithMessage("SKU chỉ được chứa chữ, số, dấu - và _");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên sản phẩm không được để trống")
                .MaximumLength(200).WithMessage("Tên sản phẩm tối đa 200 ký tự");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Mô tả không được để trống")
                .MaximumLength(5000).WithMessage("Mô tả tối đa 5000 ký tự");

            RuleFor(x => x.Price)
                .GreaterThan(0).WithMessage("Giá phải lớn hơn 0")
                .LessThan(1_000_000_000).WithMessage("Giá không hợp lệ");

            RuleFor(x => x.CategoryIds)
                .NotNull().WithMessage("CategoryIds không được null");
        }
    }

}