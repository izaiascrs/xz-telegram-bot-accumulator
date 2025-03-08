import { loadHistoricalData } from "../utils/load-data";
import { ConfigOptimizer } from "./optmizer/config-optmizer";
import { runBackTest } from "./run-backtest";
import { ThreeAboveStrategy } from "./strategies/above-one";

export async function getBackTestResults() {
  let optimizer: ConfigOptimizer | undefined;
  
  const digitStrategies = Array.from({ length: 10 }).map(
    (_, i) => new ThreeAboveStrategy({ entryDigit: i, compareDigit: 5 })
  );

  try {
    const data = (await loadHistoricalData({
      symbol: "R_10",
      count: (1_800 * 12), // 12 hours
      format: "digits",
    })) as number[];

    const backTestResults = digitStrategies.map((strategy) =>
      runBackTest(data, strategy, 100)
    );

    const digitsTradesHistory = backTestResults.map(
      (backTest) => backTest.digitStats
    );
    optimizer = new ConfigOptimizer(digitsTradesHistory, 6);
  } catch (error) {
    console.error("Erro ao executar backtest:", error);
  }

  return optimizer;
}
