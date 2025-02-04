import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Alert, Interval, SymbolInfo } from "@/types";

type State = {
  symbol: string;
  symbolInfo: SymbolInfo | null;
  symbolInfoStatus: "unloaded" | "loading" | "loaded";
  alerts: Alert[];
  interval: Interval;
};

const useAlertsStore = create<State>()(
  persist(
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
