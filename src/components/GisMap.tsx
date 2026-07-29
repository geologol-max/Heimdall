import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  InspectionRecord, 
  InspectorUser, 
  fetchInspections, 
  RiskLevel, 
  MethodologyType,
  supabase 
} from '../lib/supabase';
import InspeccionModal from './InspeccionModal';
import { 
  Layers, 
  Search, 
  RefreshCw, 
  Plus, 
  Building2, 
  Calendar, 
  UserCheck, 
  MapPin,
  Crosshair,
  Info
} from 'lucide-react';

// Solución para iconos por defecto de Leaflet en Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Coordenadas por defecto San Cristóbal, Táchira, Venezuela
const SAN_CRISTOBAL_CENTER: [number, number] = [7.7669, -72.2250];

// Crear iconos SVG personalizados por nivel de riesgo sísmico
const createCustomMarker = (riskLevel: RiskLevel) => {
  let color = '#22c55e'; // Verde (Bajo)
  let shadowColor = 'rgba(34, 197, 94, 0.4)';

  if (riskLevel === 'MODERADO') {
    color = '#eab308'; // Amarillo
    shadowColor = 'rgba(234, 179, 8, 0.4)';
  } else if (riskLevel === 'ALTO') {
    color = '#f97316'; // Naranja
    shadowColor = 'rgba(249, 115, 22, 0.4)';
  } else if (riskLevel === 'COLAPSO') {
    color = '#ef4444'; // Rojo
    shadowColor = 'rgba(239, 68, 68, 0.5)';
  }

  const svgHtml = `
    <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid #020617;
      box-shadow: 0 0 14px ${shadowColor};
      display: flex;
      align-items: center;
      justify-content: center;
      color: #020617;
      font-weight: 900;
      font-size: 10px;
    ">
      ${riskLevel === 'COLAPSO' ? '!' : 'S'}
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Marcador temporal para selección táctil de mapa
const pickerIcon = L.divIcon({
  html: `
    <div style="
      background-color: #f59e0b;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #020617;
      font-weight: 900;
      font-size: 14px;
      animation: pulse 1.5s infinite;
    ">
      📍
    </div>
  `,
  className: 'custom-picker-marker',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17]
});

// Capturador de clics/toques táctiles en el mapa
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    }
  });
  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

interface GisMapProps {
  currentUser: InspectorUser | null;
  onOpenAuthModal: () => void;
}

export default function GisMap({ currentUser, onOpenAuthModal }: GisMapProps) {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('TODOS');
  const [filterMethodology, setFilterMethodology] = useState<string>('TODAS');
  
  // Estado de selección táctil de coordenadas
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchInspections();
    setInspections(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    if (supabase) {
      const channel = supabase
        .channel('inspections_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, () => {
          loadData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setPickedLocation({ lat, lng });
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    setIsModalOpen(true);
  };

  const handleOpenRegisterModal = () => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    if (!pickedLocation) {
      setPickedLocation({ lat: SAN_CRISTOBAL_CENTER[0], lng: SAN_CRISTOBAL_CENTER[1] });
    }
    setIsModalOpen(true);
  };

  const handleInspectionSaved = (newRec: InspectionRecord) => {
    setInspections(prev => [newRec, ...prev.filter(i => i.id !== newRec.id)]);
    setPickedLocation(null);
  };

  // Filtrado dinámico
  const filteredInspections = inspections.filter(item => {
    const matchesSearch = 
      item.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.inspectorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = filterRisk === 'TODOS' || item.riskLevel === filterRisk;
    const matchesMethod = filterMethodology === 'TODAS' || item.methodology === filterMethodology;

    return matchesSearch && matchesRisk && matchesMethod;
  });

  return (
    <div className="flex flex-col space-y-4 w-full h-full min-h-[75vh] text-left">
      
      {/* BARRA SUPERIOR DE INSTRUCCIÓN TÁCTIL */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            📍 <strong>Ubicación Táchira:</strong> Toca o haz clic en cualquier punto del mapa en San Cristóbal para seleccionar las coordenadas exactas de la edificación a inspeccionar.
          </span>
        </div>
        <span className="font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded text-[10px] uppercase">
          San Cristóbal, Táchira
        </span>
      </div>

      {/* BARRA DE CONTROL Y FILTROS DEL SIG */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider font-display flex items-center gap-2">
              <span>Mapa SIG Heimdall</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                {inspections.length} Registradas
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              San Cristóbal, Táchira — Inspección y Vulnerabilidad Sísmica
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Botón de Registro */}
          <button
            onClick={handleOpenRegisterModal}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase px-4 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>+ Registrar Nueva Inspección</span>
          </button>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar edificio o inspector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 w-52 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Filtro Riesgo */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="TODOS">Todos los Riesgos</option>
            <option value="BAJO">🟢 Riesgo Bajo</option>
            <option value="MODERADO">🟡 Riesgo Moderado</option>
            <option value="ALTO">🟠 Riesgo Alto</option>
            <option value="COLAPSO">🔴 Peligro de Colapso</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Actualizar capa de datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CONTENEDOR DEL MAPA LEAFLET.JS */}
      <div className="relative flex-1 w-full h-[650px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl z-10">
        
        {/* Controles de leyenda superpuestos */}
        <div className="absolute top-4 right-4 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl text-left space-y-1.5 pointer-events-auto">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">Leyenda de Riesgo Sísmico</span>
          <div className="flex items-center space-x-2 text-[10px] text-slate-300">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Riesgo Bajo</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-300">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span>Riesgo Moderado</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-300">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
            <span>Riesgo Alto</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-300">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span>Peligro de Colapso</span>
          </div>
        </div>

        <MapContainer
          center={SAN_CRISTOBAL_CENTER}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <RecenterMap center={SAN_CRISTOBAL_CENTER} />
          <MapClickHandler onMapClick={handleMapClick} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Marcador Táctil Seleccionado */}
          {pickedLocation && (
            <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={pickerIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong>Punto Seleccionado</strong>
                  <p className="font-mono text-[10px]">{pickedLocation.lat}, {pickedLocation.lng}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcadores de Inspecciones Guardadas */}
          {filteredInspections.map((item) => (
            <Marker
              key={item.id}
              position={[item.latitude, item.longitude]}
              icon={createCustomMarker(item.riskLevel)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2 space-y-2 text-slate-900 max-w-xs text-left">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded text-white ${
                      item.riskLevel === 'COLAPSO' ? 'bg-red-600' :
                      item.riskLevel === 'ALTO' ? 'bg-orange-500' :
                      item.riskLevel === 'MODERADO' ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}>
                      {item.riskLevel}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold">{item.methodology}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase leading-tight">{item.buildingName}</h4>
                    <p className="text-[10px] text-slate-600 mt-0.5">{item.address} — {item.city}</p>
                  </div>

                  <div className="bg-slate-100 p-2 rounded-lg text-[10px] space-y-1">
                    <p><strong>Tipología:</strong> {item.typology}</p>
                    <p><strong>Niveles:</strong> {item.numFloors} pisos</p>
                    <p><strong>Inspector:</strong> {item.inspectorName}</p>
                    <p><strong>Puntaje:</strong> <span className="font-mono font-bold text-indigo-700">{item.scoreResult}</span></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Modal de Registro de Inspección */}
      {pickedLocation && (
        <InspeccionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setPickedLocation(null);
          }}
          currentUser={currentUser}
          onSaved={handleInspectionSaved}
          initialLat={pickedLocation.lat}
          initialLng={pickedLocation.lng}
        />
      )}

    </div>
  );
}
