
import { create } from 'zustand';

export interface Highlight {
  id: string;
  text: string;
  type?: string;
  from?: number;
  to?: number;
}

interface HighlightStore {
  highlights: Highlight[];
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;
  setHighlights: (highlights: Highlight[]) => void;
  clearHighlights: () => void;
}

export const useHighlightStore = create<HighlightStore>((set, get) => ({
  highlights: [],
  addHighlight: (highlight) => {
    set((state) => ({
      highlights: [...state.highlights, highlight],
    }));
    localStorage.setItem('highlights', JSON.stringify(get().highlights));
  },
  removeHighlight: (id) => {
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    }));
    localStorage.setItem('highlights', JSON.stringify(get().highlights));
  },
  setHighlights: (highlights) => {
    set({ highlights });
    localStorage.setItem('highlights', JSON.stringify(highlights));
  },
  clearHighlights: () => {
    set({ highlights: [] });
    localStorage.removeItem('highlights');
  },
}));
