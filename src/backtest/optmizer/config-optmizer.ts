interface DigitStats {
  digit: number;
  trades: number;
  winRate: number;
  tradesDigitsHistory: number[][];
}

export interface LastTrade {
  win: boolean;
  entryDigit: number;
  resultDigit: number;
  ticks: number;
  digitsArray: number[];
}

interface OptimalConfig {
  entryDigit: number;
  winRate: number;
  ticks: number;
}

type Stats = {
  win: number;
  loss: number;
  winRate: number;
};

export class ConfigOptimizer {
  private digitsData: DigitStats[];
  private entryDigit: number;
  
  constructor(digitsData: DigitStats[], entryDigit: number) {
    this.digitsData = digitsData;
    this.entryDigit = entryDigit;
  } 
  
  processArray(data: number[][]): Record<number, Stats> {
    const result: Record<number, Stats> = {};
  
    data.forEach((arr) => {
      arr.forEach((num, i) => {
        const key = i+1;
        if (!result[key]) {
          result[key] = { win: 0, loss: 0, winRate: 0 };
        }
  
        if (num > this.entryDigit) {
          result[key].win += 1;
        } else {
          result[key].loss += 1;
        }
      });
    });
  
    // Calcula o winRate
    Object.keys(result).forEach((key) => {
      const k = Number(key);
      const { win, loss } = result[k];
      result[k].winRate = win + loss > 0 ? win / (win + loss) : 0;
    });
  
    return result;
  }   

  getNextConfig(lastTrade: LastTrade): OptimalConfig {
    // Para cada dígito nas estatísticas
    const ticksStats = this.digitsData.map(digitStat => {
      // Calcula as posições corretas no array (ticks - 2 e ticks - 1)
      const positions = lastTrade.digitsArray.map((_, index) => 
        lastTrade.ticks - (lastTrade.digitsArray.length - index)
      );
      
      // Filtra as sequências que têm os dígitos específicos nas posições corretas
      const matchingSequences = digitStat.tradesDigitsHistory.filter(sequence => 
        lastTrade.digitsArray.every((digit, idx) => sequence[positions[idx]] === digit)
      );

      const stats = this.processArray(matchingSequences);

      // Encontra a chave com o melhor winRate
      let bestWinRate = 0;
      let bestTick = 0;

      Object.keys(stats).forEach(key => {
        const tick = Number(key);
        const { winRate } = stats[tick];

        if (winRate > bestWinRate) {
          bestWinRate = winRate;
          bestTick = tick;
        }
      });

      return { entryDigit: digitStat.digit, ticks: bestTick, winRate: bestWinRate }

    
    });

    // Encontra a melhor configuração (maior win rate)
    const bestConfig = ticksStats.reduce((best, current) => {
      if (current.winRate > best.winRate) return current;
      return best;
    }, ticksStats[0]);

    return {
      entryDigit: bestConfig.entryDigit,
      ticks: bestConfig?.ticks,
      winRate: Number(bestConfig?.winRate.toFixed(1)),
    };
  }
} 