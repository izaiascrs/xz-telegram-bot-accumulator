import { MoneyManagementV2, TradeResult } from "./types";

export class MoneyManager {
  private currentBalance: number;
  private initialBalance: number;
  private currentStake: number;
  private consecutiveLosses: number = 0;
  private consecutiveWins: number = 0;
  private sorosLevel: number = 0;
  private lastTrade: TradeResult | null = null;
  private accumulatedLoss: number = 0;
  private recoveryMode: boolean = false;
  private currentWinsRequired: number;
  private maxWinsRequired: number;
  private isMartingaleTrade: boolean = false;
  private sessionProfit: number = 0;
  private onTargetReached?: (profit: number, balance: number) => void;

  constructor(private config: MoneyManagementV2, initialBalance: number) {
    this.currentBalance = initialBalance;
    this.initialBalance = initialBalance;
    this.currentStake = config.initialStake;
    this.maxWinsRequired = config.winsBeforeMartingale || 3;
    this.currentWinsRequired = this.maxWinsRequired;
  }

  setOnTargetReached(callback: (profit: number, balance: number) => void) {
    this.onTargetReached = callback;
  }

  calculateNextStake(): number {
    if (this.currentBalance <= 0) {
      console.warn("Saldo insuficiente");
      return 0;
    }

    if (!this.lastTrade) {
      return Math.min(this.config.initialStake, this.currentBalance);
    }

    let nextStake = 0;

    switch (this.config.type) {
      case "fixed":
        nextStake = this.calculateFixedStake();
        break;
      case "martingale":
        nextStake = this.calculateMartingaleStake();
        break;
      case "soros":
        nextStake = this.calculateSorosStake();
        break;
      case "martingale-soros":
        nextStake = this.calculateMartingaleSorosStake();
        break;
      default:
        nextStake = this.config.initialStake;
    }

    // Verifica limites
    if (nextStake > this.currentBalance) {
      console.warn("Stake maior que saldo disponível");
      return 0;
    }

    if (nextStake > (this.config.maxStake || Infinity)) {
      console.warn("Stake maior que limite máximo");
      return 0;
    }

    this.currentStake = nextStake;
    return nextStake;
  }

  updateLastTrade(success: boolean) {
    const stake = this.currentStake;
    const profit = success ? stake * (this.config.profitPercent / 100) : -stake;

    this.currentBalance += profit;
    this.sessionProfit += profit;

    if (this.accumulatedLoss > 0) {
      this.accumulatedLoss =
        profit > this.accumulatedLoss ? 0 : this.accumulatedLoss - profit;
    }

    // Verifica se atingiu lucro alvo
    if (
      this.config.targetProfit &&
      this.sessionProfit >= this.config.targetProfit
    ) {
      console.log(
        `🎯 Lucro alvo de $${this.config.targetProfit} atingido! Reiniciando saldo...`
      );

      // Notifica antes de resetar
      if (this.onTargetReached) {
        this.onTargetReached(this.sessionProfit, this.currentBalance);
      }

      this.resetSession();
    }

    this.lastTrade = {
      success,
      stake,
      profit,
      balance: this.currentBalance,
      type: success ? "win" : "loss",
    };

    // Atualiza contadores
    if (success) {
      this.consecutiveLosses = 0;
      if (
        this.recoveryMode &&
        this.consecutiveWins >= this.currentWinsRequired
      ) {
        this.recoveryMode = false;
        this.accumulatedLoss = 0;
        this.consecutiveWins = 0;
      }
    } else {
      this.consecutiveLosses++;
      this.consecutiveWins = 0;
      this.sorosLevel = 0;
    }
  }

  private resetSession() {
    // Reseta para o saldo inicial
    this.currentBalance = this.initialBalance;
    this.sessionProfit = 0;
    this.currentStake = this.config.initialStake;
    this.consecutiveLosses = 0;
    this.consecutiveWins = 0;
    this.sorosLevel = 0;
    this.accumulatedLoss = 0;
    this.recoveryMode = false;
    this.isMartingaleTrade = false;
    this.currentWinsRequired = this.maxWinsRequired;
  }

