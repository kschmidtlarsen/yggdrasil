# Yggdrasil - Unified Self-Hosted Platform Stack

## Overview

Yggdrasil is the unified Docker stack that hosts all platform services on the Unraid server (192.168.0.20). It replaces the previous Vercel + Neon cloud infrastructure with a fully self-hosted solution.

**Norse Mythology Naming:**
- **Yggdrasil** - The World Tree (this stack)
- **Bifrost** - Rainbow Bridge (Docker network)
- **Heimdall** - Guardian of Bifrost (Caddy reverse proxy)
- **Urd** - Well of Fate (PostgreSQL database)
- **Mimir** - The Wise One (AI orchestration)

## Architecture

```
Internet → Cloudflare → Heimdall:80 → App Containers → Urd:5432
                            ↓
                      [Bifrost Network]
```

## Services

| Service | Container | Port | Domain |
|---------|-----------|------|--------|
| Heimdall (Caddy) | yggdrasil-heimdall | 80, 443 | - |
| Urd (PostgreSQL) | yggdrasil-urd | 5439 | - |
| pgAdmin | yggdrasil-pgadmin | 5480 | - |
| Mimir | yggdrasil-mimir | 793 | mimir.exe.pm |
| Kanban | yggdrasil-kanban | - | kanban.exe.pm |
| Calify | yggdrasil-calify | - | calify.it |
| Grablist | yggdrasil-grablist | - | grablist.org |
| CoS | yggdrasil-cos | - | cos.exe.pm |
| Night Tales | yggdrasil-nighttales | - | nighttales.cloud |
| Playwright | yggdrasil-playwright | - | playwright.exe.pm |
| Schmidt Larsen | yggdrasil-schmidtlarsen | - | schmidtlarsen.dk |
| Sorring 3D | yggdrasil-sorring3d | - | sorring3d.dk |
| Sorring Udlejning | yggdrasil-sorring-udlejning | - | sorringudlejning.dk |
| WODForge | yggdrasil-wodforge | - | wodforge.exe.pm |
| WebSocket Hub | yggdrasil-websocket-hub | - | websocket.exe.pm |

## Database Access

All apps connect to Urd via the Bifrost network:
```
postgresql://urd:<password>@urd:5432/<database>_db
```

Databases:
- kanban_db, calify_db, grablist_db, cos_db
- nighttales_db, playwright_db, schmidtlarsen_db
- sorring3d_db, sorring_udlejning_db, wodforge_db, mimir_db

## Deployment

Managed via Portainer from GitHub:
1. Repository: https://github.com/kschmidtlarsen/yggdrasil
2. Stack deployed in Portainer with environment variables
3. Each app builds from its own directory using Dockerfile.yggdrasil

## Adding a New App

1. Create `Dockerfile.yggdrasil` in the app directory (copy from template)
2. Add service definition to `docker-compose.yml`
3. Add routing rule to `Caddyfile`
4. Create database in Urd
5. Redeploy stack via Portainer

## Health Checks

All services expose `/api/health` endpoints. Heimdall monitors backend health.

```bash
# Check individual services
curl http://localhost:3000/api/health  # from within container

# Check via Heimdall
curl https://kanban.exe.pm/api/health
```

## Volumes

- `yggdrasil-urd-data` - PostgreSQL data
- `yggdrasil-pgadmin-data` - pgAdmin config
- `yggdrasil-caddy-data` - Caddy certificates
- `yggdrasil-sorring3d-uploads` - 3D model uploads
- `yggdrasil-sorring-udlejning-uploads` - Tool images

## Environment Variables

All secrets managed in Portainer stack environment. See `.env.example` for required variables.
