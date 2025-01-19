import React from 'react';
import { useDrawingStore } from '@/store/useDrawingStore';
import type { VectorSource } from 'ol/source/Vector';

interface Props {
  vectorSource: VectorSource;
}

const DrawingControls: React.FC<Props> = () => {
  const {
    isDrawing,
    drawingMode,
    startLineDrawing,
    finishDrawing,
    commitWaypoints
  } = useDrawingStore();

  const handleKeyPress = React.useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && isDrawing) {
      // Prevent the default refresh behavior
      e.preventDefault();
      e.stopPropagation();
      
      // First finish the drawing to update state
      finishDrawing();
      
      // Then commit the waypoints to make them permanent
      commitWaypoints();
    }
  }, [isDrawing, finishDrawing, commitWaypoints]);

  // Use capture phase to ensure we catch the event before it bubbles
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress, true);
    return () => document.removeEventListener('keydown', handleKeyPress, true);
  }, [handleKeyPress]);

  return (
    <div className="absolute top-20 left-4 z-10 space-y-2">
      <button
        onClick={() => {
          if (!isDrawing) {
            startLineDrawing();
          }
        }}
        disabled={isDrawing}
        className={`px-4 py-2 rounded-md text-white font-medium ${
          drawingMode === 'LineString' 
            ? 'bg-blue-700' 
            : isDrawing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isDrawing ? 'Press Enter to finish' : 'Draw Path'}
      </button>
    </div>
  );
};

export default DrawingControls;