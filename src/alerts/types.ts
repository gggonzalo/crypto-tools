import { Interval } from "@/common/types";

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
