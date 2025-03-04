import { Candle, RsiCandle } from "@/types";

interface RsiCalculationResult {
  rsi: number;
  avgGain: number;
  avgLoss: number;
}

export default class RsiCandlesSeries {
  private data: Candle[] = [];
  private rsiData: RsiCandle[] = [];
  private avgCloseGain: number = 0;
  private avgCloseLoss: number = 0;
  private secondToLastAvgGain: number = 0;
  private secondToLastAvgLoss: number = 0;

  constructor(private lookbackPeriods: number = 14) {}

  setData(data: Candle[]) {
    const { lookbackPeriods } = this;

    this.data = [...data];

    if (this.data.length <= lookbackPeriods) {
      this.rsiData = this.data.map((candle) => ({ time: candle.time }));

      return;
    }

    // Pre-allocate array for better performance
    const rsiCandles = new Array<RsiCandle>(this.data.length);

    // Fill initial periods
    for (let i = 0; i < lookbackPeriods; i++) {
      rsiCandles[i] = { time: this.data[i].time };
    }

    // Calculate initial averages
    let totalGain = 0;
    let totalLoss = 0;

    for (let i = 1; i < lookbackPeriods; i++) {
      const closePriceDiff = this.data[i].close - this.data[i - 1].close;

      totalGain += Math.max(0, closePriceDiff);
      totalLoss += Math.abs(Math.min(0, closePriceDiff));
    }

    this.avgCloseGain = totalGain / lookbackPeriods;
    this.avgCloseLoss = totalLoss / lookbackPeriods;

    // Calculate RSI for remaining candles
    for (let i = lookbackPeriods; i < this.data.length; i++) {
      rsiCandles[i] = this.calculateRsiCandle(this.data[i], this.data[i - 1]);

      if (i === this.data.length - 2) {
        this.secondToLastAvgGain = this.avgCloseGain;
        this.secondToLastAvgLoss = this.avgCloseLoss;
      }
    }

    this.rsiData = rsiCandles;
  }

  update(candle: Candle) {
    if (this.data.length === 0) {
      this.data = [candle];
      this.rsiData = [{ time: candle.time }];

      return;
    }

    const lastIndex = this.data.length - 1;
    const lastCandle = this.data[lastIndex];

    if (lastCandle.time === candle.time) {
      this.avgCloseGain = this.secondToLastAvgGain;
      this.avgCloseLoss = this.secondToLastAvgLoss;

      this.data[lastIndex] = candle;
      this.rsiData[lastIndex] = this.calculateRsiCandle(
        candle,
        this.data[lastIndex - 1],
      );
    } else {
      this.secondToLastAvgGain = this.avgCloseGain;
      this.secondToLastAvgLoss = this.avgCloseLoss;

      this.data.push(candle);
      this.rsiData.push(this.calculateRsiCandle(candle, lastCandle));
    }
  }

  getData(): Candle[] {
    return this.data.map((candle) => ({ ...candle }));
  }

  getRsiData(): RsiCandle[] {
    return this.rsiData.map((candle) => ({ ...candle }));
  }

  getCurrentRsiCandle(): RsiCandle | null {
    if (!this.rsiData.length) return null;

    const lastCandle = this.rsiData[this.rsiData.length - 1];

    return { ...lastCandle };
  }

  private calculateRsiCandle(
    currentCandle: Candle,
    previousCandle: Candle,
  ): RsiCandle {
    const calculateRsi = (gain: number, loss: number): RsiCalculationResult => {
      const avgGain =
        (this.avgCloseGain * (this.lookbackPeriods - 1) + gain) /
        this.lookbackPeriods;
      const avgLoss =
        (this.avgCloseLoss * (this.lookbackPeriods - 1) + loss) /
        this.lookbackPeriods;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;

      return {
        rsi: 100 - 100 / (1 + rs),
        avgGain,
        avgLoss,
      };
    };

    const calcDiff = (current: number): [number, number] => {
      const diff = current - previousCandle.close;

      const gain = Math.max(0, diff);
      const loss = Math.abs(Math.min(0, diff));

      return [gain, loss];
    };

    const [highGain, highLoss] = calcDiff(currentCandle.high);
    const [lowGain, lowLoss] = calcDiff(currentCandle.low);
    const [openGain, openLoss] = calcDiff(currentCandle.open);
    const [closeGain, closeLoss] = calcDiff(currentCandle.close);

    const { rsi: highRsi } = calculateRsi(highGain, highLoss);
    const { rsi: lowRsi } = calculateRsi(lowGain, lowLoss);
    const { rsi: openRsi } = calculateRsi(openGain, openLoss);
    const {
      rsi: closeRsi,
      avgGain,
      avgLoss,
    } = calculateRsi(closeGain, closeLoss);

    this.avgCloseGain = avgGain;
    this.avgCloseLoss = avgLoss;

    return {
      time: currentCandle.time,
      high: highRsi,
      low: lowRsi,
      open: openRsi,
      close: closeRsi,
    };
  }
}
