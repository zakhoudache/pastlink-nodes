import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import produce from 'immer';

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
        set(
          produce((state: HighlightState) => {
            state.highlights.push(highlight);
          })
        ),
      removeHighlight: (id: string) =>
        set(
          produce((state: HighlightState) => {
            state.highlights = state.highlights.filter((h) => h.id !== id);
          })
        ),
      updateHighlight: (highlight: Highlight) =>
        set(
          produce((state: HighlightState) => {
            const index = state.highlights.findIndex((h) => h.id === highlight.id);
            if (index !== -1) {
              state.highlights[index] = { ...state.highlights[index], ...highlight };
            }
          })
        ),
      clearHighlights: () =>
        set(
          produce((state: HighlightState) => {
            state.highlights = [];
          })
        ),
      setHighlights: (highlights: Highlight[]) => set({ highlights }),
    }),
    {
      name: 'highlight-store', // Key for localStorage persistence
      // Optionally, you can specify a custom storage here.
    }
  )
);
