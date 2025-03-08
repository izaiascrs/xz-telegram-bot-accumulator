import { MoneyManagement, TradeResult } from "./types";
import { MartingaleSorosManager } from "./martingale-soros";
import { FixedWithRecoveryManager } from "./fixed-with-recovery";

export class RealMoneyManager {
  private manager: MartingaleSorosManager | FixedWithRecoveryManager;
  private config: MoneyManagement;
  private currentBalance: number;
  private currentStake: number;
  private consecutiveLosses: number = 0;
  private sorosLevel: number = 0;
  private lastTrade: TradeResult | null = null;
  private accumulatedProfit: number = 0;

  constructor(config: MoneyManagement, initialBalance: number) {
    this.config = config;
    this.currentBalance = initialBalance;
    this.currentStake = config.initialStake;
    this.accumulatedProfit = 0;
    
    switch (config.type) {
      case "martingale-soros":
        this.manager = new MartingaleSorosManager(config, initialBalance);
        break;
      case "fixed-with-recovery":
        this.manager = new FixedWithRecoveryManager(config, initialBalance);
        break;
      default:
        this.manager = new FixedWithRecoveryManager({
          ...config,
          type: "fixed-with-recovery",
          enableSoros: false,
          winsBeforeRecovery: 999 // Número alto para nunca ativar recovery no modo fixed
        }, initialBalance);
    }
  }

  public calculateNextStake(): number {
    return this.manager.calculateNextStake();
  }

  public updateLastTrade(isWin: boolean, stake?: number): void {
    if (this.manager instanceof FixedWithRecoveryManager) {
      this.manager.updateLastTrade(isWin, stake || this.currentStake);
    } else {
      this.manager.updateLastTrade(isWin);
    }
  }

  public setStake(stake: number): void {
    this.manager.setStake(stake);
  }

  public getCurrentBalance(): number {
    return this.manager.getCurrentBalance();
  }

  public updateBalance(newBalance: number): void {
    this.manager.updateBalance(newBalance);
  }

  getLastTrade(): TradeResult | null {
    return this.lastTrade;
  }

  getStats() {
    return {
      currentBalance: this.currentBalance,
      consecutiveLosses: this.consecutiveLosses,
      sorosLevel: this.sorosLevel,
      lastStake: this.lastTrade?.stake || 0,
      lastProfit: this.lastTrade?.profit || 0
    };
  }
} 
