import { create } from 'zustand'

export interface StagedItem {
  id: string
  filePath: string
  startLine: number
  endLine: number
  comment: string
}

interface StagingStore {
  items: StagedItem[]
  addItem: (item: Omit<StagedItem, 'id'>) => void
  removeItem: (id: string) => void
  clear: () => void
}

let nextId = 1

export const useStagingStore = create<StagingStore>((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          ...item,
          id: `staged-${nextId++}`,
        },
      ],
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  clear: () => set({ items: [] }),
}))
