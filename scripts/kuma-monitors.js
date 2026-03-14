/**
 * Uptime Kuma monitor definitions for Yggdrasil platform
 *
 * Each service defines what monitors should exist.
 * The sync script creates groups + child monitors from this config.
 *
 * Health endpoint response formats vary across services:
 *   - Most return {"status":"ok",...}
 *   - Grablist returns {"status":"healthy",...,"database":{"connected":true,...}}
 *   - Playwright returns {"status":"healthy",...}
 *   - Eir returns {"status":"ok",...,"database":"connected",...}
 *   - Some have no database field at all
 *
 * Strategy: use keyword monitors checking for "status" value in response.
 * Only add DB monitors for services that expose database status reliably.
 */

const HOST = '192.168.0.20';

// Notification IDs to attach to all monitors (Home Assistant)
const DEFAULT_NOTIFICATIONS = { '1': true };

const SERVICES = [
  // ── Infrastructure ──
  {
    name: 'Urd Database',
    slug: 'urd',
    type: 'infrastructure',
    monitors: [
      { suffix: 'PostgreSQL', type: 'port', hostname: HOST, port: 5439, interval: 60 },
    ],
  },
  {
    name: 'Eir Backup',
    slug: 'eir',
    type: 'infrastructure',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6108/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'DB Connected', type: 'keyword', url: `http://${HOST}:6108/api/health`, keyword: '"database":"connected"', interval: 120 },
      { suffix: 'External', type: 'http', url: 'https://backup.exe.pm', interval: 300 },
    ],
  },

  // ── Internal Tools (61xx) ──
  {
    name: 'Kanban Board',
    slug: 'kanban',
    type: 'internal',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6101/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://kanban.exe.pm', interval: 300 },
    ],
  },
  {
    name: 'Playwright E2E',
    slug: 'playwright',
    type: 'internal',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6102/api/health`, keyword: '"status":"healthy"', interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://playwright.exe.pm', interval: 300 },
    ],
  },
  {
    name: 'Mimir AI',
    slug: 'mimir',
    type: 'internal',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6103/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'DB Connected', type: 'keyword', url: `http://${HOST}:6103/api/health`, keyword: '"database":"connected"', interval: 120 },
      { suffix: 'External', type: 'http', url: 'https://mimir.exe.pm', interval: 300 },
    ],
  },
  {
    name: 'pgAdmin',
    slug: 'pgadmin',
    type: 'internal',
    monitors: [
      { suffix: 'Internal', type: 'http', url: `http://${HOST}:6104`, interval: 120 },
    ],
  },
  {
    name: 'Umami Analytics',
    slug: 'umami',
    type: 'internal',
    monitors: [
      { suffix: 'Internal Health', type: 'http', url: `http://${HOST}:6105/api/heartbeat`, interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://umami.exe.pm', interval: 300 },
    ],
  },
  {
    name: 'Chief of Staff',
    slug: 'cos',
    type: 'internal',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6106/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://cos.exe.pm', interval: 300 },
    ],
  },
  {
    name: 'Chrome DevTools',
    slug: 'chrome',
    type: 'internal',
    monitors: [
      { suffix: 'CDP', type: 'http', url: `http://${HOST}:6107/json/version`, interval: 120 },
    ],
  },

  // ── External Sites (62xx) ──
  {
    name: 'Calify',
    slug: 'calify',
    type: 'external',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6201/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'DB Connected', type: 'keyword', url: `http://${HOST}:6201/api/health`, keyword: '"status":"healthy"', interval: 120 },
      { suffix: 'External', type: 'http', url: 'https://calify.it', interval: 300 },
    ],
  },
  {
    name: 'WODForge',
    slug: 'wodforge',
    type: 'external',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6202/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://wodforge.exe.pm', interval: 300 },
    ],
  },
  {
    name: 'Sorring 3D',
    slug: 'sorring3d',
    type: 'external',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6203/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://sorring3d.dk', interval: 300 },
    ],
  },
  {
    name: 'Sorring Udlejning',
    slug: 'sorring-udlejning',
    type: 'external',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6204/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://sorringudlejning.dk', interval: 300 },
    ],
  },
  {
    name: 'Grablist',
    slug: 'grablist',
    type: 'external',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6205/api/health`, keyword: '"status":"healthy"', interval: 60 },
      { suffix: 'DB Connected', type: 'keyword', url: `http://${HOST}:6205/api/health`, keyword: '"connected":true', interval: 120 },
      { suffix: 'External', type: 'http', url: 'https://grablist.org', interval: 300 },
    ],
  },
  {
    name: 'Night Tales',
    slug: 'nighttales',
    type: 'external',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6206/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://nighttales.cloud/api/health', interval: 300 },
    ],
  },
  {
    name: 'Schmidt Larsen',
    slug: 'schmidt-larsen',
    type: 'external',
    monitors: [
      { suffix: 'Internal Health', type: 'keyword', url: `http://${HOST}:6207/api/health`, keyword: '"status":"ok"', interval: 60 },
      { suffix: 'External', type: 'http', url: 'https://schmidtlarsen.dk', interval: 300 },
    ],
  },
];

/**
 * Build full monitor objects from service definitions
 */
function buildMonitors(services = SERVICES) {
  const result = [];

  for (const svc of services) {
    // Group monitor
    const groupName = svc.name;
    const children = svc.monitors.map(m => {
      const childName = `${svc.name} - ${m.suffix}`;
      const base = {
        name: childName,
        active: true,
        url: 'https://',
        interval: m.interval || 60,
        retryInterval: 60,
        maxretries: 2,
        accepted_statuscodes: ['200-299'],
        notificationIDList: DEFAULT_NOTIFICATIONS,
        description: `Managed by Eir kuma-sync | service:${svc.slug}`,
      };

      switch (m.type) {
        case 'http':
          return {
            ...base,
            type: 'http',
            url: m.url,
            maxredirects: 10,
            accepted_statuscodes: ['200-299'],
            timeout: 30,
          };
        case 'keyword':
          return {
            ...base,
            type: 'keyword',
            url: m.url,
            keyword: m.keyword,
            maxredirects: 10,
            accepted_statuscodes: ['200-299'],
            timeout: 30,
          };
        case 'json-query':
          return {
            ...base,
            type: 'json-query',
            url: m.url,
            jsonPath: m.jsonPath,
            expectedValue: m.expectedValue,
            maxredirects: 10,
            accepted_statuscodes: ['200-299'],
            timeout: 30,
          };
        case 'port':
          return {
            ...base,
            type: 'port',
            hostname: m.hostname,
            port: m.port,
            timeout: 30,
          };
        case 'postgres':
          return {
            ...base,
            type: 'postgres',
            databaseConnectionString: m.connectionString,
            databaseQuery: m.query || 'SELECT 1',
            timeout: 30,
          };
        default:
          return { ...base, type: m.type, url: m.url };
      }
    });

    result.push({
      group: {
        name: groupName,
        type: 'group',
        active: true,
        interval: 60,
        url: 'https://',
        maxretries: 0,
        retryInterval: 60,
        accepted_statuscodes: ['200-299'],
        description: `Managed by Eir kuma-sync | service:${svc.slug} | type:${svc.type}`,
        notificationIDList: DEFAULT_NOTIFICATIONS,
      },
      children,
      slug: svc.slug,
    });
  }

  return result;
}

module.exports = { SERVICES, buildMonitors, DEFAULT_NOTIFICATIONS };
