import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// First, let's define our types for better type safety
export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Waypoint {
  id: string;
  coordinates: Coordinate;
  distanceFromPrevious?: number;
  type: 'waypoint' | 'polygon-start' | 'polygon-end';
  polygonId?: string;  // To group polygon points together
}

interface DrawingState {
  // Core state
  waypoints: Waypoint[];
  tempWaypoints: Waypoint[];  // Stores points while actively drawing
  isDrawing: boolean;
  drawingMode: 'LineString' | 'Polygon' | null;
  activeWaypointId: string | null;
  insertionIndex: number | null;  // Where to insert polygon points
  activePolygonId: string | null;

  // Actions for waypoint management
  addTempWaypoint: (coordinate: Coordinate) => void;
  commitWaypoints: () => void;
  calculateDistances: (waypoints: Waypoint[]) => Waypoint[];
  
  // Drawing control actions
  startLineDrawing: () => void;
  startPolygonDrawing: (insertIndex: number) => void;
  finishDrawing: () => void;
  
  // Polygon-specific actions
  importPolygonPoints: () => void;
  discardPolygon: () => void;
  
  // Utility actions
  setActiveWaypoint: (id: string | null) => void;
  clearWaypoints: () => void;
}

export const useDrawingStore = create<DrawingState>((set, get) => ({
  // Initial state
  waypoints: [],
  tempWaypoints: [],
  isDrawing: false,
  drawingMode: null,
  activeWaypointId: null,
  insertionIndex: null,
  activePolygonId: null,

  // Calculate distances between consecutive points
  calculateDistances: (points: Waypoint[]) => {
    return points.map((point, index) => {
      if (index === 0) return point;

      const prevPoint = points[index - 1];
      const distance = calculateDistance(
        prevPoint.coordinates,
        point.coordinates
      );

      return { ...point, distanceFromPrevious: distance };
    });
  },

  // Add a temporary waypoint while drawing
  addTempWaypoint: (coordinate: Coordinate) => set((state) => {
    const newWaypoint: Waypoint = {
      id: uuidv4(),
      coordinates: coordinate,
      type: state.drawingMode === 'Polygon' ? 'polygon-start' : 'waypoint',
      ...(state.drawingMode === 'Polygon' && {
        polygonId: state.activePolygonId
      })
    };

    return {
      tempWaypoints: [...state.tempWaypoints, newWaypoint]
    };
  }),

  // Commit temporary waypoints when drawing is finished
  commitWaypoints: () => set((state) => {
    const calculatedWaypoints = state.calculateDistances(state.tempWaypoints);
    
    if (state.drawingMode === 'LineString') {
      return {
        waypoints: calculatedWaypoints,
        tempWaypoints: [],
        isDrawing: false,
        drawingMode: null
      };
    }
    
    // For polygon, keep temporary points until import
    return {
      tempWaypoints: calculatedWaypoints,
      isDrawing: false
    };
  }),

  // Start drawing a line
  startLineDrawing: () => set({
    isDrawing: true,
    drawingMode: 'LineString',
    tempWaypoints: [],
  }),

  // Start drawing a polygon
  startPolygonDrawing: (insertIndex: number) => set({
    isDrawing: true,
    drawingMode: 'Polygon',
    insertionIndex: insertIndex,
    activePolygonId: uuidv4(),
    tempWaypoints: [],
  }),

  // Finish the current drawing operation
  finishDrawing: () => set((state) => {
    if (!state.isDrawing) return state;
    
    const updatedWaypoints = state.calculateDistances(state.tempWaypoints);
    return {
      tempWaypoints: updatedWaypoints,
      isDrawing: false,
    };
  }),

  // Import polygon points into the main waypoint array
  importPolygonPoints: () => set((state) => {
    if (state.insertionIndex === null) return state;

    const beforePoints = state.waypoints.slice(0, state.insertionIndex);
    const afterPoints = state.waypoints.slice(state.insertionIndex);
    
    // Add connection points for the polygon
    const polygonPoints = state.tempWaypoints.map(point => ({
      ...point,
      type: point.type === 'waypoint' ? 'polygon-start' : point.type
    }));

    const allPoints = [...beforePoints, ...polygonPoints, ...afterPoints];
    
    return {
      waypoints: state.calculateDistances(allPoints),
      tempWaypoints: [],
      insertionIndex: null,
      activePolygonId: null,
      drawingMode: null
    };
  }),

  // Discard the current polygon
  discardPolygon: () => set({
    tempWaypoints: [],
    insertionIndex: null,
    activePolygonId: null,
    drawingMode: null,
  }),

  // Utility functions
  setActiveWaypoint: (id) => set({ activeWaypointId: id }),
  clearWaypoints: () => set({
    waypoints: [],
    tempWaypoints: [],
    isDrawing: false,
    drawingMode: null,
    activeWaypointId: null,
    insertionIndex: null,
    activePolygonId: null,
  }),
}));

// Helper function to calculate distance between two coordinates
function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  // Use Haversine formula for accurate Earth distances
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}