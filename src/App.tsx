import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Activity,
  Building2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  Square,
  RotateCcw,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Info,
  Sliders,
  Flame,
  Download,
  BookOpen,
  HelpCircle,
  Compass,
  ClipboardList,
  CheckSquare,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  countryNorms,
  structuralTypologies,
  analyzeMDOFBuilding,
  BuildingSeismicResults,
  TypologyType,
  getSpectralAcceleration
} from "./lib/seismic";
import VulnerabilidadVenezuela from "./components/VulnerabilidadVenezuela";
import FemaP154 from "./components/FemaP154";
import GndtVulnerability from "./components/GndtVulnerability";
import LandingPage from "./components/LandingPage";
import SimuladorSismos from "./components/SimuladorSismos";
import GisMap from "./components/GisMap";
import AdminPanel from "./components/AdminPanel";
import AuthModal from "./components/AuthModal";
import { InspectorUser } from "./lib/supabase";

// Componente de protección contra errores inesperados de renderizado
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center space-y-4 font-sans">
          <div className="p-6 bg-red-950/80 border border-red-500/30 rounded-2xl max-w-xl text-center space-y-3">
            <h2 className="text-xl font-bold text-red-400 uppercase tracking-wider">Detalle de Error de Renderizado</h2>
            <p className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-lg text-left overflow-x-auto">
              {this.state.error?.message || "Se produjo un error al renderizar el componente."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-red-500 hover:bg-red-600 text-slate-950 font-black text-xs uppercase px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Proyectos iniciales precargados
interface SavedProject {
  id: string;
  name: string;
  countryCode: string;
  zoneCode: string;
  soilCode: string;
  numFloors: number;
  interstoryHeight: number;
  typologyId: TypologyType;
  earthquakeMw: number;
  earthquakeDepth: number;
  epicentralDistance: number;
  earthquakeDuration?: number;
  baseMass?: number;
  baseStiffness?: number;
}

const DEFAULT_PROJECTS: SavedProject[] = [
  {
    id: "proj-1",
    name: "Evaluación de Riesgo - Escuela Local",
    countryCode: "PE",
    zoneCode: "Z4",
    soilCode: "S2",
    numFloors: 8,
    interstoryHeight: 3.0,
    typologyId: "frame",
    earthquakeMw: 8.0,
    earthquakeDepth: 35,
    epicentralDistance: 50,
    earthquakeDuration: 30,
    baseMass: 120,
    baseStiffness: 380000
  },
  {
    id: "proj-2",
    name: "Edificio de Oficinas - El Golf (Santiago)",
    countryCode: "CL",
    zoneCode: "Z3",
    soilCode: "B",
    numFloors: 10,
    interstoryHeight: 3.2,
    typologyId: "shearWall",
    earthquakeMw: 8.8,
    earthquakeDepth: 25,
    epicentralDistance: 70,
    earthquakeDuration: 60,
    baseMass: 150,
    baseStiffness: 1330000
  },
  {
    id: "proj-3",
    name: "Viviendas Autoconstruidas - Comuna Siloé",
    countryCode: "CO",
    zoneCode: "Alta",
    soilCode: "D",
    numFloors: 3,
    interstoryHeight: 2.8,
    typologyId: "adobe",
    earthquakeMw: 7.2,
    earthquakeDepth: 15,
    epicentralDistance: 15,
    earthquakeDuration: 25,
    baseMass: 216,
    baseStiffness: 114000
  }
];

export default function App() {
  // --- Estados de Gestión de Proyectos ---
  const [projects, setProjects] = useState<SavedProject[]>(() => {
    const saved = localStorage.getItem("sismorisk_projects");
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj-1");
  const [newProjectName, setNewProjectName] = useState("");

  // --- Parámetros de Simulación Actual ---
  const [projectName, setProjectName] = useState("Evaluación de Riesgo - Escuela Local");
  const [countryCode, setCountryCode] = useState("PE");
  const [zoneCode, setZoneCode] = useState("Z4");
  const [soilCode, setSoilCode] = useState("S2");
  const [numFloors, setNumFloors] = useState(8);
  const [interstoryHeight, setInterstoryHeight] = useState(3.0);
  const [typologyId, setTypologyId] = useState<TypologyType>("frame");
  const [baseMass, setBaseMass] = useState(120); // toneladas
  const [baseStiffness, setBaseStiffness] = useState(380000); // kN/m
  
  // Parámetros de sismo
  const [earthquakeMw, setEarthquakeMw] = useState(8.0);
  const [earthquakeDepth, setEarthquakeDepth] = useState(35);
  const [epicentralDistance, setEpicentralDistance] = useState(50);
  const [earthquakeDuration, setEarthquakeDuration] = useState(30);

  // --- Estados de Acordeón de Configuración ---
  const [activeAccordion, setActiveAccordion] = useState<number>(1);

  // --- Estados de Visualización y Autenticación ---
  const [activeTab, setActiveTab] = useState<"inicio" | "modelo" | "espectro" | "vulnerabilidad" | "fema" | "gndt" | "simulador" | "sig" | "admin">("inicio");
  const [currentUser, setCurrentUser] = useState<InspectorUser | null>(() => {
    const saved = localStorage.getItem("heimdall_active_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginSuccess = (user: InspectorUser) => {
    setCurrentUser(user);
    localStorage.setItem("heimdall_active_user", JSON.stringify(user));
    showToast(`¡Sesión iniciada como ${user.fullName}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("heimdall_active_user");
    showToast("Sesión cerrada.");
  };
  const [activeGuideTab, setActiveGuideTab] = useState<"funcionamiento" | "real">("funcionamiento");
  const [animating, setAnimating] = useState(false);
  const [animTime, setAnimTime] = useState(0);

  // --- Reporte Técnico de IA (Gemini) ---
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  // Ref para abortar el fetch si el usuario cambia de proyecto antes de recibir respuesta
  const reportAbortControllerRef = useRef<AbortController | null>(null);

  // --- Toasts de UI ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPointCoords, setSelectedPointCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleSelectInspectionPoint = (coords: { lat: number; lng: number }, methodology: MethodologyType) => {
    setSelectedPointCoords(coords);
    showToast(`📍 Punto fijado en San Cristóbal (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    if (methodology === 'FUNVISIS') {
      setActiveTab('vulnerabilidad');
    } else if (methodology === 'FEMA_P154') {
      setActiveTab('fema');
    } else {
      setActiveTab('gndt');
    }
  };

  // --- Descargo de Responsabilidad ---
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("seismic_disclaimer_accepted") === "true";
    }
    return false;
  });

  const handleAcceptDisclaimer = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("seismic_disclaimer_accepted", "true");
    }
    setDisclaimerAccepted(true);
  };

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Obtener norma del país actual
  const currentNorm = countryNorms[countryCode] || countryNorms["PE"];

  // Sincronizar parámetros cuando se selecciona un proyecto guardado
  useEffect(() => {
    const proj = projects.find(p => p.id === selectedProjectId);
    if (proj) {
      setProjectName(proj.name);
      setCountryCode(proj.countryCode);
      setZoneCode(proj.zoneCode);
      setSoilCode(proj.soilCode);
      setNumFloors(proj.numFloors);
      setInterstoryHeight(proj.interstoryHeight);
      setTypologyId(proj.typologyId);
      setEarthquakeMw(proj.earthquakeMw);
      setEarthquakeDepth(proj.earthquakeDepth);
      setEpicentralDistance(proj.epicentralDistance);
      setEarthquakeDuration(proj.earthquakeDuration || 30);
      setBaseMass(proj.baseMass !== undefined ? proj.baseMass : 120);
      setBaseStiffness(proj.baseStiffness !== undefined ? proj.baseStiffness : 380000);
      setReportResult(null); // Reset report on project load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  // Guardar proyectos en LocalStorage al modificarlos
  useEffect(() => {
    localStorage.setItem("sismorisk_projects", JSON.stringify(projects));
  }, [projects]);

  // Guardar cambios del proyecto actual en caliente
  const saveCurrentProjectState = () => {
    setProjects(prev => {
      const currentProj = prev.find(p => p.id === selectedProjectId);
      if (
        currentProj &&
        currentProj.name === projectName &&
        currentProj.countryCode === countryCode &&
        currentProj.zoneCode === zoneCode &&
        currentProj.soilCode === soilCode &&
        currentProj.numFloors === numFloors &&
        currentProj.interstoryHeight === interstoryHeight &&
        currentProj.typologyId === typologyId &&
        currentProj.earthquakeMw === earthquakeMw &&
        currentProj.earthquakeDepth === earthquakeDepth &&
        currentProj.epicentralDistance === epicentralDistance &&
        currentProj.earthquakeDuration === earthquakeDuration &&
        currentProj.baseMass === baseMass &&
        currentProj.baseStiffness === baseStiffness
      ) {
        return prev; // Sin cambios, mantener la misma referencia para evitar bucles infinitos
      }
      return prev.map(p =>
        p.id === selectedProjectId
          ? {
              ...p,
              name: projectName,
              countryCode,
              zoneCode,
              soilCode,
              numFloors,
              interstoryHeight,
              typologyId,
              earthquakeMw,
              earthquakeDepth,
              epicentralDistance,
              earthquakeDuration,
              baseMass,
              baseStiffness
            }
          : p
      );
    });
  };

  // Guardar en caliente cada vez que cambien variables básicas
  useEffect(() => {
    saveCurrentProjectState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectName,
    countryCode,
    zoneCode,
    soilCode,
    numFloors,
    interstoryHeight,
    typologyId,
    earthquakeMw,
    earthquakeDepth,
    epicentralDistance,
    earthquakeDuration,
    baseMass,
    baseStiffness
  ]);

  // --- Lógica del Motor de Dinámica Estructural ---
  // useMemo evita recalcular el análisis sísmico en cada re-render no relacionado
  const results: BuildingSeismicResults = useMemo(
    () =>
      analyzeMDOFBuilding(
        numFloors,
        interstoryHeight,
        typologyId,
        countryCode,
        zoneCode,
        soilCode,
        earthquakeMw,
        earthquakeDepth,
        epicentralDistance,
        baseMass,
        baseStiffness
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [numFloors, interstoryHeight, typologyId, countryCode, zoneCode, soilCode, earthquakeMw, earthquakeDepth, epicentralDistance, baseMass, baseStiffness]
  );

  // --- Animación del Sismo ---
  const animateBuilding = (timestamp: number) => {
    if (lastTimeRef.current !== 0) {
      const delta = (timestamp - lastTimeRef.current) / 1000;
      setAnimTime(prev => prev + delta);
    }
    lastTimeRef.current = timestamp;
    requestRef.current = requestAnimationFrame(animateBuilding);
  };

  useEffect(() => {
    if (animating) {
      lastTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(animateBuilding);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animating]);

  // Pausar animación del sismo cuando el tab del navegador está oculto (ahorra CPU)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && animating) {
        setAnimating(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [animating]);

  // Calcular PGA local para visualizaciones
  const pgaLocal = results.modes[0] ? results.floorResponses[0].force / (results.floorResponses[0].mass * 9.81) : 0.25;

  // --- Handlers de UI ---
  const handleCreateProject = () => {
    const name = newProjectName.trim() || `Evaluación - Nueva Estructura ${projects.length + 1}`;
    const newProj: SavedProject = {
      id: `proj-${Date.now()}`,
      name,
      countryCode: "PE",
      zoneCode: "Z4",
      soilCode: "S2",
      numFloors: 5,
      interstoryHeight: 3.0,
      typologyId: "frame",
      earthquakeMw: 7.5,
      earthquakeDepth: 40,
      epicentralDistance: 45,
      earthquakeDuration: 30
    };
    const updated = [...projects, newProj];
    setProjects(updated);
    setSelectedProjectId(newProj.id);
    setNewProjectName("");
    showToast("¡Proyecto creado con éxito!");
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      showToast("Debe mantener al menos un proyecto activo.");
      return;
    }
    const index = projects.findIndex(p => p.id === id);
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    if (selectedProjectId === id) {
      const nextActive = updated[index === 0 ? 0 : index - 1];
      setSelectedProjectId(nextActive.id);
    }
    showToast("Proyecto eliminado.");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleExportPDF = () => {
    // Generar formato imprimible de informe rápido
    window.print();
    showToast("Preparando vista de impresión técnica...");
  };

  const handleGenerateAIReport = async () => {
    // Cancelar cualquier solicitud previa pendiente
    if (reportAbortControllerRef.current) {
      reportAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    reportAbortControllerRef.current = controller;

    setLoadingReport(true);
    setReportResult(null);
    setReportError(null);

    const typologyInfo = structuralTypologies.find(t => t.id === typologyId);

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          projectName,
          country: currentNorm.name,
          normName: currentNorm.normName,
          zoneName: currentNorm.zones.find(z => z.code === zoneCode)?.name || zoneCode,
          soilName: currentNorm.soils.find(s => s.code === soilCode)?.name || soilCode,
          numFloors,
          interstoryHeight,
          typologyName: typologyInfo?.name || typologyId,
          earthquakeMw,
          earthquakeDepth,
          earthquakeDuration,
          pga: results.realPGA, // PGA real calculado por la GMPE para el sismo configurado
          fundamentalPeriod: results.fundamentalPeriod,
          maxDrift: results.maxDrift,
          maxDriftFloor: results.maxDriftFloor,
          baseShear: results.baseShear,
          overallRisk: results.overallRisk,
          habitability: results.habitability,
          driftLimit: currentNorm.driftLimit[typologyId]
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al invocar el servidor de IA.");
      }

      const data = await response.json();
      setReportResult(data.report);
      showToast("¡Reporte técnico de IA generado exitosamente!");
    } catch (err: any) {
      if (err.name === "AbortError") return; // Solicitud cancelada intencionalmente
      console.error(err);
      setReportError(err.message || "No se pudo conectar con el servidor de inteligencia artificial.");
    } finally {
      setLoadingReport(false);
      reportAbortControllerRef.current = null;
    }
  };

  // --- Parámetros de animación física de balanceo ---
  let swayFactor = 0;
  let groundShake = 0;
  if (animating) {
    // Generar vibración sísmica realista con amortiguamiento amortiguado e impulsos
    const omega = 15; // frecuencia del suelo
    groundShake = Math.sin(animTime * omega) * 14 * Math.cos(animTime * 3.5);
    // Sway superior basado en el modo fundamental
    swayFactor = Math.sin(animTime * (2 * Math.PI / results.fundamentalPeriod)) * 1.6;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onLoginSuccess={handleLoginSuccess}
          isMandatoryGate={true}
        />
      </div>
    );
  }

  if (activeTab === "inicio") {
    return (
      <ErrorBoundary>
        <LandingPage onNavigate={(tab) => setActiveTab(tab)} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans print:bg-white print:text-black">
      
      {/* HEADER DE LA APLICACIÓN */}
      <header className="bg-slate-900 border-b border-slate-800 py-3.5 px-6 flex flex-wrap items-center justify-between shadow-lg sticky top-0 z-50 print:relative print:border-b-2 print:border-black print:bg-white">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab("inicio")} title="Volver al Portal Heimdall">
          <div className="bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition duration-200 print:border print:border-black">
            <ShieldCheck className="h-6 w-6" id="app-logo-icon" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition duration-200 print:text-black flex flex-wrap items-center gap-2 font-display uppercase leading-none">
              HEIMDALL <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 print:hidden uppercase tracking-wider">Vulnerabilidad Sísmica v1.0</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium print:hidden mt-0.5">
              Sistema de Evaluación de Vulnerabilidad Sísmica de Edificaciones
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-3 sm:mt-0 print:hidden">

          {currentUser ? (
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                {currentUser.role === 'admin' ? '👑 Admin Único' : currentUser.role === 'supervisor' ? '👁️ Supervisor' : '👷 Inspector'}
                <span className="text-amber-400 font-normal">({currentUser.fullName})</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase pl-2 border-l border-slate-700 cursor-pointer"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase px-3.5 py-2 rounded-lg transition cursor-pointer shadow-md shadow-amber-500/10"
            >
              Iniciar Sesión
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-3.5 rounded-lg flex items-center space-x-2 transition shadow-md shadow-indigo-500/20"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Ficha</span>
          </button>
        </div>
      </header>

      {/* Barra de Navegación Principal de la Aplicación */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between shadow-md print:hidden">
        <div className="flex items-center space-x-2">
          <Layers className="text-amber-400 h-4 w-4" />
          <span className="text-xs font-black uppercase text-slate-300 tracking-wider font-display">
            Módulos Habilitados ({currentUser?.role === 'admin' ? 'Administrador' : currentUser?.role === 'supervisor' ? 'Supervisor' : 'Inspector'}):
          </span>
        </div>
        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 gap-1 flex-wrap">
          
          {(currentUser?.role === 'admin' || currentUser?.role === 'supervisor') && (
            <button
              onClick={() => setActiveTab("inicio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "inicio"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Inicio</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("sig")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "sig"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Visor SIG (San Cristóbal)</span>
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'inspector') && (
            <>
              <button
                onClick={() => setActiveTab("vulnerabilidad")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "vulnerabilidad"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span>FUNVISIS (Venezuela)</span>
              </button>

              <button
                onClick={() => setActiveTab("fema")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "fema"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>FEMA P-154</span>
              </button>

              <button
                onClick={() => setActiveTab("gndt")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "gndt"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Índice GNDT</span>
              </button>
            </>
          )}

          {(currentUser?.role === 'admin' || currentUser?.role === 'supervisor') && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{currentUser?.role === 'admin' ? 'Panel Admin Único' : 'Dashboard Supervisor'}</span>
            </button>
          )}
        </div>
      </div>

      {/* CUERPO PRINCIPAL DEL PANEL */}
      <ErrorBoundary>
        {activeTab === "sig" ? (
          <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 print:block">
            <GisMap
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSelectInspectionPoint={handleSelectInspectionPoint}
            />
          </main>
        ) : activeTab === "admin" ? (
          <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 print:block">
            <AdminPanel currentUser={currentUser} />
          </main>
        ) : activeTab === "simulador" ? (
          <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 print:block">
            <SimuladorSismos />
          </main>
        ) : activeTab === "vulnerabilidad" ? (
          <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 print:block">
            <VulnerabilidadVenezuela selectedCoords={selectedPointCoords} onViewOnMap={() => setActiveTab("sig")} />
          </main>
        ) : activeTab === "fema" ? (
          <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 print:block">
            <FemaP154 selectedCoords={selectedPointCoords} onViewOnMap={() => setActiveTab("sig")} />
          </main>
        ) : activeTab === "gndt" ? (
          <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 print:block">
            <GndtVulnerability selectedCoords={selectedPointCoords} onViewOnMap={() => setActiveTab("sig")} />
          </main>
        ) : (
          <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 print:block">
            <LandingPage onNavigate={(tab) => setActiveTab(tab)} />
          </main>
        )}
      </ErrorBoundary>
      <AnimatePresence>
        {reportResult && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="max-w-[1700px] w-full mx-auto px-4 lg:px-6 pb-8 print:block"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative print:border-none print:bg-white print:text-black">
              
              {/* Encabezado del reporte */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 print:border-b-2 print:border-black">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl print:hidden">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-display print:text-black">INFORME TÉCNICO DE SEGURIDAD SÍSMICA CON IA</h3>
                    <p className="text-xs text-slate-500 font-medium print:text-black">Generado por Gemini 3.5 Flash · Plataforma SismoRisk LATAM v1.0</p>
                  </div>
                </div>

                <div className="flex space-x-2 print:hidden">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportResult);
                      showToast("¡Texto de informe copiado!");
                    }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg transition cursor-pointer"
                  >
                    Copiar Reporte
                  </button>
                  <button
                    onClick={() => setReportResult(null)}
                    className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold py-2 px-3 rounded-lg transition cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              {/* Contenido del Reporte formateado */}
              <div className="prose prose-emerald max-w-none text-slate-700 font-serif leading-relaxed text-sm p-2 space-y-4 print:text-black print:font-sans">
                {reportResult.split("\n\n").map((para, pIdx) => {
                  if (para.startsWith("##")) {
                    return (
                      <h4 key={pIdx} className="text-md font-extrabold text-slate-900 pt-2 border-b border-slate-200 pb-1 print:text-black font-display">
                        {para.replace("##", "").trim()}
                      </h4>
                    );
                  } else if (para.startsWith("**") && para.endsWith("**")) {
                    return (
                      <p key={pIdx} className="font-bold text-blue-600 print:text-black">
                        {para.replace(/\*\*/g, "").trim()}
                      </p>
                    );
                  } else if (para.startsWith("-") || para.startsWith("*")) {
                    return (
                      <ul key={pIdx} className="list-disc pl-5 space-y-1 text-slate-700 print:text-black">
                        {para.split("\n").map((li, lIdx) => (
                          <li key={lIdx}>{li.replace(/^[-\*\s]+/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={pIdx}>{para}</p>;
                })}
              </div>

              {/* Firma consultor */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-mono font-medium print:border-t-2 print:border-black print:text-black">
                <span>ID Simulación: {selectedProjectId}</span>
                <span className="text-right">Plataforma de Modelado de Riesgo Sísmico LATAM v1.0</span>
              </div>

            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATIONS */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold uppercase tracking-wider print:hidden"
          >
            <Activity className="h-4 w-4 animate-spin text-blue-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LÍMITE DE ERRORES DE REPORTES */}
      <AnimatePresence>
        {reportError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-6 z-50 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-2xl flex items-start space-x-3 text-xs w-96 print:hidden"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <span className="font-extrabold text-red-600 block uppercase">Error de Solicitud de IA</span>
              <p className="text-red-700 leading-relaxed font-medium">{reportError}</p>
              <button
                onClick={() => setReportError(null)}
                className="text-red-800 hover:underline font-bold mt-1.5 block cursor-pointer"
              >
                Cerrar advertencia
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER GENERAL */}
      <footer className="bg-slate-950/80 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono mt-auto print:hidden">
        <p>SismoRisk LATAM v1.0 | Desarrollado para Consultorías Ágiles, Educación Superior de Ingeniería Civil y RRD por Plataforma de Modelado de Riesgo Sísmico LATAM v1.0 Desarrollada por Geologol para la Mejora Continua en la Ingeniería Civil y RRD</p>
        <p className="text-[10px] text-slate-600 mt-1">Sismos calculados de forma analítica mediante espectros elásticos de Chile (NCh433), Colombia (NSR-10) y Perú (E.030 2018).</p>
      </footer>

      {/* DESCARGO DE RESPONSABILIDAD OVERLAY MODAL */}
      <AnimatePresence>
        {!disclaimerAccepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            id="modal-descargo-responsabilidad"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ delay: 0.1, duration: 0.25 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-5 my-8"
              id="tarjeta-descargo-contenido"
            >
              {/* Encabezado con Icono */}
              <div className="flex items-start space-x-4">
                <div className="bg-amber-100 text-amber-700 p-3 rounded-2xl border border-amber-200">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase font-display" id="titulo-modal-descargo">
                    Descargo de Responsabilidad y Términos de Uso
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Heimdall — Sistema de Evaluación de Vulnerabilidad Sísmica
                  </p>
                </div>
              </div>

              {/* Cuerpo del Mensaje */}
              <div className="text-xs text-slate-600 leading-relaxed space-y-4 border-t border-b border-slate-100 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <p>
                  Heimdall es una herramienta técnica orientada a la evaluación preliminar de la vulnerabilidad sísmica de edificaciones mediante metodologías homologadas (FUNVISIS, FEMA P-154 y GNDT). Para poder acceder a sus herramientas, por favor lea y acepte las condiciones de uso:
                </p>

                <div className="space-y-3.5">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-950 font-bold font-display block">Propósito de Evaluación:</strong>
                      La plataforma tiene fines de <strong>cribado rápido, evaluación técnica de vulnerabilidad y análisis de escenarios de riesgo</strong> en reducción del riesgo de desastres (RRD).
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-950 font-bold font-display block">Público Objetivo:</strong>
                      Está orientada a <strong>ingenieros civiles, arquitectos, evaluadores de campo, brigadistas y organismos de protección civil</strong> para categorizar el nivel de vulnerabilidad de edificaciones.
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="text-red-600 font-bold font-display block text-xs uppercase">No Reemplazo de Auditoría Estructural Detallada:</strong>
                      Las fichas de evaluación rápida permiten priorizar estructuras para estudios posteriores. No reemplazan un cálculo estructural detallado ni ensayos destructivos/no destructivos in situ.
                    </div>
                  </div>
                </div>

                <p className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-slate-500 font-medium text-[11px] leading-relaxed">
                  Al hacer clic en el botón de abajo, el usuario acepta el inicio de su uso bajo los términos indicados.
                </p>
              </div>

              {/* Botón de Aceptación */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  Heimdall Project | Vulnerabilidad Sísmica v1.0
                </span>
                <button
                  onClick={handleAcceptDisclaimer}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/15 cursor-pointer transition duration-250 active:scale-95"
                  id="btn-aceptar-descargo"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Aceptar y Entrar a la Aplicación</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL / MURO DE AUTENTICACIÓN OBLIGATORIA AL INGRESAR */}
      <AuthModal
        isOpen={!currentUser || isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        isMandatoryGate={!currentUser}
      />

    </div>
  );
}

