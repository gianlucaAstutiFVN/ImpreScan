const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/database.sqlite');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initializeTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async initializeTables() {
    const tables = [
      // ATECO Classification Table - Solo per le labels
      `CREATE TABLE IF NOT EXISTS ateco_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        level INTEGER NOT NULL,
        parent_code TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Imprese Table - Dati reali ISTAT
      `CREATE TABLE IF NOT EXISTS imprese (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regione TEXT NOT NULL,
        provincia TEXT NOT NULL,
        settore TEXT NOT NULL,
        divisione TEXT NOT NULL,
        classe TEXT NOT NULL,
        sottocategoria TEXT NOT NULL,
        imprese_attive INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_imprese_regione ON imprese(regione)',
      'CREATE INDEX IF NOT EXISTS idx_imprese_provincia ON imprese(provincia)',
      'CREATE INDEX IF NOT EXISTS idx_imprese_settore ON imprese(settore)',
      'CREATE INDEX IF NOT EXISTS idx_imprese_divisione ON imprese(divisione)',
      'CREATE INDEX IF NOT EXISTS idx_imprese_classe ON imprese(classe)',
      'CREATE INDEX IF NOT EXISTS idx_imprese_sottocategoria ON imprese(sottocategoria)',
      'CREATE INDEX IF NOT EXISTS idx_imprese_attive ON imprese(imprese_attive)',
      'CREATE INDEX IF NOT EXISTS idx_ateco_parent ON ateco_codes(parent_code)',
      'CREATE INDEX IF NOT EXISTS idx_ateco_level ON ateco_codes(level)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
