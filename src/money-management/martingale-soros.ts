import { MoneyManagement } from "./types";

export class MartingaleSorosManager {
  private currentStake: number;
  private lastWin: boolean = false;
  private consecutiveLosses: number = 0;
  private sorosLevel: number = 0;
  private currentBalance: number;

  constructor(private config: MoneyManagement, initialBalance: number) {
    this.currentStake = config.initialStake;
    this.currentBalance = initialBalance;
  }

  public calculateNextStake(): number {
    if (this.lastWin) {
      return this.calculateSorosStake();
    }
    return this.calculateMartingaleStake();
  }

  private calculateMartingaleStake(): number {
    const lastStake = this.currentStake;
    const nextStake = (lastStake * 2) + this.config.initialStake;
    return Math.min(nextStake, this.config.maxStake);
  }

  private calculateSorosStake(): number {
    if (this.sorosLevel >= this.config.sorosLevel) {
      this.sorosLevel = 0;
      return this.config.initialStake;
    }
    
    const lastProfit = (this.currentStake * this.config.profitPercent) / 100;
    this.sorosLevel++;
    return this.currentStake + lastProfit;
  }

  public updateLastTrade(isWin: boolean): void {
    this.lastWin = isWin;
    if (!isWin) {
      this.consecutiveLosses++;
      this.sorosLevel = 0;
    } else {
      this.consecutiveLosses = 0;
    }
  }

  public setStake(stake: number): void {
    this.currentStake = stake;
  }

  public getCurrentBalance(): number {
    return this.currentBalance;
  }

  public updateBalance(newBalance: number): void {
    this.currentBalance = newBalance;
  }
} 