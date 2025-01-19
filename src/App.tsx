import React from 'react';
import MapComponent from './components/Map/Map';
import 'ol/ol.css';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Marine Navigation Planner</h1>
      </header>
      <main className="flex-1 relative">
        <MapComponent />
        <div className="absolute top-4 left-4 z-10">
          {/* Controls will be added here */}
        </div>
      </main>
    </div>
  );
};

export default App;