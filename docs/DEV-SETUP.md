# Development Setup for Lobe Chat

This guide helps you run Lobe Chat locally with `pnpm dev` while all infrastructure services run in Docker.

## Quick Start

1. **Start infrastructure services:**

   ```bash
   ./start-dev-services.sh
   ```

2. **Configure environment:**

   ```bash
   cp .env.dev.example .env.local
   # Edit .env.local and add your API keys
   ```

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Setup database:**

   ```bash
   pnpm db:migrate
   ```

5. **Start development:**
   ```bash
   pnpm dev
   ```

## Services

| Service       | URL                     | Default Credentials          |
| ------------- | ----------------------- | ---------------------------- |
| PostgreSQL    | localhost:5432          | postgres / lobe_password_123 |
| Redis         | localhost:6379          | -                            |
| MinIO         | <http://localhost:9000> | minioadmin / minioadmin123   |
| MinIO Console | <http://localhost:9001> | minioadmin / minioadmin123   |
| Casdoor       | <http://localhost:8000> | admin / 123                  |

## Casdoor Setup

1. Access <http://localhost:8000>
2. Create new application
3. Set redirect URL: `http://localhost:3010/api/auth/callback/casdoor`
4. Copy Client ID and Secret to .env.local

## Commands

```bash
# View logs
docker-compose -f docker-compose-dev-services.yml logs -f

# Stop services
docker-compose -f docker-compose-dev-services.yml down

# Reset everything
docker-compose -f docker-compose-dev-services.yml down -v
rm -rf data/*
```

## Troubleshooting

- **Port conflicts**: Check if ports 5432, 6379, 8000, 9000, 9001 are free
- **Memory issues**: Ensure Docker has at least 4GB RAM allocated
- **CSP errors**: Already disabled with NEXT_PUBLIC_CSP_DISABLED=true