  private calculateFixedStake(): number {
    return this.config.initialStake;
  }

  private calculateMartingaleStake(): number {
    if (this.lastTrade?.type === "win") {
      this.consecutiveLosses = 0;
      // Após win com martingale, próxima stake é lucro + entrada inicial
      const profit = this.lastTrade.stake * (this.config.profitPercent / 100);
      return this.config.initialStake + profit;
    }

    if (this.config.maxLoss && this.consecutiveLosses >= this.config.maxLoss) {
      console.warn("Limite máximo de losses atingido");
      this.consecutiveLosses = 0;
      return this.config.initialStake;
    }

    // Corrigido cálculo do martingale
    const lastStake = this.lastTrade?.stake || this.config.initialStake;
    const profitRate = this.config.profitPercent / 100;
    const nextStake = (lastStake + this.config.initialStake) / profitRate;

    return Math.min(
      nextStake,
      this.config.maxStake || Infinity,
      this.currentBalance
    );
  }

  private calculateSorosStake(): number {
    if (this.lastTrade?.type === "loss") {
      this.sorosLevel = 0;
      return this.config.initialStake;
    }

    this.sorosLevel++;
    if (this.sorosLevel > (this.config.sorosLevel || 1)) {
      this.sorosLevel = 0;
      return this.config.initialStake;
    }

    // No soros, após vitória, adiciona o lucro da última operação à stake inicial
    const lastProfit = this.lastTrade?.profit || 0;
    return this.config.initialStake + lastProfit;
  }

  private calculateMartingaleSorosStake(): number {
    if (this.lastTrade?.type === "win") {
      if (this.recoveryMode) {
        this.consecutiveWins++;

        if (this.consecutiveWins >= this.currentWinsRequired) {
          const neededProfit = this.accumulatedLoss;
          const profitRate = this.config.profitPercent / 100;
          const recoveryStake =
            (neededProfit + this.config.initialStake) / profitRate;

          const finalStake = Math.min(
            recoveryStake,
            this.config.maxStake || Infinity,
            this.currentBalance
          );

          this.recoveryMode = false;
          this.consecutiveWins = 0;
          this.accumulatedLoss = 0;
          this.isMartingaleTrade = true;

          return finalStake;
        }
        return this.config.initialStake;
      }

      this.isMartingaleTrade = false;
      return this.calculateSorosStake();
    }

    if (this.lastTrade?.type === "loss") {
      if (this.isMartingaleTrade) {
        this.currentWinsRequired =
          Math.floor(Math.random() * this.maxWinsRequired) + 1;
        console.log(
          `Martingale falhou. Novo número de wins necessários: ${this.currentWinsRequired}`
        );
      }

      this.recoveryMode = true;
      this.consecutiveWins = 0;
      this.sorosLevel = 0;
      this.accumulatedLoss += Math.abs(this.lastTrade.profit);
      this.isMartingaleTrade = false;

      return this.config.initialStake;
    }

    return this.config.initialStake;
  }

  getCurrentBalance(): number {
    return this.currentBalance;
  }

  getLastTrade(): TradeResult | null {
    return this.lastTrade;
  }

  getStats() {
    return {
      currentBalance: this.currentBalance,
      initialBalance: this.initialBalance,
      sessionProfit: this.sessionProfit,
      targetProfit: this.config.targetProfit,
      consecutiveLosses: this.consecutiveLosses,
      sorosLevel: this.sorosLevel,
      lastStake: this.lastTrade?.stake || 0,
      lastProfit: this.lastTrade?.profit || 0,
      winsRequired: this.currentWinsRequired,
      currentWins: this.consecutiveWins,
    };
  }
}
