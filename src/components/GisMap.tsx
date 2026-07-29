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
import { 
  Layers, 
  Search, 
  RefreshCw, 
  Building2, 
  Calendar, 
  UserCheck, 
  MapPin,
  Info,
  Shield,
  FileText,
  CheckSquare
} from 'lucide-react';

// Solución para iconos por defecto de Leaflet en Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Coordenadas por defecto San Cristóbal, Táchira, Venezuela
const SAN_CRISTOBAL_CENTER: [number, number] = [7.7669, -72.2250];

// Crear iconos SVG personalizados y ÚNICOS por metodología y riesgo
const createMethodologyMarker = (methodology: MethodologyType, riskLevel: RiskLevel) => {
  let riskColor = '#22c55e'; // Verde (Bajo)
  let shadowColor = 'rgba(34, 197, 94, 0.4)';

  if (riskLevel === 'MODERADO') {
    riskColor = '#eab308'; // Amarillo
    shadowColor = 'rgba(234, 179, 8, 0.4)';
  } else if (riskLevel === 'ALTO') {
    riskColor = '#f97316'; // Naranja
    shadowColor = 'rgba(249, 115, 22, 0.4)';
  } else if (riskLevel === 'COLAPSO') {
    riskColor = '#ef4444'; // Rojo
    shadowColor = 'rgba(239, 68, 68, 0.6)';
  }

  let badgeBg = '#1e3a8a'; // Azul para FUNVISIS
  let badgeText = 'FUN';
  let badgeShape = 'border-radius: 8px;';

  if (methodology === 'FEMA_P154') {
    badgeBg = '#c2410c'; // Naranja para FEMA
    badgeText = 'FEMA';
    badgeShape = 'border-radius: 4px;';
  } else if (methodology === 'GNDT') {
    badgeBg = '#6b21a8'; // Púrpura para GNDT
    badgeText = 'GNDT';
    badgeShape = 'border-radius: 50%;';
  }

  const svgHtml = `
    <div style="
      background-color: ${badgeBg};
      border: 3px solid ${riskColor};
      box-shadow: 0 0 16px ${shadowColor};
      ${badgeShape}
      padding: 3px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: 9px;
      font-family: monospace;
      white-space: nowrap;
      min-width: 38px;
    ">
      <span>${badgeText}</span>
      <span style="font-size: 8px; color: ${riskColor}; font-weight: 800;">${riskLevel.substring(0, 3)}</span>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [42, 32],
    iconAnchor: [21, 16],
    popupAnchor: [0, -16]
  });
};

function FixMapSizeAndCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
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

  // Filtrado dinámico
  const filteredInspections = inspections.filter(item => {
    const matchesSearch = 
      item.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.inspectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = filterRisk === 'TODOS' || item.riskLevel === filterRisk;
    const matchesMethod = filterMethodology === 'TODAS' || item.methodology === filterMethodology;

    return matchesSearch && matchesRisk && matchesMethod;
  });

  return (
    <div className="flex flex-col space-y-4 w-full h-full min-h-[750px] text-left">
      
      {/* BARRA DE LEYENDA E ICONOGRAFÍA DENTRO DEL MAPA */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider font-display flex items-center gap-2">
              <span>Mapa SIG Heimdall (San Cristóbal)</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                {inspections.length} Registradas
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Ubicación geoespacial con marcadores diferenciados por metodología y riesgo
            </p>
          </div>
        </div>

        {/* Filtros y Buscador */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, edificio o inspector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 w-60 focus:outline-none focus:border-amber-500/50"
            />
          </div>

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

          <select
            value={filterMethodology}
            onChange={(e) => setFilterMethodology(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="TODAS">Todas las Metodologías</option>
            <option value="FUNVISIS">🇻🇪 FUNVISIS (Azul)</option>
            <option value="FEMA_P154">🇺🇸 FEMA P-154 (Naranja)</option>
            <option value="GNDT">🇮🇹 GNDT (Púrpura)</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CONTENEDOR DEL MAPA LEAFLET.JS (Optimizado para Escritorio y Móvil) */}
      <div className="relative flex-1 w-full min-h-[650px] h-[750px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl z-10">
        
        {/* Leyenda de Metodologías e Iconos */}
        <div className="absolute top-4 right-4 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl text-left space-y-2 pointer-events-auto">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">Iconos por Metodología</span>
          
          <div className="flex items-center space-x-2 text-[10px] text-slate-300">
            <span className="px-1.5 py-0.5 rounded bg-blue-900 text-white font-mono font-bold text-[9px] border border-blue-400">FUN</span>
            <span>FUNVISIS (Venezuela)</span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-slate-300">
            <span className="px-1.5 py-0.5 rounded bg-orange-900 text-white font-mono font-bold text-[9px] border border-orange-400">FEMA</span>
            <span>FEMA P-154 (EE.UU.)</span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-slate-300">
            <span className="px-1.5 py-0.5 rounded-full bg-purple-900 text-white font-mono font-bold text-[9px] border border-purple-400">GNDT</span>
            <span>Índice GNDT (Italia)</span>
          </div>

          <div className="border-t border-slate-800 pt-1.5 space-y-1">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">Bordes de Riesgo:</span>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bajo
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Mod
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Alto
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Colapso
            </div>
          </div>
        </div>

        <MapContainer
          center={SAN_CRISTOBAL_CENTER}
          zoom={14}
          style={{ width: '100%', height: '100%', minHeight: '650px' }}
          scrollWheelZoom={true}
        >
          <FixMapSizeAndCenter center={SAN_CRISTOBAL_CENTER} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Marcadores de Inspecciones Guardadas */}
          {filteredInspections.map((item) => (
            <Marker
              key={item.id}
              position={[item.latitude, item.longitude]}
              icon={createMethodologyMarker(item.methodology, item.riskLevel)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2 space-y-2 text-slate-900 max-w-xs text-left">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      ID: {item.id}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded text-white ${
                      item.riskLevel === 'COLAPSO' ? 'bg-red-600' :
                      item.riskLevel === 'ALTO' ? 'bg-orange-500' :
                      item.riskLevel === 'MODERADO' ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}>
                      {item.riskLevel}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase leading-tight">{item.buildingName}</h4>
                    <p className="text-[10px] text-slate-600 mt-0.5">{item.address} — {item.city}</p>
                  </div>

                  <div className="bg-slate-100 p-2 rounded-lg text-[10px] space-y-1">
                    <p><strong>Metodología:</strong> {item.methodology}</p>
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

    </div>
  );
}
