import apiManager from "../ws";

const convertTicksToDigits = (ticks: { price: number, time: number }[], pipSize: number) => {
  return ticks.map((tick) => +(tick.price.toFixed(pipSize).slice(-1)));
}

const loadTicksData = async ({
  symbol = "R_100",
  endTime = "latest",
  count = 5000
}: {
  symbol: string;
  endTime?: string;
  count: number;
}) => {
  const response = await apiManager.augmentedSend("ticks_history", {
    "ticks_history": symbol,    
    "start": 1,
    "end": endTime,
    "count":  count as unknown as undefined,
  });


  const prices = response.history?.prices ?? [];
  const times = response.history?.times ?? [];
  const pipSize = response.pip_size ?? 2 as number;
  return {
    ticks: prices.map((price, i) => ({
      price,
      time: times[i] 
    })),
    pipSize
  }

}

export async function loadHistoricalData<T extends "ticks" | "digits">({
  symbol = "R_100",
  count = 50_000,
  endTime = "latest",
  format = "ticks" as T
}: {
  symbol: string;
  count: number;
  endTime?: string;
  format?: T;
}): Promise<T extends "digits" ? number[] : {
  ticks: { price: number; time: number; }[];
  pipSize: number;
}> {
  const data = {
    ticks: [] as { price: number, time: number }[],
    pipSize: 2
  }
  
  while(data.ticks.length < count) {
    const { ticks, pipSize } = await loadTicksData({ symbol, endTime, count: count - data.ticks.length });
    data.ticks.unshift(...ticks);
    data.pipSize = pipSize;
    const first = ticks.at(0)?.time;
    if(!first) break;
    endTime = Math.floor(new Date(first).getTime() / 1000).toString();
  }

  return (format === "digits" 
    ? convertTicksToDigits(data.ticks, data.pipSize)
    : data
  ) as T extends "digits" ? number[] : {
    ticks: { price: number; time: number; }[];
    pipSize: number;
  };
}