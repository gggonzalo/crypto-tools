import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Position } from "./types";

type State = {
  newPositionSymbol: string;
  positions: Position[];
};

const usePositionsStore = create<State>()(
  persist(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_) => ({
      newPositionSymbol: "BTCUSDT",
      positions: [],
    }),
    {
      name: "persistent-positions-store",
      partialize: (state) => ({ newPositionSymbol: state.newPositionSymbol }),
    },
  ),
);

export default usePositionsStore;
