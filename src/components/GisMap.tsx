import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InspectionRecord, fetchInspections, RiskLevel, MethodologyType } from '../lib/supabase';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Globe, 
  FileText, 
  Shield, 
  MapPin, 
  Search, 
  Filter, 
  RefreshCw, 
  User, 
  Building2, 
  Calendar,
  Layers
} from 'lucide-react';

// Solución para iconos por defecto de Leaflet en Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

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

// Componente para re-centrar el mapa al seleccionar filtro
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface GisMapProps {
  onSelectInspection?: (record: InspectionRecord) => void;
}

export default function GisMap({ onSelectInspection }: GisMapProps) {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('TODOS');
  const [filterMethodology, setFilterMethodology] = useState<string>('TODAS');
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchInspections();
    setInspections(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado dinámico de inspecciones
  const filteredInspections = inspections.filter(item => {
    const matchesSearch = 
      item.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.inspectorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = filterRisk === 'TODOS' || item.riskLevel === filterRisk;
    const matchesMethod = filterMethodology === 'TODAS' || item.methodology === filterMethodology;

    return matchesSearch && matchesRisk && matchesMethod;
  });

  // Centro por defecto (San Cristóbal, Táchira o centro promedio)
  const defaultLat = filteredInspections[0]?.latitude || 7.7669;
  const defaultLng = filteredInspections[0]?.longitude || -72.2250;

  return (
    <div className="flex flex-col space-y-4 w-full h-full min-h-[75vh]">
      
      {/* BARRA DE CONTROL Y FILTROS DEL SIG */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider font-display">
              Sistema de Información Geográfica (SIG Heimdall)
            </h2>
            <p className="text-[11px] text-slate-400">
              Visualización geoespacial de edificaciones inspeccionadas en tiempo real
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por edificio, ciudad o inspector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 w-64 focus:outline-none focus:border-amber-500/50"
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

          {/* Filtro Metodología */}
          <select
            value={filterMethodology}
            onChange={(e) => setFilterMethodology(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="TODAS">Todas las Metodologías</option>
            <option value="FUNVISIS">FUNVISIS (Venezuela)</option>
            <option value="FEMA_P154">FEMA P-154 (EE.UU.)</option>
            <option value="GNDT">GNDT (Italia)</option>
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
          center={[defaultLat, defaultLng]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <RecenterMap lat={defaultLat} lng={defaultLng} />
          
          {/* Tiles oscuros de CartoDB para estética premium */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {filteredInspections.map((item) => (
            <Marker
              key={item.id}
              position={[item.latitude, item.longitude]}
              icon={createCustomMarker(item.riskLevel)}
              eventHandlers={{
                click: () => setSelectedRecord(item)
              }}
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
                    <span className="text-[9px] font-mono text-slate-500">{item.methodology}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase leading-tight">{item.buildingName}</h4>
                    <p className="text-[10px] text-slate-600 mt-0.5">{item.address}</p>
                  </div>

                  <div className="bg-slate-100 p-2 rounded-lg text-[10px] space-y-1">
                    <p><strong>Tipología:</strong> {item.typology}</p>
                    <p><strong>Pisos:</strong> {item.numFloors} niveles</p>
                    <p><strong>Inspector:</strong> {item.inspectorName}</p>
                    <p><strong>Puntaje:</strong> <span className="font-mono font-bold text-indigo-700">{item.scoreResult}</span></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

    </div>
  );
}
