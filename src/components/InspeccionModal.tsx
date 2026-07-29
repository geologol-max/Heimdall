import React, { useState, useEffect } from 'react';
import { 
  InspectionRecord, 
  InspectorUser, 
  saveInspection, 
  RiskLevel, 
  MethodologyType 
} from '../lib/supabase';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Crosshair, 
  X, 
  Check, 
  FileText,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface InspeccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: InspectorUser | null;
  onSaved: (newRecord: InspectionRecord) => void;
  initialLat?: number;
  initialLng?: number;
  initialMethodology?: MethodologyType;
  initialRisk?: RiskLevel;
  initialScore?: number;
  initialTypology?: string;
  initialFloors?: number;
}

export default function InspeccionModal({
  isOpen,
  onClose,
  currentUser,
  onSaved,
  initialLat = 7.7669,
  initialLng = -72.2250,
  initialMethodology = 'FUNVISIS',
  initialRisk = 'MODERADO',
  initialScore = 50,
  initialTypology = 'Pórticos de Concreto Armado',
  initialFloors = 4
}: InspeccionModalProps) {
  const [buildingName, setBuildingName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('San Cristóbal');
  const [stateCountry, setStateCountry] = useState('Táchira, Venezuela');
  const [latitude, setLatitude] = useState<number>(initialLat);
  const [longitude, setLongitude] = useState<number>(initialLng);
  const [methodology, setMethodology] = useState<MethodologyType>(initialMethodology);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(initialRisk);
  const [scoreResult, setScoreResult] = useState<number>(initialScore);
  const [typology, setTypology] = useState<string>(initialTypology);
  const [numFloors, setNumFloors] = useState<number>(initialFloors);

  const [gettingGps, setGettingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLatitude(initialLat);
    setLongitude(initialLng);
    setMethodology(initialMethodology);
    setRiskLevel(initialRisk);
    setScoreResult(initialScore);
    setTypology(initialTypology);
    setNumFloors(initialFloors);
  }, [initialLat, initialLng, initialMethodology, initialRisk, initialScore, initialTypology, initialFloors]);

  if (!isOpen) return null;

  const handleGetGps = () => {
    setGettingGps(true);
    setGpsError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(Number(position.coords.latitude.toFixed(6)));
          setLongitude(Number(position.coords.longitude.toFixed(6)));
          setGettingGps(false);
        },
        (err) => {
          console.warn("GPS Error:", err);
          setGpsError("No se pudo obtener el GPS automáticamente. Puedes ingresar las coordenadas manualmente.");
          setGettingGps(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsError("Tu navegador no soporta geolocalización GPS.");
      setGettingGps(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingName.trim()) {
      setErrorMsg("Debes ingresar el nombre de la edificación.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const recordData = {
      inspectorId: currentUser?.id || 'anon-inspector',
      inspectorName: currentUser?.fullName || 'Inspector de Campo',
      buildingName: buildingName.trim(),
      address: address.trim() || 'Sin dirección especificada',
      city: city.trim() || 'San Cristóbal',
      stateCountry: stateCountry.trim() || 'Táchira, Venezuela',
      latitude: Number(latitude),
      longitude: Number(longitude),
      methodology,
      riskLevel,
      scoreResult: Number(scoreResult),
      typology,
      numFloors: Number(numFloors),
      detailsJson: {
        registradoPor: currentUser?.email || 'anónimo',
        fechaRegistro: new Date().toISOString()
      }
    };

    try {
      const savedRecord = await saveInspection(recordData);
      onSaved(savedRecord);
      onClose();
    } catch (err) {
      setErrorMsg("Error al guardar la inspección en la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 relative text-left my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                Registrar Nueva Inspección Sísmica
              </h3>
              <p className="text-xs text-slate-400">
                Guardar edificación seleccionada en el mapa en la BD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Inspector */}
        <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span>Inspector Responsable:</span>
            <strong className="text-white">{currentUser?.fullName || 'Inspector de Campo'}</strong>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {currentUser?.organization || 'Protección Civil Táchira'}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nombre Edificación */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Nombre de la Edificación *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Hospital Central / Escuela Bolivariana / Res. Las Lomas"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Dirección y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Dirección / Sector
              </label>
              <input
                type="text"
                placeholder="Ej. Av. 19 de Abril con calle 14"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Ciudad / Municipio
              </label>
              <input
                type="text"
                placeholder="Ej. San Cristóbal"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Coordenadas GPS */}
          <div className="bg-slate-950 border border-amber-500/30 p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-400" />
                Coordenadas Seleccionadas en Mapa
              </span>
              <button
                type="button"
                onClick={handleGetGps}
                disabled={gettingGps}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase px-3 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1"
              >
                <Crosshair className={`h-3.5 w-3.5 ${gettingGps ? 'animate-spin' : ''}`} />
                <span>{gettingGps ? 'Obteniendo GPS...' : '🎯 GPS del Dispositivo'}</span>
              </button>
            </div>

            {gpsError && <p className="text-[10px] text-red-400">{gpsError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Latitud</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Longitud</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Metodología y Nivel de Riesgo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Metodología Aplicada
              </label>
              <select
                value={methodology}
                onChange={(e) => setMethodology(e.target.value as MethodologyType)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
              >
                <option value="FUNVISIS">🇻🇪 FUNVISIS (Venezuela)</option>
                <option value="FEMA_P154">🇺🇸 FEMA P-154 (RVS EE.UU.)</option>
                <option value="GNDT">🇮🇹 Índice GNDT (Italia)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Dictamen Nivel de Riesgo *
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
              >
                <option value="BAJO" className="text-emerald-400">🟢 Riesgo Bajo</option>
                <option value="MODERADO" className="text-amber-400">🟡 Riesgo Moderado</option>
                <option value="ALTO" className="text-orange-400">🟠 Riesgo Alto</option>
                <option value="COLAPSO" className="text-red-500">🔴 Peligro de Colapso</option>
              </select>
            </div>
          </div>

          {/* Puntaje, Tipología y Pisos */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Puntaje</label>
              <input
                type="number"
                step="any"
                required
                value={scoreResult}
                onChange={(e) => setScoreResult(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Tipología</label>
              <input
                type="text"
                value={typology}
                onChange={(e) => setTypology(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Pisos</label>
              <input
                type="number"
                min="1"
                value={numFloors}
                onChange={(e) => setNumFloors(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 mt-4"
          >
            <Check className="h-4 w-4" />
            <span>{saving ? 'Guardando en Supabase...' : 'Guardar Inspección en BD & Mostrar en SIG'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
