/**
 * Uptime Kuma Socket.IO client
 * Wraps the Socket.IO API for monitor management
 */
const { io } = require('socket.io-client');

const KUMA_URL = process.env.UPTIME_KUMA_URL || 'http://192.168.0.20:3001';
const KUMA_USER = process.env.UPTIME_KUMA_USERNAME || 'kristian';
const KUMA_PASS = process.env.UPTIME_KUMA_PASSWORD;

const MANAGED_TAG = 'yggdrasil';
const MANAGED_TAG_COLOR = '#4d9f60';

class KumaClient {
  constructor() {
    this.socket = null;
    this.monitors = {};
    this.notifications = [];
    this.tags = [];
    this.managedTagId = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(KUMA_URL, {
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 3,
      });

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 30000);

      this.socket.on('connect', () => {
        this.socket.emit('login', {
          username: KUMA_USER,
          password: KUMA_PASS,
          token: '',
        }, (res) => {
          if (!res.ok) {
            clearTimeout(timeout);
            reject(new Error(`Login failed: ${res.msg}`));
            return;
          }
          this.jwtToken = res.token;
          // Wait for monitorList to arrive
          this.socket.once('monitorList', (list) => {
            this.monitors = list;
            clearTimeout(timeout);
            resolve();
          });
        });
      });

      this.socket.on('notificationList', (list) => {
        this.notifications = list;
      });

      this.socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Connection failed: ${err.message}`));
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  _emit(event, ...args) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`${event} timeout`)), 15000);
      this.socket.emit(event, ...args, (res) => {
        clearTimeout(timeout);
        if (res.ok) resolve(res);
        else reject(new Error(res.msg || `${event} failed`));
      });
    });
  }

  // For events where Kuma may not call back (delete, pause, resume)
  _emitFireAndForget(event, ...args) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve({ ok: true }), 2000);
      this.socket.emit(event, ...args, (res) => {
        clearTimeout(timeout);
        resolve(res);
      });
    });
  }

  // Tag management

  async ensureManagedTag() {
    const res = await this._emit('getTags');
    this.tags = res.tags || [];
    const existing = this.tags.find(t => t.name === MANAGED_TAG);
    if (existing) {
      this.managedTagId = existing.id;
      return existing.id;
    }
    const addRes = await this._emit('addTag', { new: true, name: MANAGED_TAG, color: MANAGED_TAG_COLOR });
    this.managedTagId = addRes.tag.id;
    return this.managedTagId;
  }

  // Monitor CRUD

  async addMonitor(monitor) {
    // Kuma validates tags strictly - only include if we have a tag ID
    // and use the exact format Kuma expects
    return this._emit('add', monitor);
  }

  async addMonitorWithTag(monitor) {
    const res = await this.addMonitor(monitor);
    if (this.managedTagId && res.monitorID) {
      try {
        await this._emit('addMonitorTag', this.managedTagId, res.monitorID, 'managed');
      } catch { /* tag linking is non-critical */ }
    }
    return res;
  }

  async editMonitor(monitor) {
    return this._emit('editMonitor', monitor);
  }

  async deleteMonitor(id) {
    return this._emitFireAndForget('deleteMonitor', id);
  }

  async pauseMonitor(id) {
    return this._emitFireAndForget('pauseMonitor', id);
  }

  async resumeMonitor(id) {
    return this._emitFireAndForget('resumeMonitor', id);
  }

  // Queries

  getMonitors() {
    return Object.values(this.monitors);
  }

  getManagedMonitors() {
    return this.getMonitors().filter(m => {
      // Check tag first
      if (m.tags && m.tags.some(t => t.tag_id === this.managedTagId)) return true;
      // Fallback: check description
      return m.description && m.description.includes('Managed by Eir kuma-sync');
    });
  }

  findMonitorByName(name) {
    return this.getMonitors().find(m => m.name === name);
  }

  getNotifications() {
    return this.notifications;
  }

  // Refresh monitor list
  async refreshMonitors() {
    return new Promise((resolve) => {
      this.socket.once('monitorList', (list) => {
        this.monitors = list;
        resolve(list);
      });
      // Trigger a refresh by requesting settings (side effect: monitorList re-sent)
      this.socket.emit('getMonitorList', () => {});
      // Fallback: resolve after a short wait if no event arrives
      setTimeout(() => resolve(this.monitors), 3000);
    });
  }
}

module.exports = { KumaClient, MANAGED_TAG };
