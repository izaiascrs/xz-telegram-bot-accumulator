export type ManagementType = 'fixed' | 'martingale' | 'soros' | 'martingale-soros';

export type MoneyManagementV2 = {
  type: 'fixed' | 'martingale' | 'soros' | 'martingale-soros';
  initialStake: number;
  maxStake?: number;
  profitPercent: number;
  maxLoss?: number;
  sorosLevel?: number;
  winsBeforeMartingale?: number;
  targetProfit?: number;
  initialBalance: number;
};

export type MoneyManagement = {
  type: "fixed" | "martingale-soros" | "fixed-with-recovery";
  initialStake: number;
  profitPercent: number;
  maxStake: number;
  maxLoss: number;
  sorosLevel: number;
  // Campos para o fixed-with-recovery
  enableSoros: boolean;
  sorosPercent: number;
  winsBeforeRecovery: number;
  initialBalance: number;
};

export interface TradeResult {
  success: boolean;
  stake: number;
  profit: number;
  balance: number; 
  type: 'win' | 'loss';
}
