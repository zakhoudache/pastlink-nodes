// src/utils/highlightStore.ts
import { create } from 'zustand';

export interface Highlight {
  id: string;
  text: string;
  from: number;
  to: number;
}

interface HighlightState {
  highlights: Highlight[];
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;
  setHighlights: (highlights: Highlight[]) => void;
}

export const useHighlightStore = create<HighlightState>((set) => ({
  highlights: [],
  addHighlight: (highlight) => set((state) => ({ highlights: [...state.highlights, highlight] })),
  removeHighlight: (id) => set((state) => ({ highlights: state.highlights.filter((h) => h.id !== id) })),
  setHighlights: (highlights) => set({ highlights }),
}));