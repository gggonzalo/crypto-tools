import { create } from "zustand";

type State = {
  pushNotificationsStatus: "unloaded" | "active" | "inactive" | "unavailable";
};

const useAppStore = create<State>()(() => ({
  pushNotificationsStatus: "unloaded",
}));

export default useAppStore;
