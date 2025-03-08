import { Database } from 'sqlite3';

export const initDatabase = () => {
  const db = new Database('trades.db');

  db.serialize(() => {
    db.run(`      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        date TEXT NOT NULL,
        hour INTEGER NOT NULL,
        is_win BOOLEAN NOT NULL,
        stake REAL NOT NULL,
        profit REAL NOT NULL,
        balance_after REAL NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS hourly_stats (
        date TEXT NOT NULL,
        hour INTEGER NOT NULL,
        total_trades INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        win_rate REAL DEFAULT 0,
        total_profit REAL DEFAULT 0,
        max_consecutive_wins INTEGER DEFAULT 0,
        max_consecutive_losses INTEGER DEFAULT 0,
        current_consecutive_wins INTEGER DEFAULT 0,
        current_consecutive_losses INTEGER DEFAULT 0,
        PRIMARY KEY (date, hour)
      )
    `);

    db.run(`      CREATE TABLE IF NOT EXISTS sequence_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_timestamp INTEGER NOT NULL,
        end_timestamp INTEGER NOT NULL,
        date TEXT NOT NULL,
        sequence_type TEXT NOT NULL, -- 'current' ou 'next'
        trades_count INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        win_rate REAL DEFAULT 0,
        is_completed BOOLEAN DEFAULT 0,
        reference_win_rate REAL, -- taxa de acerto que iniciou a sequência
        completed_win_rate REAL  -- taxa de acerto final quando completada
      )
    `);
  });

  return db;
}; 

