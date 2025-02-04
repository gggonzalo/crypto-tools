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

export type AlertStatus = "Active" | "Triggered";

export interface Alert {
  id: string;
  symbol: string;
  valueOnCreation: number;
  valueTarget: number;
  status: AlertStatus;
  createdAt: string;
}
