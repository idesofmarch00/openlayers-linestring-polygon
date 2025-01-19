import { Coordinate } from 'ol/coordinate';

export interface Waypoint {
  id: string;
  coordinates: Coordinate;
  distanceFromPrevious: number | null;
  type: 'linestring' | 'polygon';
}

export interface DrawingState {
  waypoints: Waypoint[];
  isDrawing: boolean;
  drawingMode: 'LineString' | 'Polygon' | null;
  activeWaypointId: string | null;
  addWaypoint: (waypoint: Waypoint) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setDrawingMode: (mode: 'LineString' | 'Polygon' | null) => void;
  setActiveWaypoint: (id: string | null) => void;
  clearWaypoints: () => void;
}