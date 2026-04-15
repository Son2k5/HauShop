// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading.Tasks;
// using api.data;
// using api.DTOs.review;
// using api.repositories.interfaces;
// using api.services.interfaces.review;
// using Microsoft.EntityFrameworkCore;
// using MimeKit.Cryptography;

// namespace api.services.implementations.review
// {
//     public class ReviewService : IReviewService
//     {
//         public  readonly IReviewRepository _reviewRepo;
//         public readonly IProductRepository _productRepo;
//         public readonly ILogger<ReviewService> _logger;
//         public ApplicationDbContext _context;

//           public ReviewService(
//             IReviewRepository reviewRepo,
//             IProductRepository productRepo,
//             ApplicationDbContext context,
//             ILogger<ReviewService> logger)
//         {
//             _reviewRepo = reviewRepo;
//             _productRepo = productRepo;
//             _context = context;
//             _logger = logger;
//         }

//         public async Task<ReviewDto> CreateAsync(string userId, CreateReviewDto dto, CancellationToken ct = default)
//         {

//             if(string.IsNullOrWhiteSpace(dto.ProductId))
//                 throw new InvalidOperationException("ProductId is required");
//             if(dto.Rating >5 || dto.Rating < 1)
//                 throw new InvalidOperationException("Rating is  from 1 to 5");
//             var product = await _productRepo.GetByIdAsync(dto.ProductId, ct);
//             if(product == null)
//                 throw new KeyNotFoundException("Can't find product: {dto.ProductId}");
//             if(!product.IsActive)
//                 throw new InvalidCastException("The product no longer exists.");
//             var hasBought = await _context
//                                 .OrderItems
//                                 .AsNoTracking()
//                                 .AnyAsync( e => e.ProductId == dto.ProductId
//                                 && e.Order.UserId == userId);

//             return;
//         }
//     }
// }