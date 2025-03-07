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

type Actions = {
  reset: () => void;
};

const initialState: State = {
  symbol: "BTCUSDT",
  symbolInfo: null,
  symbolInfoStatus: "unloaded",
  alerts: [],
  interval: "OneMinute",
};

const useAlertsStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      reset: () =>
        set((state) => ({
          ...initialState,
          symbol: state.symbol, // Preserve persisted state
        })),
    }),
    {
      name: "persistent-alerts-store",
      partialize: (state) => ({ symbol: state.symbol }),
    },
  ),
);

export default useAlertsStore;
