import { Database } from 'sqlite3';
import { initDatabase } from './schema';

async function seed() {
  const db = initDatabase();
  await clearDatabase(db);

  // Criar dados para os últimos 7 dias
  const days = 7;
  const trades = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Criar trades para cada período de 2 horas
    trades.push(
      // Madrugada (baixo volume)
      createTrades(dateStr, 0, 8, 0.65),  // 00:00-02:00
      createTrades(dateStr, 2, 5, 0.60),  // 02:00-04:00
      
      // Manhã (volume moderado)
      createTrades(dateStr, 4, 15, 0.75), // 04:00-06:00
      createTrades(dateStr, 6, 18, 0.82), // 06:00-08:00
      createTrades(dateStr, 8, 25, 0.78), // 08:00-10:00
      
      // Horários com melhor performance
      createTrades(dateStr, 10, 30, 0.85), // 10:00-12:00
      createTrades(dateStr, 12, 28, 0.88), // 12:00-14:00
      createTrades(dateStr, 14, 32, 0.86), // 14:00-16:00
      
      // Final do dia
      createTrades(dateStr, 16, 20, 0.79), // 16:00-18:00
      createTrades(dateStr, 18, 15, 0.72), // 18:00-20:00
      createTrades(dateStr, 20, 12, 0.70), // 20:00-22:00
      createTrades(dateStr, 22, 10, 0.68)  // 22:00-00:00
    );
  }

  const flatTrades = trades.flat();

  // Inserir trades e atualizar estatísticas
  const tradesByDateAndHour = new Map<string, Map<number, any[]>>();
  
  // Agrupar trades por data e hora
  flatTrades.forEach(trade => {
    const key = `${trade.date}`;
    if (!tradesByDateAndHour.has(key)) {
      tradesByDateAndHour.set(key, new Map());
    }
    const hourMap = tradesByDateAndHour.get(key)!;
    if (!hourMap.has(trade.hour)) {
      hourMap.set(trade.hour, []);
    }
    hourMap.get(trade.hour)?.push(trade);
  });

  // Inserir e atualizar estatísticas
  for (const [date, hourMap] of tradesByDateAndHour) {
    for (const [hour, hourTrades] of hourMap) {
      for (const trade of hourTrades) {
        await insertTrade(db, trade);
      }
      await updateHourlyStats(db, date, hour, hourTrades);
    }
  }

  // Criar sequências de exemplo
  await createSequences(db);

  console.log('Seed concluído com sucesso!');
  process.exit(0);
}

async function createSequences(db: Database) {
  const now = Date.now();
  const sequences = [
    // Sequência atual em andamento
    {
      start_timestamp: now - 3600000,
      end_timestamp: now,
      date: new Date().toISOString().split('T')[0],
      sequence_type: 'current',
      trades_count: 15,
      wins: 12,
      win_rate: 80.0,
      is_completed: 0,
      reference_win_rate: null,
      completed_win_rate: null
    },
    
    // Sequência de monitoramento em andamento
    {
      start_timestamp: now - 1800000,
      end_timestamp: now,
      date: new Date().toISOString().split('T')[0],
      sequence_type: 'next',
      trades_count: 8,
      wins: 7,
      win_rate: 87.5,
      is_completed: 0,
      reference_win_rate: 75.0,
      completed_win_rate: null
    },
    
    // Sequência completa com taxa baixa
    {
      start_timestamp: now - 86400000, // 1 dia atrás
      end_timestamp: now - 43200000,
      date: new Date(now - 86400000).toISOString().split('T')[0],
      sequence_type: 'current',
      trades_count: 25,
      wins: 18,
      win_rate: 72.0,
      is_completed: 1,
      reference_win_rate: null,
      completed_win_rate: 72.0
    },
    
    // Sequência de monitoramento completa com melhoria
    {
      start_timestamp: now - 86400000,
      end_timestamp: now - 43200000,
      date: new Date(now - 86400000).toISOString().split('T')[0],
      sequence_type: 'next',
      trades_count: 25,
      wins: 21,
      win_rate: 84.0,
      is_completed: 1,
      reference_win_rate: 72.0,
      completed_win_rate: 84.0
    },
    
    // Sequência de monitoramento resetada
    {
      start_timestamp: now - 172800000, // 2 dias atrás
      end_timestamp: now - 129600000,
      date: new Date(now - 172800000).toISOString().split('T')[0],
      sequence_type: 'next',
      trades_count: 12,
      wins: 8,
      win_rate: 66.7,
      is_completed: 1,
      reference_win_rate: 75.0,
      completed_win_rate: 66.7
    }
  ];

  // Inserir todas as sequências
  for (const seq of sequences) {
    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO sequence_stats (
          start_timestamp, end_timestamp, date, sequence_type,
          trades_count, wins, win_rate, is_completed,
          reference_win_rate, completed_win_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        seq.start_timestamp,
        seq.end_timestamp,
        seq.date,
        seq.sequence_type,
        seq.trades_count,
        seq.wins,
        seq.win_rate,
        seq.is_completed,
        seq.reference_win_rate,
        seq.completed_win_rate
      ], function(err) {
        if (err) {
          console.error('Erro ao inserir sequência:', err);
          reject(err);
          return;
        }
        console.log(`Sequência inserida com ID: ${this.lastID}`);
        resolve();
      });
    });
  }

  // Verificar se as sequências foram inseridas
  await new Promise<void>((resolve) => {
    db.get('SELECT COUNT(*) as count FROM sequence_stats', [], (err, result: any) => {
      if (err) {
        console.error('Erro ao contar sequências após inserção:', err);
      } else {
        console.log(`Total de sequências após seed: ${result.count}`);
      }
      resolve();
    });
  });
}

