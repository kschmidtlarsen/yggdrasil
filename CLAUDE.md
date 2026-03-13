# Yggdrasil - Unified Self-Hosted Platform Stack

## Overview

Yggdrasil is the unified Docker stack that hosts all platform services on the Unraid server (192.168.0.20). It replaces the previous Vercel + Neon cloud infrastructure with a fully self-hosted solution.

**Norse Mythology Naming:**
- **Yggdrasil** - The World Tree (this stack / docker-compose)
- **Bifrost** - Rainbow Bridge (Docker bridge network)
- **Urd** - Well of Fate (PostgreSQL 17 database)
- **Mimir** - The Wise One (AI orchestration / monitoring)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Developer Machine (/websites/)                             │
│         │                                                    │
│         ▼ git push                                           │
│   ┌─────────────┐                                           │
│   │   GitHub    │ ← Source control + CI/CD                  │
│   └──────┬──────┘                                           │
│          │ GitHub Actions                                    │
│          ▼ Build Docker image → Push to registry            │
│   ┌──────────────────────────────────────┐                  │
│   │         Yggdrasil Stack              │                  │
│   │  (Docker on Unraid - 192.168.0.20)   │                  │
│   │                                      │                  │
│   │  ┌──────────────┐  ┌─────────────┐  │                  │
│   │  │  Watchtower  │  │     Urd     │  │                  │
│   │  │ (auto-update)│  │(PostgreSQL) │  │                  │
│   │  └──────┬───────┘  └──────┬──────┘  │                  │
│   │         │                  │         │                  │
│   │         ▼                  │         │                  │
│   │  ┌─────────────────────────┴──────┐  │                  │
│   │  │  App Containers (Bifrost net)  │  │                  │
│   │  │  Kanban, Calify, WODForge...   │  │                  │
│   │  └────────────────────────────────┘  │                  │
│   │                                      │                  │
│   │  ┌──────────────┐                   │                  │
│   │  │  Portainer   │ ← Manual control  │                  │
│   │  └──────────────┘                   │                  │
│   └──────────────┬───────────────────────┘                  │
│                  │                                           │
│                  ▼                                           │
│          ┌──────────────┐                                    │
│          │  Cloudflare  │ ← Tunnel + Access protection      │
│          │  Tunnel      │                                    │
│          └──────┬───────┘                                    │
│                 │                                            │
│                 ▼                                            │
│            Internet                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Infrastructure Map:** `/home/coder/.claude/infrastructure.yml` (single source of truth)

## Port Scheme

**Port Allocation:**
- **61xx** - Internal tools (.exe.pm domains, Cloudflare Access protected)
- **62xx** - External websites (public domains)
- **5439** - PostgreSQL (Urd) external access
- **9000** - Portainer web UI

**Internal tools (61xx):**
| Service | Container | Port | Domain |
|---------|-----------|------|--------|
| Kanban | yggdrasil-kanban | 6101 | kanban.exe.pm |
| Playwright | yggdrasil-playwright | 6102 | playwright.exe.pm |
| Mimir | yggdrasil-mimir | 6103 | mimir.exe.pm |
| pgAdmin | yggdrasil-pgadmin | 6104 | pgadmin.exe.pm |
| Umami | yggdrasil-umami | 6105 | umami.exe.pm |
| CoS | yggdrasil-cos | 6106 | cos.exe.pm |
| Chrome | yggdrasil-chrome | 6107 | — (CDP only) |

**External sites (62xx):**
| Service | Container | Port | Domain |
|---------|-----------|------|--------|
| Calify | yggdrasil-calify | 6201 | calify.it |
| WODForge | yggdrasil-wodforge | 6202 | wodforge.exe.pm |
| Sorring 3D | yggdrasil-sorring3d | 6203 | sorring3d.dk |
| Sorring Udlejning | yggdrasil-sorring-udlejning | 6204 | sorringudlejning.dk |
| Grablist | yggdrasil-grablist | 6205 | grablist.org |
| Night Tales | yggdrasil-nighttales | 6206 | nighttales.cloud |
| Schmidt Larsen | yggdrasil-schmidt-larsen | 6207 | schmidtlarsen.dk |

