#!/usr/bin/env node
/**
 * Uptime Kuma monitor sync tool
 *
 * Usage:
 *   node kuma-sync.js sync       Sync monitors to match config (create/delete)
 *   node kuma-sync.js status     Show current monitor status
 *   node kuma-sync.js pause <slug|all>    Pause monitors for a service
 *   node kuma-sync.js resume <slug|all>   Resume monitors for a service
 *   node kuma-sync.js nuke       Delete ALL managed monitors (tagged yggdrasil)
 *   node kuma-sync.js cleanup    Delete old unmanaged Yggdrasil monitors
 */
const path = require('path');

// Load env
require('dotenv').config({ path: '/app/.env', override: false });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.claude', '.env'), override: false });
require('dotenv').config({ path: '/home/coder/.claude/.env', override: false });

const { KumaClient, MANAGED_TAG } = require('./kuma-client');
const { buildMonitors, SERVICES } = require('./kuma-monitors');

// IDs to never touch (Void group, Pi Hole, Home Assistant and their children)
const PROTECTED_IDS = new Set();
const PROTECTED_PARENT_IDS = new Set();

async function identifyProtected(client) {
  const monitors = client.getMonitors();
  for (const m of monitors) {
    if (m.name === 'Void' || m.name === 'Pi Hole' || m.name === 'Home Assistant') {
      PROTECTED_IDS.add(m.id);
      PROTECTED_PARENT_IDS.add(m.id);
    }
  }
  for (const m of monitors) {
    if (PROTECTED_PARENT_IDS.has(m.parent)) {
      PROTECTED_IDS.add(m.id);
    }
  }
}

async function cleanup(client) {
  const monitors = client.getMonitors();
  await identifyProtected(client);

  const oldNames = SERVICES.map(s => s.name);
  const toDelete = monitors.filter(m => {
    if (PROTECTED_IDS.has(m.id)) return false;
    const isOldGroup = oldNames.some(n => m.name === n || m.name.startsWith(n + ' - '));
    const hasTag = m.tags && m.tags.some(t => t.name === MANAGED_TAG);
    return isOldGroup && !hasTag;
  });

  if (toDelete.length === 0) {
    console.log('No old monitors to clean up.');
    return;
  }

  const children = toDelete.filter(m => m.type !== 'group');
  const groups = toDelete.filter(m => m.type === 'group');

  for (const m of children) {
    console.log(`  Deleting: ${m.name} (id:${m.id})`);
    await client.deleteMonitor(m.id);
  }
  for (const m of groups) {
    console.log(`  Deleting group: ${m.name} (id:${m.id})`);
    await client.deleteMonitor(m.id);
  }
  console.log(`Cleaned up ${toDelete.length} old monitors.`);
}

async function nuke(client) {
  await client.ensureManagedTag();
  const managed = client.getManagedMonitors();

  if (managed.length === 0) {
    console.log('No managed monitors to delete.');
    return;
  }

  const children = managed.filter(m => m.type !== 'group');
  const groups = managed.filter(m => m.type === 'group');

  for (const m of children) {
    console.log(`  Deleting: ${m.name} (id:${m.id})`);
    await client.deleteMonitor(m.id);
  }
  for (const m of groups) {
    console.log(`  Deleting group: ${m.name} (id:${m.id})`);
    await client.deleteMonitor(m.id);
  }
  console.log(`Nuked ${managed.length} managed monitors.`);
}

