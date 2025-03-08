import { Strategy, MoneyManagement } from '../types';

const defaultManagement: MoneyManagement = {
  type: 'fixed',  // Vamos testar com martingale primeiro
  initialStake: 0.35,
  profitPercent: 137,   // 137% de lucro
  maxStake: 100,
  maxLoss: 7,
  sorosLevel: 3,
  targetTick: 10        // Gerenciamento apenas no tick 2
};

interface StrategyConfig {
  entryDigit: number;    // Dígito para entrada (padrão 3)
  compareDigit: number;  // Dígito para comparação (padrão 1)
}

const defaultConfig: StrategyConfig = {
  entryDigit: 3,
  compareDigit: 1
};

export class ThreeAboveStrategy implements Strategy {
  name: string;
  minTicks: number;
  virtualLoss: number;
  moneyManagement: MoneyManagement;
  config: StrategyConfig;

  constructor(config: Partial<StrategyConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.name = `${this.config.entryDigit} Acima de ${this.config.compareDigit}`;
    this.minTicks = 1;
    this.virtualLoss = 1;
    this.moneyManagement = defaultManagement;
  }

  execute(digits: number[], position: number, ticksToAnalyze: number): boolean | null {
    // Verifica se o dígito atual é o dígito de entrada
    if (digits[position] !== this.config.entryDigit) {
      return null;
    }

    // Verifica se há dígitos suficientes para análise
    if (position + ticksToAnalyze >= digits.length) {
      return null;
    }

    // Verifica se o dígito no tick alvo é maior que o dígito de comparação
    const targetDigit = digits[position + ticksToAnalyze];
    return targetDigit > this.config.compareDigit;
  }
}

// Exporta a estratégia padrão (3 acima de 1)
export const ThreeAboveOneStrategy = new ThreeAboveStrategy({ entryDigit: 3, compareDigit: 1 });
