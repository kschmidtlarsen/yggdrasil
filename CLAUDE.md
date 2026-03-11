# Yggdrasil - Unified Self-Hosted Platform Stack

## Overview

Yggdrasil is the unified Docker stack that hosts all platform services on the Unraid server (192.168.0.20). It replaces the previous Vercel + Neon cloud infrastructure with a fully self-hosted solution.

**Norse Mythology Naming:**
- **Yggdrasil** - The World Tree (this stack)
- **Bifrost** - Rainbow Bridge (Docker network)
- **Urd** - Well of Fate (PostgreSQL database)
- **Mimir** - The Wise One (AI orchestration)

## Architecture

Direct routing - each app exposes its own port for Cloudflare Tunnel:

```
Internet → Cloudflare Tunnel → App:Port → Urd:5432
                                   ↓
                            [Bifrost Network]
```

## Port Scheme

**Internal tools (61xx):**
| Service | Container | Port | Domain |
|---------|-----------|------|--------|
| Kanban | yggdrasil-kanban | 6101 | kanban.exe.pm |
| Playwright | yggdrasil-playwright | 6102 | playwright.exe.pm |
| Mimir | yggdrasil-mimir | 6103 | mimir.exe.pm |
| pgAdmin | yggdrasil-pgadmin | 6104 | - |
| Umami | yggdrasil-umami | 6105 | umami.exe.pm |
| CoS | yggdrasil-cos | 6106 | cos.exe.pm |

**External sites (62xx):**
| Service | Container | Port | Domain |
|---------|-----------|------|--------|
| Calify | yggdrasil-calify | 6201 | calify.it |
| WODForge | yggdrasil-wodforge | 6202 | wodforge.exe.pm |
| Sorring 3D | yggdrasil-sorring3d | 6203 | sorring3d.dk |
| Sorring Udlejning | yggdrasil-sorring-udlejning | 6204 | sorringudlejning.dk |
| Grablist | yggdrasil-grablist | 6205 | grablist.org |
| Night Tales | yggdrasil-nighttales | 6206 | nighttales.cloud |

**Infrastructure:**
| Service | Container | Port | Notes |
|---------|-----------|------|-------|
| Urd (PostgreSQL) | yggdrasil-urd | 5439 | Database |

## Database Access

All apps connect to Urd via the Bifrost network:
```
postgresql://urd:<password>@urd:5432/<database>_db
```

Databases:
- kanban_db, calify_db, grablist_db
- nighttales_db, playwright_db
- sorring3d_db, sorring_udlejning_db, wodforge_db
- mimir_db, umami_db, cos_db

## Deployment

Managed via Portainer from GitHub:
1. Repository: https://github.com/kschmidtlarsen/yggdrasil
2. Stack deployed in Portainer with environment variables
3. Each app uses pre-built images from ghcr.io

## Adding a New App

1. Create `Dockerfile.yggdrasil` in the app directory
2. Add GitHub Actions workflow for ghcr.io builds
3. Add service definition to `docker-compose.yml` with appropriate port
4. Create database in Urd
5. Configure Cloudflare Tunnel for the domain
6. Redeploy stack via Portainer

## Health Checks

All services expose `/api/health` endpoints:

```bash
# Check individual services
curl http://192.168.0.20:6101/api/health  # kanban
curl http://192.168.0.20:6205/api/health  # grablist

# Check via Cloudflare
curl https://kanban.exe.pm/api/health
```

## Volumes

- `yggdrasil-urd-data` - PostgreSQL data
- `yggdrasil-pgadmin-data` - pgAdmin config
- `yggdrasil-sorring3d-uploads` - 3D model uploads
- `yggdrasil-sorring-udlejning-uploads` - Tool images

## Environment Variables

All secrets managed in Portainer stack environment. See `.env.example` for required variables.
