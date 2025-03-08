import { BackTestAnalysis, Strategy, TradeSignal, } from './types';

export class Backtest {
  private readonly RESULT_DELAY = 2;

  constructor(private strategy: Strategy) {}

  runTest(digits: number[]): BackTestAnalysis[] {
    const results: BackTestAnalysis[] = [];
    
    for (let ticks = this.strategy.minTicks; ticks <= 10; ticks++) {
      let totalTrades = 0;
      let skippedTrades = 0;
      let possibleTrades = 0;
      let wins = 0;
      let losses = 0;
      let consecutiveWins = 0;
      let consecutiveLosses = 0;
      let maxConsecutiveWins = 0;
      let maxConsecutiveLosses = 0;
      const trades: TradeSignal[] = [];
      
      let lastTradeIndex = -1;
      
      for (let i = 0; i < digits.length - ticks; i++) {
        const result = this.strategy.execute(digits, i, ticks);
        
        if (result !== null) {
          possibleTrades++;
          
          // Verifica se já passou tempo suficiente desde a última trade
          const minTicksNeeded = lastTradeIndex + ticks + this.RESULT_DELAY;
          
          if (i >= minTicksNeeded) {
            totalTrades++;
            trades.push({ 
              success: result, 
              position: i,
              resultDigit: digits[i + ticks]
            });
            lastTradeIndex = i;
            
            if (result) {
              wins++;
              consecutiveWins++;
              consecutiveLosses = 0;
              maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
            } else {
              losses++;
              consecutiveLosses++;
              consecutiveWins = 0;
              maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
            }
          } else {
            skippedTrades++;
          }
        }
      }

      results.push({
        ticks,
        totalTrades,
        wins,
        losses,
        winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
        lossRate: totalTrades > 0 ? (losses / totalTrades) * 100 : 0,
        maxConsecutiveWins,
        maxConsecutiveLosses,
        trades,
        skippedTrades,
        possibleTrades
      });
    }

    return results;
  }
} 