**Infrastructure:**
| Service | Container | Port | Notes |
|---------|-----------|------|-------|
| Urd (PostgreSQL) | yggdrasil-urd | 5439 | Database |
| Portainer | — | 9000 | Container management UI |

## Database Access (Urd)

**External Access:** 192.168.0.20:5439
**Internal Access:** urd:5432 (via Bifrost network)
**Credentials:** Stored in `/home/coder/.claude/.env`
**Database Naming:** `{projectname}_db`

**Connection String Format (Internal — from containers):**
```
postgresql://urd:{password}@urd:5432/{database}?sslmode=disable
```

**Connection String Format (External — from dev machine):**
```
postgresql://urd:{password}@192.168.0.20:5439/{database}?sslmode=disable
```

**Databases:**
| Project | Database | Schema |
|---------|----------|--------|
| kanban | kanban_db | public |
| playwright | playwright_db | public |
| umami | umami_db | public |
| cos | cos_db | public |
| mimir | mimir_db | public |
| calify | calify_db | public |
| wodforge | wodforge_db | public |
| sorring3d | sorring3d_db | public |
| sorring-udlejning | sorring_db | public |
| grablist | grablist_db | public |
| nighttales | nighttales_db | public |

## Service Reference

### Portainer

**Web UI:** http://192.168.0.20:9000
**Purpose:** Manual container management, stack configuration, image rollback

**Common Operations:**
- View container logs
- Restart containers
- Update environment variables
- Roll back to previous image
- Monitor resource usage

### Watchtower

**Purpose:** Automated container updates
**Interval:** 5 minutes
**Trigger:** Detects new images in registry, pulls and restarts containers

**Deployment Flow:**
1. Developer pushes to GitHub `main` branch
2. GitHub Actions builds Docker image and pushes to registry
3. Watchtower detects new image within 5 minutes
4. Watchtower pulls image and restarts container
5. Health endpoint shows new BUILD_COMMIT

### Cloudflare

**Dashboard:** https://dash.cloudflare.com
**Domains:** exe.pm, calify.it, grablist.org, wodforge.dk, sorringudlejning.dk

**Cloudflare Tunnel:** Routes traffic from internet to Yggdrasil (192.168.0.20)

**DNS Setup:**
```
Type: CNAME
Name: {subdomain}
Target: {tunnel-id}.cfargotunnel.com
Proxy: Enabled (orange cloud)
```

**Cloudflare Access:** Protected sites (.exe.pm) require service token headers:
```bash
CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}
CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}
```

Internal tools (61xx ports) protected:
- kanban.exe.pm, playwright.exe.pm, mimir.exe.pm, pgadmin.exe.pm, umami.exe.pm, cos.exe.pm

Public sites (62xx ports, no Access):
- calify.it, wodforge.exe.pm, sorring3d.dk, sorringudlejning.dk, grablist.org, nighttales.cloud

## Secret Management

**Centralized Store:** `/home/coder/.claude/.env`

**Format:**
- Shared secrets (no prefix): `GITHUB_TOKEN`, `SONAR_TOKEN`, `CF_ACCESS_CLIENT_ID`
- Project-specific secrets: `{PROJECTNAME}_SECRET_NAME`
- Portainer stack references these values when deploying

**Example:**
```bash
# Shared
GITHUB_TOKEN=ghp_...
SONAR_TOKEN=...

# Yggdrasil Infrastructure
PORTAINER_URL=http://192.168.0.20:9000
PORTAINER_API_KEY=ptr_...
URD_HOST=192.168.0.20
URD_PORT=5439
URD_USER=urd
URD_PASSWORD=...

# Project-specific
CALIFY_DATABASE_URL=postgresql://urd:...@urd:5432/calify_db?sslmode=disable
CALIFY_JWT_SECRET=...
CALIFY_RESEND_API_KEY=...
```

## CI/CD Pipeline

```
Code Push → GitHub Actions → Build Docker Image → Push to ghcr.io → Watchtower → Auto-deploy
```

**GitHub Actions Workflow:** Each app has `.github/workflows/docker.yml` that:
1. Runs tests
2. Builds from `Dockerfile.yggdrasil`
3. Tags with commit SHA and `:latest`
4. Pushes to `ghcr.io/kschmidtlarsen/<app>`
5. Triggers on push to main

**Organization:** kschmidtlarsen

