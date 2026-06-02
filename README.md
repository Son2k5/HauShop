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

## Production Deploy

Recommended split deploy:

- `https://haushop.io.vn` -> frontend on Vercel
- `https://api.haushop.io.vn` -> ASP.NET Core API on the VPS

### VPS API

```bash
cp .env.production.example .env.production
# edit .env.production and replace all change-me values
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Copy `infra/nginx/api.haushop.io.vn.conf` to the VPS Nginx sites folder, issue a LetsEncrypt certificate for `api.haushop.io.vn`, then reload Nginx.

### Vercel Frontend

Set the Vercel project root to `frontend` and use:

```bash
npm run build
dist
```

Add these Vercel environment variables:

```bash
VITE_API_BASE_URL=https://api.haushop.io.vn/api
VITE_SIGNALR_URL=https://api.haushop.io.vn/hubs/chat
VITE_NOTIFICATION_HUB_URL=https://api.haushop.io.vn/hubs/notifications
```

Keep real secret files local: root `.env` for backend/local Docker, `frontend/.env` for local Vite. `api/.env` is optional for running `dotnet` from inside the `api` folder; after moving its values into the root `.env`, you can remove it locally.
