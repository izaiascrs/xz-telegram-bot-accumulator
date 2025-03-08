import { Backtest } from "./backtest";
import { MoneyManager } from "./backtest-money-manager";
import { CompleteBackTestResult, Strategy, TradeSignal } from "./types";

export function runBackTest(
  digits: number[], 
  strategy: Strategy, 
  initialBalance: number = 100
): CompleteBackTestResult {
  // Executa o backtest puro para todos os ticks
  const backtest = new Backtest(strategy);
  const backTestResults = backtest.runTest(digits);

  // Executa o gerenciamento separadamente
  const moneyManager = new MoneyManager(strategy.moneyManagement, initialBalance);
  const financialResults = moneyManager.processTradeSignals(backTestResults);  

  // Processa estatísticas adicionais para cada tick
  const processedResults = backTestResults.map(result => {
    const winStreaks = getStreaks(result.trades, true);
    const lossStreaks = getStreaks(result.trades, false);

    return {
      ...result,
      averageConsecutiveWins: average(winStreaks),
      averageConsecutiveLosses: average(lossStreaks),
      winsAfterConsecutiveLosses: calculateTradesAfterLosses(result.trades),
      lossesAfterConsecutiveWins: calculateTradesAfterWins(result.trades),
      streakDistribution: {
        wins: countStreaks(winStreaks),
        losses: countStreaks(lossStreaks)
      },
      // Valores financeiros zerados para todos os ticks
      finalBalance: initialBalance,
      totalVolume: 0,
      maxDrawdown: 0,
      maxBalance: initialBalance,
      minBalance: initialBalance,
      trades: []
    };
  });

  // Passa a configuração com o entryDigit
  const digitStats = calculateDigitStats(backTestResults[0].trades, digits, strategy.config);

  return {
    backtest: processedResults,
    management: financialResults,
    digitStats
  };
}

// Helper functions
const getStreaks = (trades: TradeSignal[], forWins: boolean) => {
  const streaks: number[] = [];
  let current = 0;
  
  trades.forEach(trade => {
    if (trade.success === forWins) {
      current++;
    } else if (current > 0) {
      streaks.push(current);
      current = 0;
    }
  });
  
  if (current > 0) streaks.push(current);
  return streaks;
};

const average = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const countStreaks = (streaks: number[]) => 
  streaks.reduce((acc, streak) => ({...acc, [streak]: (acc[streak] || 0) + 1}), {} as {[key: number]: number});

const calculateTradesAfterLosses = (trades: TradeSignal[]) => {
  const result: { [key: number]: { occurrences: number; averageTradesToNextLoss: number; winRate: number } } = {};
  let lossCount = 0;

  for (let i = 0; i < trades.length - 1; i++) {
    if (!trades[i].success) {
      lossCount++;
    } else {
      if (lossCount > 0) {
        if (!result[lossCount]) {
          result[lossCount] = { occurrences: 0, averageTradesToNextLoss: 0, winRate: 0 };
        }
        
        // Conta quantos trades até próxima derrota
        let tradesToNextLoss = 1;
        for (let j = i + 1; j < trades.length; j++) {
          if (!trades[j].success) break;
          tradesToNextLoss++;
        }

        result[lossCount].occurrences++;
        result[lossCount].averageTradesToNextLoss = 
          (result[lossCount].averageTradesToNextLoss * (result[lossCount].occurrences - 1) + tradesToNextLoss) 
          / result[lossCount].occurrences;
        result[lossCount].winRate = (result[lossCount].occurrences / trades.length) * 100;
      }
      lossCount = 0;
    }
  }

  return result;
};

const calculateTradesAfterWins = (trades: TradeSignal[]) => {
  const result: { [key: number]: { occurrences: number; averageTradesToNextWin: number; lossRate: number } } = {};
  let winCount = 0;

  for (let i = 0; i < trades.length - 1; i++) {
    if (trades[i].success) {
      winCount++;
    } else {
      if (winCount > 0) {
        if (!result[winCount]) {
          result[winCount] = { occurrences: 0, averageTradesToNextWin: 0, lossRate: 0 };
        }
        
        // Conta quantos trades até próxima vitória
        let tradesToNextWin = 1;
        for (let j = i + 1; j < trades.length; j++) {
          if (trades[j].success) break;
          tradesToNextWin++;
        }

        result[winCount].occurrences++;
        result[winCount].averageTradesToNextWin = 
          (result[winCount].averageTradesToNextWin * (result[winCount].occurrences - 1) + tradesToNextWin) 
          / result[winCount].occurrences;
        result[winCount].lossRate = (result[winCount].occurrences / trades.length) * 100;
      }
      winCount = 0;
    }
  }

  return result;
};

// Nova função para calcular estatísticas dos dígitos
const calculateDigitStats = (trades: TradeSignal[], digits: number[], config: { entryDigit: number }) => {
  const targetDigit = config.entryDigit;
  
  // Pega os 1000 trades mais recentes
  const recentTrades = trades.slice(-1000);
  
  // Filtra trades onde o dígito de entrada é o configurado
  const targetTrades = recentTrades.filter(trade => 
    Math.floor(digits[trade.position]) === targetDigit
  );

  // Calcula win rate para trades com dígito 9
  const winningTrades = targetTrades.filter(t => t.success);
  const winRate = (winningTrades.length / targetTrades.length) * 100;

  // Coleta histórico dos próximos 10 dígitos após cada entrada
  const validSequences = targetTrades
    .map(trade => {
      const startIndex = trade.position + 1;
      const sequence = digits.slice(startIndex, startIndex + 10);
      return sequence.length === 10 ? sequence.map(d => Math.floor(d)) : null;
    })
    .filter((seq): seq is number[] => seq !== null);

  // Pega as 150 sequências mais recentes
  const tradesDigitsHistory = validSequences.slice(-500);

  return {
    digit: targetDigit,
    trades: targetTrades.length,
    winRate: Number(winRate.toFixed(1)),
    tradesDigitsHistory
  };
}