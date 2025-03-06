export type PositionStatus = "Closed" | "Filled";

export interface Position {
  id: number;
  symbol: string;
  side: "Buy" | "Sell";
  amount: number;
  price: number;
  // TODO: Make this optional
  tp: number;
  endReason?: PositionStatus;
  endPrice?: number;
}
