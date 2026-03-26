import { create } from "zustand";

interface OpenfortStore {
  openfortAddress: string | null;
  setOpenfortAddress: (address: string | null) => void;
}

export const useOpenfortStore = create<OpenfortStore>((set) => ({
  openfortAddress: null,
  setOpenfortAddress: (address) => set({ openfortAddress: address }),
}));
