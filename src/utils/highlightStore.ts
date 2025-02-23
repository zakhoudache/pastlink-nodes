// src/utils/highlightStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  updateHighlight: (highlight: Highlight) => void;
  clearHighlights: () => void;
  setHighlights: (highlights: Highlight[]) => void;
}

export const useHighlightStore = create<HighlightState>()(
  persist(
    (set, get) => ({
      highlights: [],
      addHighlight: (highlight: Highlight) =>
        set((state) => ({ highlights: [...state.highlights, highlight] })),
      removeHighlight: (id: string) =>
        set((state) => ({ highlights: state.highlights.filter((h) => h.id !== id) })),
      updateHighlight: (highlight: Highlight) =>
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === highlight.id ? { ...h, ...highlight } : h
          ),
        })),
      clearHighlights: () => set({ highlights: [] }),
      setHighlights: (highlights: Highlight[]) => set({ highlights }),
    }),
    {
      name: 'highlight-store', // key for localStorage
      // Optionally, specify storage: getStorage() => localStorage
    }
  )
);