async function sync(client) {
  const tagId = await client.ensureManagedTag();
  const desired = buildMonitors();
  const existing = client.getMonitors();

  let created = 0;
  let skipped = 0;

  for (const svc of desired) {
    let group = existing.find(m => m.name === svc.group.name && m.type === 'group');

    if (!group) {
      console.log(`  Creating group: ${svc.group.name}`);
      const res = await client.addMonitorWithTag(svc.group);
      group = { id: res.monitorID, name: svc.group.name };
      created++;
    } else {
      skipped++;
    }

    for (const child of svc.children) {
      const existingChild = existing.find(m => m.name === child.name && m.parent === group.id);
      if (existingChild) {
        skipped++;
        continue;
      }

      const byName = existing.find(m => m.name === child.name);
      if (byName) {
        skipped++;
        continue;
      }

      console.log(`  Creating: ${child.name}`);
      await client.addMonitorWithTag({ ...child, parent: group.id });
      created++;

      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\nSync complete: ${created} created, ${skipped} already exist.`);
}

async function status(client) {
  await client.ensureManagedTag();
  const managed = client.getManagedMonitors();
  const all = client.getMonitors();

  console.log(`\nUptime Kuma: ${all.length} total monitors, ${managed.length} managed (tagged: ${MANAGED_TAG})\n`);

  const groups = managed.filter(m => m.type === 'group');
  const children = managed.filter(m => m.type !== 'group');

  for (const g of groups) {
    const kids = children.filter(c => c.parent === g.id);
    const active = kids.filter(k => k.active).length;
    const paused = kids.length - active;
    const gStatus = g.active ? 'ACTIVE' : 'PAUSED';
    console.log(`[${gStatus}] ${g.name} (${active} active, ${paused} paused)`);
    for (const k of kids) {
      const s = k.active ? '  OK' : '  --';
      console.log(`  ${s}  ${k.name} (${k.type}, every ${k.interval}s)`);
    }
  }

  const orphans = children.filter(c => !groups.find(g => g.id === c.parent));
  if (orphans.length > 0) {
    console.log('\nOrphaned monitors:');
    for (const o of orphans) {
      console.log(`  ${o.name} (id:${o.id})`);
    }
  }
}

async function pauseResume(client, action, slug) {
  await client.ensureManagedTag();
  const managed = client.getManagedMonitors();

  let targets;
  if (slug === 'all') {
    targets = managed;
  } else {
    targets = managed.filter(m =>
      m.description && m.description.includes(`service:${slug}`)
    );
  }

  if (targets.length === 0) {
    console.log(`No managed monitors found for: ${slug}`);
    console.log(`Available slugs: ${SERVICES.map(s => s.slug).join(', ')}`);
    return;
  }

  for (const m of targets) {
    if (action === 'pause' && m.active) {
      console.log(`  Pausing: ${m.name}`);
      await client.pauseMonitor(m.id);
    } else if (action === 'resume' && !m.active) {
      console.log(`  Resuming: ${m.name}`);
      await client.resumeMonitor(m.id);
    }
  }
  console.log(`${action === 'pause' ? 'Paused' : 'Resumed'} ${targets.length} monitors for: ${slug}`);
}

async function main() {
  const [command, arg] = process.argv.slice(2);

  if (!command || !['sync', 'status', 'pause', 'resume', 'nuke', 'cleanup'].includes(command)) {
    console.log(`Usage: node kuma-sync.js <command> [slug]

Commands:
  sync              Create monitors from config (idempotent)
  status            Show managed monitor status
  pause <slug|all>  Pause monitors for a service (or all)
  resume <slug|all> Resume monitors for a service (or all)
  nuke              Delete ALL managed monitors
  cleanup           Delete old unmanaged Yggdrasil monitors

Slugs: ${SERVICES.map(s => s.slug).join(', ')}
`);
    process.exit(1);
  }

  if ((command === 'pause' || command === 'resume') && !arg) {
    console.log(`Usage: node kuma-sync.js ${command} <slug|all>`);
    process.exit(1);
  }

  const client = new KumaClient();
  try {
    console.log('Connecting to Uptime Kuma...');
    await client.connect();
    console.log('Connected.\n');

    switch (command) {
      case 'cleanup':
        await cleanup(client);
        break;
      case 'nuke':
        await nuke(client);
        break;
      case 'sync':
        await sync(client);
        break;
      case 'status':
        await status(client);
        break;
      case 'pause':
      case 'resume':
        await pauseResume(client, command, arg);
        break;
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.disconnect();
  }
}

main();
