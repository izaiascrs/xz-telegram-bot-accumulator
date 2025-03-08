export type ManagementType = 'fixed' | 'martingale' | 'soros' | 'martingale-soros';

export interface MoneyManagement {
  type: ManagementType;
  initialStake: number;
  profitPercent: number; // Exemplo: 95 para 95%
  maxStake?: number; // Limite máximo de entrada
  maxLoss?: number; // Limite máximo de loss consecutivo (para martingale)
  sorosLevel?: number; // Quantos níveis de soros aplicar
  targetTick?: number;
}

export interface TradeResult {
  success: boolean;
  stake: number;
  profit: number;
  balance: number;
 
  type: 'win' | 'loss';
}

// Nova interface para sinais de trade do backtest puro
export interface TradeSignal {
  success: boolean;
  position: number;
  resultDigit: number; // Adiciona o dígito do resultado
}

// Nova interface para análise do backtest
export interface BackTestAnalysis {
  ticks: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  lossRate: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  trades: TradeSignal[];
  skippedTrades: number;
  possibleTrades: number;
}

// Nova interface para resultados financeiros
export interface FinancialResults {
  finalBalance: number;
  totalVolume: number;
  maxDrawdown: number;
  maxBalance: number;
  minBalance: number;
  trades: TradeResult[];
  maxStakeInfo: {
    stake: number;
    balance: number;
    tradeNumber: number;
  };
}

export interface BackTestResult {
  ticks: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  lossRate: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageConsecutiveWins: number;
  averageConsecutiveLosses: number;
  skippedTrades: number;
  possibleTrades: number;
  winsAfterConsecutiveLosses: {
    [key: number]: {
      occurrences: number;

      averageTradesToNextLoss: number;
      winRate: number;
    }
  };
  lossesAfterConsecutiveWins: {
    [key: number]: {
      occurrences: number;
      averageTradesToNextWin: number;
      lossRate: number;
    }
  };
  streakDistribution: {
    wins: { [length: number]: number };
    losses: { [length: number]: number };
  };
  finalBalance: number;
  totalVolume: number;
  maxDrawdown: number;
  maxBalance: number;
  minBalance: number;
  trades: TradeResult[];
}

export interface Strategy {
  name: string;
  minTicks: number;
  virtualLoss: number;
  moneyManagement: MoneyManagement;
  config?: any;
  execute: (digits: number[], position: number, ticksToAnalyze: number) => boolean | null;
}

export interface CompleteBackTestResult {
  backtest: BackTestResult[];
  management: FinancialResults;
  digitStats: {
    digit: number;
    trades: number;
    winRate: number;
    tradesDigitsHistory: number[][];
  };
} 