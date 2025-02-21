
import { create } from 'zustand';

interface Highlight {
  id: string;
  text: string;
  from: number;
  to: number;
}

interface HighlightStore {
  highlights: Highlight[];
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;
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
  clearHighlights: () => {
    set({ highlights: [] });
    localStorage.removeItem('highlights');
  },
}));
