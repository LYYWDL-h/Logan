import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Waypoint, RouteData } from '../types';

// Fix for default Leaflet marker icons in React
const createCustomIcon = (index: number) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-8 h-8 bg-brand-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform duration-200">${index + 1}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16], // Center the icon on the point
  });
};

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to fit bounds
const FitBounds: React.FC<{ routeData: RouteData | null, waypoints: Waypoint[] }> = ({ routeData, waypoints }) => {
  const map = useMap();

  useEffect(() => {
    if (routeData && routeData.geometry.length > 0) {
      const bounds = L.latLngBounds(routeData.geometry);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (waypoints.length > 1) {
       const group = L.featureGroup(waypoints.map(wp => L.marker([wp.lat, wp.lng])));
       map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [routeData, waypoints, map]);

  return null;
};

interface InteractiveMapProps {
  waypoints: Waypoint[];
  routeData: RouteData | null;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerDelete: (id: string) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  waypoints,
  routeData,
  onMapClick,
  onMarkerDelete,
}) => {
  // Default center: Beijing (as mentioned in slides "Beijing area attractions")
  const defaultCenter: [number, number] = [39.9042, 116.4074];

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-brand-100">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onMapClick={onMapClick} />
        <FitBounds routeData={routeData} waypoints={waypoints} />

        {waypoints.map((wp, index) => (
          <Marker
            key={wp.id}
            position={[wp.lat, wp.lng]}
            icon={createCustomIcon(index)}
          >
            <Popup>
              <div className="text-center min-w-[160px]">
                <p className="font-bold text-gray-700 mb-1">{wp.name}</p>
                {wp.notes && (
                  <div className="bg-brand-50 rounded p-2 mb-2 text-left">
                     <p className="text-xs text-gray-600 italic break-words">"{wp.notes}"</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mb-2">{wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}</p>
                <button
                  onClick={() => onMarkerDelete(wp.id)}
                  className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors w-full font-medium"
                >
                  移除地点
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {routeData && (
          <Polyline
            positions={routeData.geometry}
            pathOptions={{ color: '#0ea5e9', weight: 5, opacity: 0.8 }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;