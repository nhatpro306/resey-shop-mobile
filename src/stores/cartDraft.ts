import { create } from "zustand";

// Client-only state: a pre-checkout selection of variant + quantity.
// Server cart lives in TanStack Query, NOT here.
export interface DraftLine {
  productId: string;
  variantId: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
}

interface CartDraftState {
  lines: DraftLine[];
  setLine: (line: DraftLine) => void;
  clear: () => void;
}

export const useCartDraft = create<CartDraftState>((set) => ({
  lines: [],
  setLine: (line) =>
    set((s) => {
      const i = s.lines.findIndex(
        (l) => l.productId === line.productId && l.variantId === line.variantId,
      );
      if (i === -1) return { lines: [...s.lines, line] };
      const next = s.lines.slice();
      next[i] = line;
      return { lines: next };
    }),
  clear: () => set({ lines: [] }),
}));
