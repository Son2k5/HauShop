// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading.Tasks;
// using api.data;
// using api.models.entities;
// using api.repositories.interfaces;

// namespace api.repositories.implementations
// {
//     public class ReviewRepository : Repository<Review>, IReviewRepository
//     {
//         public ReviewRepository(ApplicationDbContext context) : base(context) { }

//         public async Task<(List<Review> Items, int Total)> GetApprovedByProductIdAsync(
//             string productId,
//             int page,
//             int pageSize,
//             CancellationToken ct = default)
//         {
//             page = Math.Max(page, 1);
//             pageSize = Math.Clamp(pageSize, 1, 100);

//             var query = _dbSet.AsNoTracking().Where(r => r.productId) ;
//         }
//     }
// }