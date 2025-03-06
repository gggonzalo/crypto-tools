import { Interval, SymbolInfo } from "@/common/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Alert } from "./types";

type State = {
  symbol: string;
  symbolInfo: SymbolInfo | null;
  symbolInfoStatus: "unloaded" | "loading" | "loaded";
  alerts: Alert[];
  interval: Interval;
};

const useAlertsStore = create<State>()(
  persist(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_) => ({
      symbol: "BTCUSDT",
      symbolInfo: null,
      symbolInfoStatus: "unloaded",
      alerts: [],
      interval: "OneMinute",
    }),
    {
      name: "persistent-alerts-store",
      partialize: (state) => ({ symbol: state.symbol }),
    },
  ),
);

export default useAlertsStore;
