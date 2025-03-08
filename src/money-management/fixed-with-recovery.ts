import { MoneyManagement } from "./types";

export class FixedWithRecoveryManager {
  private currentStake: number;
  private lastWin: boolean = false;
  private lastProfit: number = 0;
  private consecutiveWins: number = 0;
  private currentBalance: number;
  private config: MoneyManagement;
  private sorosCount: number = 0; // Contador para controlar níveis do soros

  constructor(config: MoneyManagement, initialBalance: number) {
    this.config = {
      ...config,
      enableSoros: config.enableSoros || false,
      sorosPercent: config.sorosPercent || 20, // Default 20%
      winsBeforeRecovery: config.winsBeforeRecovery || 3,
      initialBalance: initialBalance
    };
    this.currentStake = config.initialStake;
    this.currentBalance = initialBalance;
  }

  public calculateNextStake(): number {
    // Se atingiu o número máximo de soros, volta para stake inicial
    if (this.sorosCount >= this.config.sorosLevel) {
      this.sorosCount = 0;
      return this.config.initialStake;
    }

    // Se o saldo estiver abaixo do inicial e tivermos wins suficientes, calcular recovery
    if (this.shouldUseRecovery()) {
      const valueToRecover = this.config.initialBalance! - this.currentBalance;
      return this.calculateRecoveryStake(valueToRecover);
    }

    // Se tiver soros habilitado, última foi win e saldo > inicial
    if (this.shouldUseSoros()) {
      const sorosStake = this.calculateSorosStake();
      if (sorosStake <= this.config.maxStake) {
        this.sorosCount++; // Incrementa contador de soros
        return sorosStake;
      }
    }

    // Reset do contador de soros quando voltar ao stake inicial
    this.sorosCount = 0;
    return this.config.initialStake;
  }

  private shouldUseSoros(): boolean {
    const profitFromInitial = this.currentBalance - this.config.initialBalance!;
    return (
      this.config.enableSoros &&
      this.lastWin &&
      profitFromInitial > 0 && // Verifica se tem lucro em relação ao saldo inicial
      this.lastProfit > 0
    );
  }

  private shouldUseRecovery(): boolean {
    return (
      this.currentBalance < this.config.initialBalance! &&
      this.consecutiveWins >= this.config.winsBeforeRecovery! &&
      this.calculateRecoveryStake(this.config.initialBalance! - this.currentBalance) <= this.config.maxStake
    );
  }

  private calculateRecoveryStake(valueToRecover: number): number {
    if (valueToRecover <= 0) return this.config.initialStake;
    
    const stake = (valueToRecover * 100) / this.config.profitPercent;
    return Math.max(
      Math.min(Number(stake.toFixed(2)), this.config.maxStake),
      this.config.initialStake
    );
  }

  private calculateSorosStake(): number {
    // Calcula a porcentagem configurada do último lucro
    const sorosValue = (this.lastProfit * this.config.sorosPercent) / 100;
    // Retorna a stake inicial + a porcentagem do lucro
    const nextStake = this.config.initialStake + sorosValue;
    
    return Math.max(
      Math.min(
        Number(nextStake.toFixed(2)),
        this.config.maxStake
      ),
      this.config.initialStake
    );
  }

  public updateLastTrade(isWin: boolean, stake: number): void {
    this.lastWin = isWin;
    
    if (isWin) {
      // O lucro é calculado com base na stake e na porcentagem de lucro
      this.lastProfit = (stake * this.config.profitPercent) / 100;
      this.consecutiveWins++;
    } else {
      this.lastProfit = 0;
      this.consecutiveWins = 0;
      this.sorosCount = 0; // Reset do contador em caso de loss
      this.currentStake = this.config.initialStake;
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

  public getConsecutiveWins(): number {
    return this.consecutiveWins;
  }
} 