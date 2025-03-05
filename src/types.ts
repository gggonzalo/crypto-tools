// TODO: Reorg later

export interface SymbolDisplayInfo {
  logo: string;
}

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

export interface RsiCandle {
  time: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}

export type AlertStatus = "Active" | "Triggered";
export type AlertType = "Price" | "Rsi";

export interface PriceAlert {
  type: "Price";
}

export interface RsiAlert {
  type: "Rsi";
  interval: Interval;
}

export type Alert = (PriceAlert | RsiAlert) & {
  id: string;
  symbol: string;
  status: AlertStatus;
  subscriptionId: string;
  createdAt: string;
  valueOnCreation: number;
  valueTarget: number;
};
