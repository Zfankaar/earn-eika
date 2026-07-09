const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

class Database {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.cache = null;
  }

  async _ensureFile() {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '[]', 'utf-8');
    }
  }

  async _read() {
    if (this.cache) return this.cache;
    await this._ensureFile();
    const raw = await fs.readFile(this.filePath, 'utf-8');
    this.cache = JSON.parse(raw);
    return this.cache;
  }

  async _write(data) {
    this.cache = data;
    await this._ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async findAll(filter = {}) {
    const data = await this._read();
    if (!Object.keys(filter).length) return data;
    return data.filter(item =>
      Object.entries(filter).every(([k, v]) => item[k] === v)
    );
  }

  async findOne(filter) {
    const data = await this._read();
    return data.find(item =>
      Object.entries(filter).every(([k, v]) => item[k] === v)
    ) || null;
  }

  async insertOne(doc) {
    const data = await this._read();
    data.push(doc);
    await this._write(data);
    return doc;
  }

  async updateOne(filter, update) {
    const data = await this._read();
    const idx = data.findIndex(item =>
      Object.entries(filter).every(([k, v]) => item[k] === v)
    );
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...update };
    await this._write(data);
    return data[idx];
  }

  async updateMany(filter, update) {
    const data = await this._read();
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (Object.entries(filter).every(([k, v]) => data[i][k] === v)) {
        data[i] = { ...data[i], ...update };
        count++;
      }
    }
    if (count) await this._write(data);
    return count;
  }

  async deleteOne(filter) {
    const data = await this._read();
    const idx = data.findIndex(item =>
      Object.entries(filter).every(([k, v]) => item[k] === v)
    );
    if (idx === -1) return false;
    data.splice(idx, 1);
    await this._write(data);
    return true;
  }

  async count(filter = {}) {
    const data = await this._read();
    if (!Object.keys(filter).length) return data.length;
    return data.filter(item =>
      Object.entries(filter).every(([k, v]) => item[k] === v)
    ).length;
  }

  async aggregate(pipeline) {
    let data = await this._read();
    for (const stage of pipeline) {
      if (stage.$match) {
        data = data.filter(item =>
          Object.entries(stage.$match).every(([k, v]) => item[k] === v)
        );
      }
      if (stage.$sort) {
        const key = Object.keys(stage.$sort)[0];
        const dir = stage.$sort[key];
        data.sort((a, b) => dir * String(a[key]).localeCompare(String(b[key])));
      }
      if (stage.$limit) {
        data = data.slice(0, stage.$limit);
      }
    }
    return data;
  }

  clearCache() {
    this.cache = null;
  }
}

const db = {
  users: new Database('users'),
  withdrawals: new Database('withdrawals'),
  earnings: new Database('earnings'),
  referrals: new Database('referrals'),
  adminLogs: new Database('admin_logs'),
  broadcasts: new Database('broadcasts'),
};

module.exports = { db, Database };
