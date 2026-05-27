# HauShop

HauShop is an e-commerce platform with an ASP.NET Core API and a Vite React frontend.

## Structure

- `api/` - ASP.NET Core API, EF Core, MySQL, Redis-backed cache/session support.
- `frontend/` - React, TypeScript, React Query, Redux Toolkit UI.
- `docker-compose.yml` - local infrastructure/runtime composition.

## Local Setup

1. Copy `.env.example` to `.env` and fill secrets.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Start infrastructure with Docker, or provide MySQL/Redis locally.
4. Run the API:

```bash
dotnet restore api/api.csproj
dotnet run --project api/api.csproj
```

5. Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Database

Migrations are not applied automatically unless `Database__ApplyMigrationsOnStartup=true`.
For manual migration:

```bash
dotnet ef database update --project api/api.csproj
```

## Quality Checks

```bash
dotnet build api/api.csproj
cd frontend
npm run lint
npm run build
```