async function clearDatabase(db: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Dropar todas as tabelas
      db.run('DROP TABLE IF EXISTS trades');
      db.run('DROP TABLE IF EXISTS hourly_stats');
      db.run('DROP TABLE IF EXISTS sequence_stats');

      // Recriar as tabelas
      db.run(`
        CREATE TABLE trades (
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
        CREATE TABLE hourly_stats (
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

      db.run(`
        CREATE TABLE sequence_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          start_timestamp INTEGER NOT NULL,
          end_timestamp INTEGER NOT NULL,
          date TEXT NOT NULL,
          sequence_type TEXT NOT NULL,
          trades_count INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          win_rate REAL DEFAULT 0,
          is_completed BOOLEAN DEFAULT 0,
          reference_win_rate REAL,
          completed_win_rate REAL
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

async function updateHourlyStats(db: Database, date: string, hour: number, trades: any[]) {
  const wins = trades.filter(t => t.is_win).length;
  const totalTrades = trades.length;
  const winRate = (wins / totalTrades) * 100;
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);

  let currentWins = 0;
  let currentLosses = 0;
  let maxWins = 0;
  let maxLosses = 0;

  trades.forEach(trade => {
    if (trade.is_win) {
      currentWins++;
      currentLosses = 0;
      maxWins = Math.max(maxWins, currentWins);
    } else {
      currentLosses++;
      currentWins = 0;
      maxLosses = Math.max(maxLosses, currentLosses);
    }
  });

  return new Promise<void>((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO hourly_stats 
      (date, hour, total_trades, wins, win_rate, total_profit, 
       max_consecutive_wins, max_consecutive_losses, 
       current_consecutive_wins, current_consecutive_losses)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      date,
      hour,
      totalTrades,
      wins,
      winRate,
      totalProfit,
      maxWins,
      maxLosses,
      currentWins,
      currentLosses
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function createTrades(date: string, hour: number, count: number, winRate: number) {
  const trades = [];
  const wins = Math.floor(count * winRate);
  const losses = count - wins;

  for (let i = 0; i < count; i++) {
    const isWin = i < wins;
    trades.push({
      timestamp: Date.now() + (i * 1000),
      date,
      hour,
      is_win: isWin ? 1 : 0,
      stake: 0.35,
      profit: isWin ? 0.077 : -0.35,
      balance_after: 100 + (isWin ? 0.077 : -0.35)
    });
  }

  return trades;
}

function insertTrade(db: Database, trade: any): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO trades (timestamp, date, hour, is_win, stake, profit, balance_after)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      trade.timestamp,
      trade.date,
      trade.hour,
      trade.is_win,
      trade.stake,
      trade.profit,
      trade.balance_after
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Executar seed
seed().catch(console.error); 