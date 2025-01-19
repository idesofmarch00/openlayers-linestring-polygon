import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString, Polygon } from 'ol/geom';
import { Style, Stroke, Circle, Fill } from 'ol/style';
import { useMapStore } from '@/store/useMapStore';
import { useDrawingStore } from '@/store/useDrawingStore';
import DrawingControls from './DrawingControls';
import MissionModal from '../Modals/MissionModal';

// Define our styles for different feature types
const styles = {
  waypoint: new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({ color: '#3b82f6' }),
      stroke: new Stroke({ color: '#2563eb', width: 2 })
    }),
    stroke: new Stroke({
      color: '#3b82f6',
      width: 3
    })
  }),
  polygon: new Style({
    stroke: new Stroke({
      color: '#f59e0b',
      width: 2,
      lineDash: [5, 5]
    }),
    fill: new Fill({
      color: 'rgba(245, 158, 11, 0.1)'
    })
  }),
  activePoint: new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({ color: '#ef4444' }),
      stroke: new Stroke({ color: '#dc2626', width: 2 })
    })
  })
};

const MapComponent: React.FC = () => {
  // References for our DOM element and vector sources
  const mapRef = useRef<HTMLDivElement>(null);
  const mainVectorSourceRef = useRef<VectorSource>(new VectorSource());
  const tempVectorSourceRef = useRef<VectorSource>(new VectorSource());
  
  // Get our store functions
  const setMap = useMapStore(state => state.setMap);
  const {
    waypoints,
    tempWaypoints,
    drawingMode,
    isDrawing,
    addTempWaypoint,
    activeWaypointId
  } = useDrawingStore();

  // Initialize our map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create our vector layers
    const mainVectorLayer = new VectorLayer({
      source: mainVectorSourceRef.current,
      style: (feature) => {
        const type = feature.get('type');
        return type === 'polygon' ? styles.polygon : styles.waypoint;
      }
    });

    const tempVectorLayer = new VectorLayer({
      source: tempVectorSourceRef.current,
      style: styles.waypoint
    });

    // Initialize the map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        mainVectorLayer,
        tempVectorLayer
      ],
      view: new View({
        // Center on Bangladesh coordinates as shown in your image
        center: fromLonLat([89.5466, 22.8456]),
        zoom: 8
      })
    });

    // Handle click events for adding points
    map.on('click', (event) => {
      if (!isDrawing) return;

      const coordinate = event.coordinate;
      const lonLat = toLonLat(coordinate);
      
      addTempWaypoint({
        lat: lonLat[1],
        lng: lonLat[0]
      });
    });

    setMap(map);

    return () => {
      setMap(null);
      map.setTarget(undefined);
    };
  }, [setMap, isDrawing, addTempWaypoint]);

  // Update features when waypoints change
  useEffect(() => {
    const mainSource = mainVectorSourceRef.current;
    mainSource.clear();

    // Create features for permanent waypoints
    if (waypoints.length > 0) {
      // Add points
      waypoints.forEach((waypoint) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([waypoint.coordinates.lng, waypoint.coordinates.lat])),
          type: waypoint.type,
          id: waypoint.id
        });
        mainSource.addFeature(feature);
      });

      // Add line connecting waypoints
      const lineCoords = waypoints.map(wp => 
        fromLonLat([wp.coordinates.lng, wp.coordinates.lat])
      );
      const lineFeature = new Feature({
        geometry: new LineString(lineCoords),
        type: 'waypoint'
      });
      mainSource.addFeature(lineFeature);

      // Add polygons if they exist
      const polygonGroups = waypoints.reduce((groups: Record<string, any[]>, wp) => {
        if (wp.polygonId) {
          if (!groups[wp.polygonId]) groups[wp.polygonId] = [];
          groups[wp.polygonId].push(wp);
        }
        return groups;
      }, {});

      Object.values(polygonGroups).forEach(polygonPoints => {
        if (polygonPoints.length > 2) {
          const coords = polygonPoints.map(p => 
            fromLonLat([p.coordinates.lng, p.coordinates.lat])
          );
          coords.push(coords[0]); // Close the polygon
          
          const polygonFeature = new Feature({
            geometry: new Polygon([coords]),
            type: 'polygon'
          });
          mainSource.addFeature(polygonFeature);
        }
      });
    }
  }, [waypoints]);

  // Update temporary features while drawing
  useEffect(() => {
    const tempSource = tempVectorSourceRef.current;
    tempSource.clear();

    if (tempWaypoints.length > 0) {
      // Add temporary points
      tempWaypoints.forEach((waypoint) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([waypoint.coordinates.lng, waypoint.coordinates.lat])),
          type: waypoint.type,
          id: waypoint.id
        });
        tempSource.addFeature(feature);
      });

      // Add temporary line
      const lineCoords = tempWaypoints.map(wp => 
        fromLonLat([wp.coordinates.lng, wp.coordinates.lat])
      );
      
      if (drawingMode === 'Polygon' && lineCoords.length > 2) {
        lineCoords.push(lineCoords[0]); // Close polygon while drawing
        const polygonFeature = new Feature({
          geometry: new Polygon([lineCoords]),
          type: 'polygon'
        });
        tempSource.addFeature(polygonFeature);
      } else {
        const lineFeature = new Feature({
          geometry: new LineString(lineCoords),
          type: 'waypoint'
        });
        tempSource.addFeature(lineFeature);
      }
    }
  }, [tempWaypoints, drawingMode]);

  return (
    <>
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ backgroundColor: '#f8f9fa' }}
      />
      <DrawingControls vectorSource={mainVectorSourceRef.current} />
      <MissionModal />
    </>
  );
};

export default MapComponent;