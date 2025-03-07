import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Position } from "./types";

type State = {
  newPositionSymbol: string;
  positions: Position[];
};

type Actions = {
  reset: () => void;
};

const initialState: State = {
  newPositionSymbol: "BTCUSDT",
  positions: [],
};

const usePositionsStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      reset: () => set(() => initialState),
    }),
    {
      name: "persistent-positions-store",
      partialize: (state) => ({ newPositionSymbol: state.newPositionSymbol }),
    },
  ),
);

export default usePositionsStore;
