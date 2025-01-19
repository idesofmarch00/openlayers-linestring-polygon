import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useDrawingStore } from '@/store/useDrawingStore';
import { MoreVertical, X } from 'lucide-react';
import { Menu } from '@headlessui/react';

type ModalView = 'MISSION' | 'POLYGON';

const MissionModal: React.FC = () => {
  const [currentView, setCurrentView] = useState<ModalView>('MISSION');
  
  const {
    waypoints,
    tempWaypoints,
    isDrawing,
    drawingMode,
    startPolygonDrawing,
    importPolygonPoints,
    discardPolygon
  } = useDrawingStore();

  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // Show modal when drawing or have waypoints
  const showModal = isDrawing || waypoints.length > 0;

  const handleClose = () => {
    if (!isDrawing) {
      if (currentView === 'POLYGON') {
        discardPolygon();
        setCurrentView('MISSION');
      }
      console.log('Modal closed');
    }
  };

  const handlePolygonInsertion = (index: number, position: 'before' | 'after') => {
    const actualIndex = position === 'after' ? index + 1 : index;
    setInsertIndex(actualIndex);
    setCurrentView('POLYGON');
    startPolygonDrawing(actualIndex);
  };

  const handleImportPolygon = () => {
    importPolygonPoints();
    setCurrentView('MISSION');
    setInsertIndex(null);
  };

  const handleDiscardPolygon = () => {
    discardPolygon();
    setCurrentView('MISSION');
    setInsertIndex(null);
  };

  if (!showModal) return null;

  return (
    <Dialog
      open={showModal}
      onClose={handleClose}
      className="fixed right-4 top-4 w-[420px] z-20"
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">
              {currentView === 'POLYGON' ? 'Polygon Tool' : 'Mission Creation'}
            </h2>
            <div className="text-sm text-gray-600">
              {currentView === 'POLYGON' ? 'Draw Polygon' : 'Waypoint Navigation'}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isDrawing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {currentView === 'POLYGON' ? (
            // Polygon view
            <div>
              <div className="border border-dashed border-gray-300 rounded-lg p-4 mb-4">
                <p className="text-center text-gray-600 text-sm">
                  Click on the map to mark points of the polygon's perimeter,
                  then press ↵ to close and complete the polygon
                </p>
              </div>
              {tempWaypoints.length > 0 && (
                <div className="space-y-2 mb-4">
                  {tempWaypoints.map((point, index) => (
                    <div key={point.id} className="text-sm text-gray-600">
                      Point {index + 1}: ({point.coordinates.lat.toFixed(6)}, {point.coordinates.lng.toFixed(6)})
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between gap-4">
                <button
                  onClick={handleDiscardPolygon}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Discard
                </button>
                <button
                  onClick={handleImportPolygon}
                  disabled={tempWaypoints.length < 3}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Import Points
                </button>
              </div>
            </div>
          ) : (
            // Mission view
            <>
              {waypoints.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-4 mb-4">
                  <p className="text-center text-gray-600 text-sm">
                    Click on the map to mark points of the route and then press ↵ to complete the route.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {waypoints.map((waypoint, index) => (
                    <div
                      key={waypoint.id}
                      className="grid grid-cols-[1fr_auto] gap-4 items-center px-2 py-1 hover:bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">
                          WP({String(index).padStart(2, '0')})
                        </div>
                        <div className="text-sm text-gray-600">
                          {`${waypoint.coordinates.lat.toFixed(8)}, ${waypoint.coordinates.lng.toFixed(8)}`}
                        </div>
                        {waypoint.distanceFromPrevious && (
                          <div className="text-sm text-gray-500">
                            Distance: {waypoint.distanceFromPrevious.toFixed(2)}m
                          </div>
                        )}
                      </div>

                      <Menu as="div" className="relative">
                        <Menu.Button className="p-2 hover:bg-gray-100 rounded-full">
                          <MoreVertical className="h-5 w-5 text-gray-500" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handlePolygonInsertion(index, 'before')}
                                className={`${
                                  active ? 'bg-blue-500 text-white' : 'text-gray-900'
                                } flex w-full items-center px-4 py-2 text-sm`}
                              >
                                Insert Polygon Before
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handlePolygonInsertion(index, 'after')}
                                className={`${
                                  active ? 'bg-blue-500 text-white' : 'text-gray-900'
                                } flex w-full items-center px-4 py-2 text-sm`}
                              >
                                Insert Polygon After
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 flex justify-center">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Generate Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default MissionModal;