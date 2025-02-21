import { create } from 'zustand';

type Highlight = {
  id: string;
  text: string;
  color: string;
  createdAt: Date;
};



type HighlightStore = {
  highlights: Highlight[];
  addHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => void;
  removeHighlight: (id: string) => void;
  clearHighlights: () => void;
};

export const useHighlightStore = create<HighlightStore>((set) => ({
  highlights: [],
  addHighlight: (highlight) =>
    set((state) => ({
      highlights: [
        ...state.highlights,
        {
          ...highlight,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        },
      ],
    })),
  removeHighlight: (id) =>
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    })),
  clearHighlights: () => set({ highlights: [] }),
}));
