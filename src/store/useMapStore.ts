// src/store/useMapStore.ts
import { create } from 'zustand';
import { Map as OLMap } from 'ol';
import { Draw } from 'ol/interaction';

interface MapState {
  map: OLMap | null;
  draw: Draw | null;
  isDrawing: boolean;
  drawingMode: 'LineString' | 'Polygon' | null;
  setMap: (map: OLMap | null) => void;
  setDraw: (draw: Draw | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setDrawingMode: (mode: 'LineString' | 'Polygon' | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  map: null,
  draw: null,
  isDrawing: false,
  drawingMode: null,
  setMap: (map) => set({ map }),
  setDraw: (draw) => set({ draw }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setDrawingMode: (drawingMode) => set({ drawingMode }),
}));