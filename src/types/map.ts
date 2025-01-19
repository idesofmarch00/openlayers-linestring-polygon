import { Map as OLMap } from 'ol';
import { Draw } from 'ol/interaction';

export interface MapState {
    map: OLMap | null;
    draw: Draw | null;
    isDrawing: boolean;
    drawingMode: 'LineString' | 'Polygon' | null;
  }