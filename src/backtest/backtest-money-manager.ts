import { BackTestAnalysis, FinancialResults, MoneyManagement, TradeResult } from "./types";

export class MoneyManager {
  private currentBalance: number;
  private trades: TradeResult[] = [];
  private maxBalance: number;
  private minBalance: number;
  private totalVolume: number = 0;
  private consecutiveLosses: number = 0;
  private consecutiveWins: number = 0;
  private maxStakeUsed = {
    stake: 0,
    balance: 0,
    tradeNumber: 0
  };

  constructor(
    private config: MoneyManagement,
    initialBalance: number
  ) {
    this.currentBalance = initialBalance;
    this.maxBalance = initialBalance;
    this.minBalance = initialBalance;
  }

  processTradeSignals(backTestResults: BackTestAnalysis[]): FinancialResults {
    const targetTickResults = backTestResults.find(r => r.ticks === this.config.targetTick);
    if (!targetTickResults) return this.getEmptyResults();

    for (const trade of targetTickResults.trades) {
      if (this.currentBalance <= 0) {
        console.warn('Stop Loss: Saldo zerado');
        break;
      }

      const stake = this.calculateStake();
      
      if (stake === 0 || stake > this.currentBalance) {
        console.warn('Stop Loss: Stake maior que saldo disponível', {
          stake,
          currentBalance: this.currentBalance
        });
        break;
      }

      this.totalVolume += stake;

      // Atualiza informação da maior stake
      if (stake > this.maxStakeUsed.stake) {
        this.maxStakeUsed = {
          stake,
          balance: this.currentBalance,
          tradeNumber: this.trades.length + 1
        };
      }

      if (trade.success) {
        const profit = stake * (this.config.profitPercent / 100);
        this.currentBalance += profit;
        this.consecutiveWins++;
        this.consecutiveLosses = 0;

        const tradeResult: TradeResult = {
          success: true,
          stake,
          profit,
          balance: this.currentBalance,
          type: 'win'
        };

        this.trades.push(tradeResult);
        this.updateStats(tradeResult);
      } else {
        if (this.currentBalance - stake <= 0) {
          console.warn('Stop Loss: Saldo insuficiente para próxima operação', {
            currentBalance: this.currentBalance,
            requiredStake: stake
          });
          break;
        }

        this.currentBalance -= stake;
        this.consecutiveLosses++;
        this.consecutiveWins = 0;

        const tradeResult: TradeResult = {
          success: false,
          stake,
          profit: -stake,
          balance: this.currentBalance,
          type: 'loss'
        };

        this.trades.push(tradeResult);
        this.updateStats(tradeResult);
      }
    }

    return {
      finalBalance: this.currentBalance,
      totalVolume: this.totalVolume,
      maxDrawdown: this.maxBalance > 0 ? ((this.maxBalance - this.minBalance) / this.maxBalance) * 100 : 0,
      maxBalance: this.maxBalance,
      minBalance: this.minBalance,
      trades: this.trades,
      maxStakeInfo: this.maxStakeUsed
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private updateStats(_trade: TradeResult) {
    this.maxBalance = Math.max(this.maxBalance, this.currentBalance);
    this.minBalance = Math.min(this.minBalance, this.currentBalance);   
  }

  private calculateStake(): number {
    if (this.currentBalance <= 0) return 0;
    
    const lastTrade = this.trades[this.trades.length - 1];
    
    if (!lastTrade) {
      return Math.min(
        this.config.initialStake,
        this.currentBalance
      );
    }

    switch (this.config.type) {
      case 'fixed':
        return this.calculateFixedStake();
      case 'martingale':
        return this.calculateMartingaleStake(lastTrade);
      case 'soros':
        return this.calculateSorosStake(lastTrade);
      case 'martingale-soros':
        return this.calculateMartingaleSorosStake(lastTrade);
      default:
        return this.config.initialStake;
    }
  }

  private calculateFixedStake(): number {
    return Math.min(
      this.config.initialStake,
      this.currentBalance
    );
  }

  private calculateMartingaleStake(lastTrade: TradeResult): number {
    if (lastTrade.type === 'win') {
      return this.config.initialStake;
    }

    // Calcula valor necessário para recuperar perdas
    const lossAmount = lastTrade.stake;
    const profitRate = this.config.profitPercent / 100;
    const requiredStake = (lossAmount + this.config.initialStake) / profitRate;
    
    return Math.min(
      requiredStake,
      this.config.maxStake || Infinity,
      this.currentBalance
    );
  }

  private calculateSorosStake(lastTrade: TradeResult): number {
    if (lastTrade.type === 'loss') {
      return this.config.initialStake;
    }

    // Adiciona o lucro da última trade ao stake inicial
    const newStake = this.config.initialStake + lastTrade.profit;
    
    return Math.min(
      newStake,
      this.config.maxStake || Infinity,
      this.currentBalance
    );
  }

  private calculateMartingaleSorosStake(lastTrade: TradeResult): number {
    if (lastTrade.type === 'win') {
      return this.calculateSorosStake(lastTrade);
    }
    return this.calculateMartingaleStake(lastTrade);
  }

  private getEmptyResults(): FinancialResults {
    return {
      finalBalance: this.currentBalance,
      totalVolume: 0,
      maxDrawdown: 0,
      maxBalance: this.currentBalance,
      minBalance: this.currentBalance,
      trades: [],
      maxStakeInfo: {
        stake: 0,
        balance: 0,
        tradeNumber: 0
      }
    };
  }
} 