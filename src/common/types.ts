export interface PriceFormat {
  minMove: number;
  precision: number;
}

export interface QuantityFormat {
  minMove: number;
  precision: number;
}

export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  priceFormat: PriceFormat;
  quantityFormat: QuantityFormat;
}

export type Interval =
  | "OneMinute"
  | "FiveMinutes"
  | "FifteenMinutes"
  | "OneHour"
  | "FourHour"
  | "OneDay"
  | "OneWeek"
  | "OneMonth";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SymbolIntervalCandle {
  symbol: string;
  interval: Interval;
  candle: Candle;
}

export interface RsiCandle {
  time: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}
