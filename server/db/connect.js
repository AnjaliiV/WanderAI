'use strict';
/**
 * connect.js — SQLite via sql.js (pure WASM/JS — no C++ compiler needed)
 *
 * Provides a synchronous API wrapper that is API-compatible with better-sqlite3:
 *   db.prepare(sql).all(params)
 *   db.prepare(sql).get(params)
 *   db.prepare(sql).run(params)
 *   db.exec(sql)
 *   db.pragma(str)
 *   db.transaction(fn)  → returns wrapped function
 */
const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const DB_PATH = path.resolve(
  process.env.DB_PATH
    ? process.env.DB_PATH
    : path.join(__dirname, '..', '..', 'aitrip.db')
);

let wrapper = null;

// ── Named param (@foo) → positional (?) converter ─────────────
function namedToPositional(sql, obj) {
  const keys = [];
  const converted = sql.replace(/@(\w+)/g, (_, key) => {
    keys.push(key);
    return '?';
  });
  const values = keys.map(k => (obj[k] !== undefined ? obj[k] : null));
  return { sql: converted, params: values };
}

// ── Row builder from sql.js statement ─────────────────────────
function rowFromStmt(stmt) {
  const cols = stmt.getColumnNames();
  const vals = stmt.get();
  const obj  = {};
  cols.forEach((c, i) => { obj[c] = vals[i]; });
  return obj;
}

// ── Resolve call args: obj or positional list ─────────────────
function resolveArgs(sql, args) {
  if (
    args.length === 1 &&
    args[0] !== null &&
    typeof args[0] === 'object' &&
    !Array.isArray(args[0])
  ) {
    return namedToPositional(sql, args[0]);
  }
  return { sql, params: args.flat() };
}

// ── Create the better-sqlite3-compatible wrapper ──────────────
function createWrapper(sqlDb) {
  const w = {
    prepare(sql) {
      return {
        all(...args) {
          const { sql: qsql, params } = resolveArgs(sql, args);
          const stmt = sqlDb.prepare(qsql);
          if (params.length) stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(rowFromStmt(stmt));
          stmt.free();
          return rows;
        },
        get(...args) {
          const { sql: qsql, params } = resolveArgs(sql, args);
          const stmt = sqlDb.prepare(qsql);
          if (params.length) stmt.bind(params);
          let row = null;
          if (stmt.step()) row = rowFromStmt(stmt);
          stmt.free();
          return row;
        },
        run(...args) {
          const { sql: qsql, params } = resolveArgs(sql, args);
          const stmt = sqlDb.prepare(qsql);
          if (params.length) stmt.bind(params);
          stmt.step();
          stmt.free();
          if (!w.inTransaction) w._save();
          let lastId = null;
          try {
            const r = sqlDb.exec('SELECT last_insert_rowid()');
            lastId = r[0]?.values[0][0] ?? null;
          } catch {}
          return { lastInsertRowid: lastId };
        },
      };
    },

    exec(sql) {
      sqlDb.exec(sql);
      // Only save on write statements to avoid overhead on reads
      if (!w.inTransaction && /^\s*(CREATE|INSERT|UPDATE|DELETE|DROP|ALTER|REPLACE)/i.test(sql)) {
        w._save();
      }
    },

    pragma(str) {
      try { sqlDb.exec(`PRAGMA ${str}`); } catch {}
    },

    inTransaction: false,

    transaction(fn) {
      return (...outerArgs) => {
        w.inTransaction = true;
        sqlDb.exec('BEGIN TRANSACTION');
        try {
          fn(...outerArgs);
          sqlDb.exec('COMMIT TRANSACTION');
          w.inTransaction = false;
          w._save();
        } catch (e) {
          w.inTransaction = false;
          try { sqlDb.exec('ROLLBACK TRANSACTION'); } catch {}
          throw e;
        }
      };
    },

    close() {
      try { sqlDb.close(); } catch {}
    },

    _save() {
      try {
        const data = sqlDb.export();
        const dir  = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DB_PATH, Buffer.from(data));
      } catch (e) {
        console.warn('[DB] Save warning:', e.message);
      }
    },
  };
  return w;
}

// ── Schema init ───────────────────────────────────────────────
function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS destinations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      slug            TEXT    UNIQUE NOT NULL,
      image_url       TEXT,
      country         TEXT    NOT NULL DEFAULT 'India',
      state           TEXT,
      region          TEXT,
      lat             REAL    NOT NULL,
      lng             REAL    NOT NULL,
      type            TEXT,
      tags            TEXT    DEFAULT '[]',
      best_months     TEXT    DEFAULT '[]',
      language        TEXT,
      currency        TEXT    DEFAULT 'INR',
      timezone        TEXT    DEFAULT 'Asia/Kolkata',
      emergency_police     TEXT,
      emergency_ambulance  TEXT,
      emergency_tourist    TEXT,
      overview        TEXT,
      highlights      TEXT    DEFAULT '[]',
      hidden_gems     TEXT    DEFAULT '[]',
      local_phrases   TEXT    DEFAULT '{}',
      featured        INTEGER DEFAULT 0,
      verified        INTEGER DEFAULT 1,
      created_at      TEXT    DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      destination_id  INTEGER,
      user_id         TEXT,
      author_name     TEXT    NOT NULL,
      rating          INTEGER NOT NULL,
      title           TEXT,
      body            TEXT,
      tags            TEXT    DEFAULT '[]',
      accommodation_name   TEXT,
      accommodation_type   TEXT,
      accommodation_rating INTEGER,
      accommodation_link   TEXT,
      helpful         INTEGER DEFAULT 0,
      created_at      TEXT    DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trips (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         TEXT,
      destination_name TEXT   NOT NULL,
      destination_lat  REAL,
      destination_lng  REAL,
      start_date      TEXT,
      end_date        TEXT,
      travelers_count INTEGER DEFAULT 1,
      travelers_type  TEXT    DEFAULT 'solo',
      trip_type       TEXT    DEFAULT 'adventure',
      budget_min      INTEGER DEFAULT 0,
      budget_max      INTEGER DEFAULT 50000,
      generated_plan  TEXT    DEFAULT '{}',
      status          TEXT    DEFAULT 'draft',
      created_at      TEXT    DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ── Public API ────────────────────────────────────────────────
async function initDb() {
  console.log('[DB] Initialising sql.js (WASM SQLite)...');
  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(buf);
    console.log('[DB] Loaded existing database:', DB_PATH);
  } else {
    sqlDb = new SQL.Database();
    console.log('[DB] Created new database:', DB_PATH);
  }

  wrapper = createWrapper(sqlDb);
  initSchema(wrapper);
  return wrapper;
}

function getDb() {
  if (!wrapper) {
    throw new Error('[DB] Database not ready. initDb() must complete before handling requests.');
  }
  return wrapper;
}

module.exports = { initDb, getDb };