**Check build status:**
```bash
gh run list --repo kschmidtlarsen/<app> --limit 1
```

## Build Tracking

All services expose build metadata via `/api/health`:

```json
{
  "status": "ok",
  "timestamp": "2026-03-12T10:30:00Z",
  "database": "connected",
  "build": {
    "commit": "a1b2c3d4e5f6...",
    "timestamp": "2026-03-12T10:25:00Z",
    "version": "1.2.3"
  }
}
```

**Purpose:**
- Verify deployment succeeded
- Cache-busting for frontend assets
- Deployment tracking in Kanban cards

**Check individual services:**
```bash
curl http://192.168.0.20:6101/api/health  # kanban
curl http://192.168.0.20:6205/api/health  # grablist
curl https://kanban.exe.pm/api/health     # via Cloudflare
```

## Adding a New App

1. Create `Dockerfile.yggdrasil` in the app directory
2. Add GitHub Actions workflow (`.github/workflows/docker.yml`) for ghcr.io builds
3. Add service definition to `docker-compose.yml` with appropriate port (next in 61xx/62xx)
4. Create database in Urd (see Common Tasks below)
5. Add connection string to `/home/coder/.claude/.env`
6. Configure Cloudflare Tunnel for the domain
7. Redeploy stack via Portainer

## Common Tasks

### Deploy a Project
```bash
cd /websites/{project}
git add .
git commit -m "Description"
git push origin main

# GitHub Actions builds Docker image
# Watchtower auto-deploys within 5 minutes
```

### Check Deployment Status
```bash
# Via GitHub Actions
gh run list --repo kschmidtlarsen/{project} --limit 1

# Via health endpoint
curl -sL https://{domain}/api/health | jq '.build'
```

### Create New Database
```bash
# Connect to Urd
psql -h 192.168.0.20 -p 5439 -U urd -W

# Create database
CREATE DATABASE {projectname}_db;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE {projectname}_db TO urd;

# Add connection string to /home/coder/.claude/.env
{PROJECTNAME}_DATABASE_URL=postgresql://urd:{password}@urd:5432/{projectname}_db?sslmode=disable
```

### Manual Container Restart
```bash
# Via Portainer
# 1. Open http://192.168.0.20:9000
# 2. Navigate to Containers
# 3. Select container → Restart

# Via Docker CLI (if needed)
docker restart yggdrasil-{service}-1
```

### Rollback Deployment
```bash
# Option 1: Git revert (preferred)
git revert HEAD
git push origin main
# Watchtower auto-deploys reverted code within 5 minutes

# Option 2: Portainer manual rollback
# 1. Open http://192.168.0.20:9000
# 2. Navigate to Containers → {service}
# 3. Click "Recreate" and select previous image tag
```

### View Container Logs
```bash
# Via Portainer
# 1. Open http://192.168.0.20:9000
# 2. Navigate to Containers → {service}
# 3. Click "Logs"

# Via Docker CLI
docker logs yggdrasil-{service}-1 --tail 100 -f
```

## Volumes

- `yggdrasil-urd-data` - PostgreSQL data
- `yggdrasil-pgadmin-data` - pgAdmin config
- `yggdrasil-sorring3d-uploads` - 3D model uploads
- `yggdrasil-sorring-udlejning-uploads` - Tool images

## Troubleshooting

**Container not starting:**
```bash
# Check container logs in Portainer or via API
curl http://192.168.0.20:<port>/api/health
docker logs yggdrasil-{service}-1 --tail 100
```

**Frontend shows "Not Found":**
- Ensure container has latest image (force pull in Portainer)
- Check `frontendPath` in server.js uses production path

**502 Bad Gateway via Cloudflare:**
- Container is down or not responding
- Check Cloudflare Tunnel points to `http://192.168.0.20:<port>`

**Database connection issues:**
- Verify database exists in Urd
- Check DATABASE_URL in Portainer environment
- Test external connectivity: `psql -h 192.168.0.20 -p 5439 -U urd -W`

## CLI Tools

Available on the development machine:
- `gh` - GitHub CLI (repos, actions, PRs)
- `psql` - PostgreSQL client
- `curl` - HTTP requests
- `docker` - Container management (when on host)
- `jq` - JSON processing
