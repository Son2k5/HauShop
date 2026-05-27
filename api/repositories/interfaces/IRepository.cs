using System.Linq.Expressions;

namespace api.repositories.interfaces
{
    public interface IRepository<T> where T : class
    {
        // Get
        Task<T?> GetByIdAsync(string id, CancellationToken ct);
        Task<IEnumerable<T>> GetAllAsync(CancellationToken ct);

        // Find
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct);

        // Count
        Task<int> CountAsync(CancellationToken ct);
        Task<int> CountAsync(Expression<Func<T, bool>> predicate, CancellationToken ct);

        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct);

        T Add(T entity);
        void AddRange(IEnumerable<T> entities);

        void Update(T entity);
        void UpdateRange(IEnumerable<T> entities);

        void Delete(T entity);
        void DeleteRange(IEnumerable<T> entities);

        Task<(IEnumerable<T> items, int totalCount)> GetPageAsync(
            int page,
            int pageSize,
            Expression<Func<T, bool>>? filter = null,
            Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
            string includeProperties = "",
            CancellationToken ct = default
        );
    }
}