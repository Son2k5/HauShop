
using System.Linq.Expressions;


namespace api.Repositories.Interfaces
{
    public interface IRepository<T> where T : class
    {
        // Get
        public Task<T?> GetByIdAsync(string id);
        public Task<IEnumerable<T>> GetAllAsync();

        // Find
        public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        public Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);


        // Count
        public Task<int> CountAsync();
        public Task<int> CountAsync(Expression<Func<T, bool>> predicate);

        public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);

        //Add 
        public T Add(T entity);
        void AddRange(IEnumerable<T> entities);

        //Update
        public void Update(T entity);
        public void UpdateRange(IEnumerable<T> entities);

        // Delete

        public void Delete(T entity);
        public void DeleteRange(IEnumerable<T> entities);

        // Pagination
        public Task<(IEnumerable<T> items, int totalCount)> GetPageAsync(
            int page,
            int pageSize,
            Expression<Func<T, bool>>? filter = null,
            Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
            string includeProperties = ""

        );

    }
}