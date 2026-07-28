import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardCheck,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Download,
  Layers,
  MapPin,
  Building,
  TrendingDown,
  TrendingUp,
  FileCheck2,
  FileText
} from "lucide-react";

// --- Tipos de Datos para FEMA P-154 ---

interface FemaFormState {
  // 1. Información General
  fecha: string;
  codigoEdif: string;
  evaluador: string;
  nombreEdif: string;
  direccion: string;
  numPisos: number;
  personasExpuestas: number;

  // 2. Parámetros de Selección Sísmica
  nivelPeligroSismico: "bajo" | "moderado" | "alto" | "muy_alto"; // Nivel de amenaza sísmica de FEMA

  // 3. Tipología Estructural Seleccionada (Puntaje Base)
  tipologiaId: string;

  // 4. Modificadores de Puntaje (Booleanos)
  irregularidadVertical: boolean;
  irregularidadPlanta: boolean;
  poundingEfecto: boolean; // Efecto de golpeteo
  preCodigo: boolean;      // Construido antes de normas sísmicas eficaces
  postBenchmark: boolean;  // Diseñado con normativas de vanguardia
  sueloMalo: boolean;      // Suelos blandos / propensos a licuación (Tipo D, E, F)
}

const VALORES_INICIALES: FemaFormState = {
  fecha: "2026-07-07",
  codigoEdif: "FEMA-H-0043",
  evaluador: "Ing. Geólogo / Consultor RRD",
  nombreEdif: "Complejo de Viviendas y Oficinas Almagro",
  direccion: "Av. Libertador con Calle El Colegio",
  numPisos: 8,
  personasExpuestas: 350,
  nivelPeligroSismico: "alto",
  tipologiaId: "C1", // Pórticos de Concreto Armado
  irregularidadVertical: true,  // ej. Piso blando/estacionamientos abajo
  irregularidadPlanta: true,    // Forma en L
  poundingEfecto: false,
  preCodigo: true,              // Pre-1980
  postBenchmark: false,
  sueloMalo: true               // Suelo blando
};

// --- Tipologías Estructurales de FEMA P-154 y sus Scores Base por Nivel de Peligro ---
interface TipologiaFema {
  id: string;
  nombre: string;
  descripcion: string;
  scores: {
    bajo: number;
    moderado: number;
    alto: number;
    muy_alto: number;
  };
}

const TIPOLOGIAS_FEMA: TipologiaFema[] = [
  { id: "W1", nombre: "W1", descripcion: "Estructuras de madera liviana (pequeñas)", scores: { bajo: 5.2, moderado: 4.5, alto: 3.8, muy_alto: 3.2 } },
  { id: "W2", nombre: "W2", descripcion: "Marcos comerciales de madera / Estructuras grandes", scores: { bajo: 4.8, moderado: 4.2, alto: 3.5, muy_alto: 2.8 } },
  { id: "S1", nombre: "S1", descripcion: "Pórticos rígidos de acero resistentes a momento", scores: { bajo: 4.5, moderado: 3.8, alto: 3.2, muy_alto: 2.5 } },
  { id: "S2", nombre: "S2", descripcion: "Pórticos de acero arriostrados (arriostramiento concéntrico/excéntrico)", scores: { bajo: 4.6, moderado: 3.9, alto: 3.3, muy_alto: 2.6 } },
  { id: "S3", nombre: "S3", descripcion: "Edificios de acero con muros de concreto reforzado", scores: { bajo: 4.6, moderado: 4.0, alto: 3.4, muy_alto: 2.7 } },
  { id: "S4", nombre: "S4", descripcion: "Pórticos de acero con muros de mampostería no reforzada", scores: { bajo: 3.8, moderado: 3.2, alto: 2.5, muy_alto: 1.8 } },
  { id: "S5", nombre: "S5", descripcion: "Marcos de acero liviano con paneles de pared metálica", scores: { bajo: 4.4, moderado: 3.8, alto: 3.1, muy_alto: 2.4 } },
  { id: "C1", nombre: "C1", descripcion: "Pórticos de concreto armado resistentes a momento", scores: { bajo: 3.8, moderado: 3.1, alto: 2.5, muy_alto: 1.9 } },
  { id: "C2", nombre: "C2", descripcion: "Muros de corte de concreto armado", scores: { bajo: 4.2, moderado: 3.5, alto: 2.8, muy_alto: 2.2 } },
  { id: "C3", nombre: "C3", descripcion: "Pórticos de concreto con muros de mampostería de relleno", scores: { bajo: 3.4, moderado: 2.7, alto: 2.0, muy_alto: 1.5 } },
  { id: "PC1", nombre: "PC1", descripcion: "Estructuras prefabricadas de concreto con muros inclinados (Tilt-up)", scores: { bajo: 3.6, moderado: 2.9, alto: 2.2, muy_alto: 1.6 } },
  { id: "PC2", nombre: "PC2", descripcion: "Marcos de concreto prefabricados (marcos y losas acopladas)", scores: { bajo: 3.2, moderado: 2.6, alto: 2.0, muy_alto: 1.4 } },
  { id: "RM1", nombre: "RM1", descripcion: "Muros de mampostería armada/reforzada con diafragmas flexibles", scores: { bajo: 3.8, moderado: 3.1, alto: 2.4, muy_alto: 1.8 } },
  { id: "RM2", nombre: "RM2", descripcion: "Muros de mampostería armada/reforzada con diafragmas rígidos", scores: { bajo: 4.0, moderado: 3.3, alto: 2.6, muy_alto: 2.0 } },
  { id: "URM", nombre: "URM", descripcion: "Albañilería / Mampostería no reforzada (Adobe, ladrillo simple)", scores: { bajo: 2.8, moderado: 2.0, alto: 1.4, muy_alto: 0.9 } }
];

// --- Modificadores FEMA P-154 típicos por nivel de Peligro ---
interface ModificadoresValores {
  irregVertical: number;
  irregPlanta: number;
  pounding: number;
  preCode: number;
  postBench: number;
  sueloMalo: number;
}

const MODIFICADORES_FEMA: { [key: string]: ModificadoresValores } = {
  bajo: {
    irregVertical: -0.6,
    irregPlanta: -0.4,
    pounding: -0.2,
    preCode: -0.3,
    postBench: 0.6,
    sueloMalo: -0.4
  },
  moderado: {
    irregVertical: -1.0,
    irregPlanta: -0.6,
    pounding: -0.4,
    preCode: -0.6,
    postBench: 1.0,
    sueloMalo: -0.7
  },
  alto: {
    irregVertical: -1.4,
    irregPlanta: -0.8,
    pounding: -0.5,
    preCode: -1.0,
    postBench: 1.4,
    sueloMalo: -1.0
  },
  muy_alto: {
    irregVertical: -1.8,
    irregPlanta: -1.0,
    pounding: -0.6,
    preCode: -1.4,
    postBench: 1.8,
    sueloMalo: -1.3
  }
};

export default function FemaP154() {
  const [form, setForm] = useState<FemaFormState>(VALORES_INICIALES);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"formulario" | "guia">("formulario");

  const handleInputChange = (field: keyof FemaFormState, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: keyof FemaFormState) => {
    setForm(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const loadPreset = (presetName: "seguro" | "peligroso" | "moderado") => {
    setAiReport(null);
    setReportError(null);
    if (presetName === "seguro") {
      setForm({
        ...VALORES_INICIALES,
        codigoEdif: "FEMA-W-4001",
        nombreEdif: "Módulo Universitario Sismorresistente",
        direccion: "Campus Universitario Central",
        numPisos: 2,
        personasExpuestas: 150,
        nivelPeligroSismico: "alto",
        tipologiaId: "S1", // Pórticos de acero
        irregularidadVertical: false,
        irregularidadPlanta: false,
        poundingEfecto: false,
        preCodigo: false,
        postBenchmark: true, // Sismo moderno
        sueloMalo: false     // Suelo firme / Roca (A o B)
      });
    } else if (presetName === "peligroso") {
      setForm({
        ...VALORES_INICIALES,
        codigoEdif: "FEMA-U-9002",
        nombreEdif: "Edificio Multifamiliar Antiguo de Albañilería",
        direccion: "Zona Central de Lima, Perú",
        numPisos: 4,
        personasExpuestas: 90,
        nivelPeligroSismico: "muy_alto",
        tipologiaId: "URM", // Mampostería no reforzada
        irregularidadVertical: true,  // Planta baja libre
        irregularidadPlanta: true,    // Fachada irregular
        poundingEfecto: true,        // Sin junta de separación
        preCodigo: true,
        postBenchmark: false,
        sueloMalo: true              // Sedimento blando
      });
    } else {
      setForm(VALORES_INICIALES);
    }
  };

  // --- CÁLCULO DEL SCORE ESTRUCTURAL FINAL S ---
  const selectedTipologia = TIPOLOGIAS_FEMA.find(t => t.id === form.tipologiaId) || TIPOLOGIAS_FEMA[7];
  const baseScore = selectedTipologia.scores[form.nivelPeligroSismico];

  const mods = MODIFICADORES_FEMA[form.nivelPeligroSismico];

  let scoreFinal = baseScore;
  const modDetails: { label: string; val: number }[] = [];

  if (form.irregularidadVertical) {
    scoreFinal += mods.irregVertical;
    modDetails.push({ label: "Irregularidad Vertical (Piso blando, retrocesos, etc.)", val: mods.irregVertical });
  }
  if (form.irregularidadPlanta) {
    scoreFinal += mods.irregPlanta;
    modDetails.push({ label: "Irregularidad en Planta (Forma en L, T, U o torsión)", val: mods.irregPlanta });
  }
  if (form.poundingEfecto) {
    scoreFinal += mods.pounding;
    modDetails.push({ label: "Efecto de Golpeteo (Pounding / Adosamiento riesgoso)", val: mods.pounding });
  }
  if (form.preCodigo) {
    scoreFinal += mods.preCode;
    modDetails.push({ label: "Construcción Pre-Código de diseño moderno", val: mods.preCode });
  }
  if (form.postBenchmark) {
    scoreFinal += mods.postBench;
    modDetails.push({ label: "Código Moderno / Post-Benchmark (Suma)", val: mods.postBench });
  }
  if (form.sueloMalo) {
    scoreFinal += mods.sueloMalo;
    modDetails.push({ label: "Perfil de Suelo Blando (Clase D, E, F)", val: mods.sueloMalo });
  }

  // Acotar el score a 0.1 de forma que no existan scores negativos inverosímiles
  scoreFinal = Math.max(0.1, Number(scoreFinal.toFixed(2)));

  const pasaEvaluacion = scoreFinal >= 2.0;

  // --- LLAMADA A BACKEND PARA GEMINI ---
  const handleGenerateAIReport = async () => {
    setLoadingReport(true);
    setAiReport(null);
    setReportError(null);

    const activeMods: string[] = [];
    modDetails.forEach(m => activeMods.push(`${m.label}: ${m.val.toFixed(1)}`));

    const payload = {
      buildingName: form.nombreEdif,
      location: form.direccion,
      fecha: form.fecha,
      floors: form.numPisos,
      peopleExposed: form.personasExpuestas,
      hazardLevel: form.nivelPeligroSismico.toUpperCase().replace("_", " "),
      structuralType: {
        id: selectedTipologia.id,
        name: selectedTipologia.nombre,
        description: selectedTipologia.descripcion
      },
      baseScore,
      modifiers: activeMods,
      finalScore: scoreFinal,
      pasaEvaluacion,
      indices: {
        S: scoreFinal,
        baseScore,
        pasaEvaluacion
      }
    };

    try {
      const res = await fetch("/api/generate-fema154", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Error en servidor: Status ${res.status}`);
      }

      const data = await res.json();
      setAiReport(data.report);
    } catch (err: any) {
      console.error(err);
      setReportError(err.message || "No se pudo comunicar con el asistente de IA. Intente de nuevo.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (aiReport) {
      navigator.clipboard.writeText(aiReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Formateador simple de Markdown
  const formatMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("###")) {
        return <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-2 border-b border-slate-100 pb-1 uppercase font-display">{line.replace("###", "").trim()}</h4>;
      }
      if (line.startsWith("##")) {
        return <h3 key={idx} className="text-base font-black text-blue-800 mt-5 mb-2 font-display uppercase">{line.replace("##", "").trim()}</h3>;
      }
      if (line.startsWith("#")) {
        return <h2 key={idx} className="text-lg font-black text-slate-900 mt-6 mb-3 font-display uppercase">{line.replace("#", "").trim()}</h2>;
      }
      if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
        const content = line.trim().substring(1).trim();
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed mb-1 pl-1">
            {formatBoldText(content)}
          </li>
        );
      }
      if (line.trim() === "") return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2.5">{formatBoldText(line)}</p>;
    });
  };

  const formatBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-slate-950">{part}</strong> : part);
  };

  return (
    <div className="w-full flex flex-col space-y-6" id="seccion-fema-154-RVS">
      
      {/* BANNER SUPERIOR DE BIENVENIDA */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-red-500/20 text-red-300 font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase border border-red-500/30">
              Estándar Global: FEMA P-154
            </span>
            <h2 className="text-md sm:text-lg font-black tracking-tight text-white uppercase font-display flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-red-500" />
              Evaluación Visual Rápida del Riesgo Sísmico (RVS)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Herramienta oficial de <strong>FEMA</strong> (Federal Emergency Management Agency) para el triaje, clasificación de vulnerabilidad y priorización estructural a gran escala mediante el cálculo dinámico del Score estructural (<strong className="text-white">S</strong>).
            </p>
          </div>

          {/* Presets rápidos */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono mr-1">Pre-cargar:</span>
            <button
              onClick={() => loadPreset("peligroso")}
              className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition uppercase ${
                form.tipologiaId === "URM"
                  ? "bg-red-600 text-white border-red-500 shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              Falla (URM)
            </button>
            <button
              onClick={() => loadPreset("seguro")}
              className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition uppercase ${
                form.tipologiaId === "S1" && form.postBenchmark
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              Pasa (Sismorresistente)
            </button>
            <button
              onClick={() => loadPreset("moderado")}
              className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition uppercase ${
                form.tipologiaId === "C1" && form.sueloMalo
                  ? "bg-yellow-500 text-slate-950 border-yellow-400 shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              Intermedio (Caso C1)
            </button>
          </div>
        </div>
      </div>

      {/* TABS DE SECCIÓN */}
      <div className="flex bg-slate-100 rounded-xl p-1 self-start">
        <button
          onClick={() => setActiveTab("formulario")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "formulario"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Ficha Técnica y Calculadora</span>
        </button>
        <button
          onClick={() => setActiveTab("guia")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "guia"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Info className="h-4 w-4" />
          <span>Manual de FEMA P-154</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "formulario" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* LADO IZQUIERDO: FORMULARIO DETALLADO (7 Columnas) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-6">
              
              {/* Bloque 1: Identificación Básica */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-blue-600" />
                    1. Información e Identificación de la Estructura
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">FEMA-154 v3.0</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nombre del Edificio / Complejo</label>
                    <input
                      type="text"
                      value={form.nombreEdif}
                      onChange={(e) => handleInputChange("nombreEdif", e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Identificador Catastral / Código</label>
                    <input
                      type="text"
                      value={form.codigoEdif}
                      onChange={(e) => handleInputChange("codigoEdif", e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Evaluador / Inspector</label>
                    <input
                      type="text"
                      value={form.evaluador}
                      onChange={(e) => handleInputChange("evaluador", e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Fecha de Inspección</label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => handleInputChange("fecha", e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Número de Pisos</label>
                    <input
                      type="number"
                      value={form.numPisos}
                      onChange={(e) => handleInputChange("numPisos", parseInt(e.target.value) || 1)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Personas Expuestas (N)</label>
                    <input
                      type="number"
                      value={form.personasExpuestas}
                      onChange={(e) => handleInputChange("personasExpuestas", parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Dirección Física o Ubicación Geográfica</label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => handleInputChange("direccion", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    placeholder="Calle, Avenida, Ciudad..."
                  />
                </div>
              </div>

              {/* Bloque 2: Nivel de Peligro Sísmico Regional (FEMA de Clasificación de Mapas) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="text-[10px] font-black uppercase text-slate-800 font-display flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                    2. Nivel de Peligro Sísmico Regional (Zonificación de Diseño)
                  </h4>
                  <span className="text-[9px] text-slate-500 font-mono">Influye en Scores Básicos</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(["bajo", "moderado", "alto", "muy_alto"] as const).map((nivel) => (
                    <button
                      key={nivel}
                      type="button"
                      onClick={() => handleInputChange("nivelPeligroSismico", nivel)}
                      className={`py-2 px-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition cursor-pointer flex flex-col items-center justify-center ${
                        form.nivelPeligroSismico === nivel
                          ? "bg-red-600 text-white border-red-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="block">{nivel.replace("_", " ")}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 italic">
                  *Nota: En zonas andinas (Perú, Chile, Venezuela, Colombia) se pre-selecciona "Alto" o "Muy Alto" debido a la tectónica de subducción de la Placa de Nazca y Caribe.
                </p>
              </div>

              {/* Bloque 3: Tipología de Sistema Estructural (Puntaje Base) */}
              <div className="space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-blue-600" />
                    3. Tipo de Sistema Estructural (Puntaje Básico de FEMA 154)
                  </h3>
                  <p className="text-[10px] text-slate-400">Selecciona el tipo de estructura predominante en el edificio</p>
                </div>

                <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 pr-1">
                  {TIPOLOGIAS_FEMA.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleInputChange("tipologiaId", t.id)}
                      className={`p-2.5 text-left text-xs transition cursor-pointer flex items-start gap-2.5 ${
                        form.tipologiaId === t.id
                          ? "bg-blue-50/70 text-blue-900 font-semibold"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                        t.id === "URM" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {t.id}
                      </span>
                      <div className="flex-1">
                        <span className="block leading-snug">{t.descripcion}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Puntaje Básico para Peligro {form.nivelPeligroSismico.toUpperCase()} = <strong className="text-slate-700">{t.scores[form.nivelPeligroSismico].toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 4: Modificadores de Puntaje (Checkboxes / Modificadores) */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    4. Modificadores de Puntaje Observados en Campo
                  </h3>
                  <p className="text-[10px] text-slate-400">Afectan el score de colapso restando (incrementando el riesgo) o sumando puntos</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Irregularidad Vertical */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    form.irregularidadVertical
                      ? "bg-red-50/40 border-red-200"
                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.irregularidadVertical}
                      onChange={() => handleCheckboxChange("irregularidadVertical")}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Irregularidad Vertical
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-snug">
                        Presencia de planta baja blanda, variaciones de rigidez o retrocesos. (Resta: <strong className="text-red-600">{mods.irregVertical}</strong>)
                      </span>
                    </div>
                  </label>

                  {/* Irregularidad en Planta */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    form.irregularidadPlanta
                      ? "bg-red-50/40 border-red-200"
                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.irregularidadPlanta}
                      onChange={() => handleCheckboxChange("irregularidadPlanta")}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Irregularidad en Planta
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-snug">
                        Forma en planta (L, T, U, H, C), esquinas sin juntas. (Resta: <strong className="text-red-600">{mods.irregPlanta}</strong>)
                      </span>
                    </div>
                  </label>

                  {/* Adosamiento / Golpeteo */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    form.poundingEfecto
                      ? "bg-red-50/40 border-red-200"
                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.poundingEfecto}
                      onChange={() => handleCheckboxChange("poundingEfecto")}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Efecto de Golpeteo (Pounding)
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-snug">
                        Edificios adosados de diferente altura o sin dilatación sísmica. (Resta: <strong className="text-red-600">{mods.pounding}</strong>)
                      </span>
                    </div>
                  </label>

                  {/* Pre-Código */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    form.preCodigo
                      ? "bg-red-50/40 border-red-200"
                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.preCodigo}
                      onChange={() => handleCheckboxChange("preCodigo")}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Año de Construcción Pre-Código
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-snug">
                        Construido antes de normativas sismorresistentes modernas de la zona. (Resta: <strong className="text-red-600">{mods.preCode}</strong>)
                      </span>
                    </div>
                  </label>

                  {/* Post-Benchmark */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    form.postBenchmark
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.postBenchmark}
                      onChange={() => handleCheckboxChange("postBenchmark")}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Código Post-Benchmark
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-snug">
                        Estructura diseñada bajo reglamentos sísmicos de vanguardia. (Suma: <strong className="text-emerald-600">+{mods.postBench}</strong>)
                      </span>
                    </div>
                  </label>

                  {/* Suelo Blando */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    form.sueloMalo
                      ? "bg-red-50/40 border-red-200"
                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.sueloMalo}
                      onChange={() => handleCheckboxChange("sueloMalo")}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Suelo Depósito Blando (Clase D/E/F)
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-snug">
                        Terreno blando que amplifica ondas o es propenso a licuación. (Resta: <strong className="text-red-600">{mods.sueloMalo}</strong>)
                      </span>
                    </div>
                  </label>

                </div>
              </div>

            </div>

            {/* LADO DERECHO: PANEL DE RESULTADOS Y GENERACIÓN DE INFORME IA (5 Columnas) */}
            <div className="lg:col-span-5 flex flex-col space-y-6 sticky top-6">
              
              {/* TARJETA DINÁMICA DE SCORE S */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col space-y-5">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display">
                    Resultados de Triaje Estructural (FEMA 154)
                  </h3>
                  <p className="text-[10px] text-slate-400">Puntaje calculado dinámicamente en base a modificadores</p>
                </div>

                {/* VISUALIZADOR DE VELOCÍMETRO / VALOR DE SCORE */}
                <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                    Score Sísmico Estructural
                  </span>
                  <div className="text-5xl font-black text-slate-900 font-mono tracking-tight my-1.5 relative z-10 flex items-baseline">
                    {scoreFinal.toFixed(1)}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ 5.0</span>
                  </div>

                  {/* Etiqueta de Aceptabilidad */}
                  <div className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                    pasaEvaluacion
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}>
                    {pasaEvaluacion ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Probablemente Seguro (S ≥ 2.0)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4 text-red-600" /> DETALLADA REQUERIDA (S &lt; 2.0)
                      </span>
                    )}
                  </div>

                  <p className="text-[9.5px] text-slate-500 max-w-xs text-center mt-3 leading-snug px-3">
                    {pasaEvaluacion
                      ? "La probabilidad de colapso ante el sismo de diseño es baja. Sin embargo, no sustituye el modelado numérico detallado si hay cambios de uso."
                      : "La edificación falla el triaje rápido. Es prioritaria para inspección visual de Fase 2, ensayos destructivos y modelado matemático en SAP2000."}
                  </p>
                </div>

                {/* DESGLOSE MATEMÁTICO DE MODIFICADORES */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                    Desglose de Modificadores:
                  </span>
                  <div className="text-xs divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                    <div className="flex items-center justify-between p-2.5">
                      <span className="text-slate-600 font-medium font-display">Puntaje Básico de Partida ({selectedTipologia.id}):</span>
                      <span className="font-bold text-slate-900 font-mono">+{baseScore.toFixed(2)}</span>
                    </div>

                    {modDetails.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5">
                        <span className="text-slate-500 text-[11px]">{m.label}:</span>
                        <span className={`font-mono font-bold ${m.val < 0 ? "text-red-500" : "text-emerald-500"}`}>
                          {m.val > 0 ? "+" : ""}{m.val.toFixed(1)}
                        </span>
                      </div>
                    ))}

                    <div className="flex items-center justify-between p-2.5 bg-slate-100/50">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Score Estructural Final (S):</span>
                      <span className={`font-mono font-black ${pasaEvaluacion ? "text-emerald-600" : "text-red-600"}`}>
                        {scoreFinal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACCIÓN: GENERAR INFORME TÉCNICO DE IA */}
                <div className="pt-2">
                  <button
                    onClick={handleGenerateAIReport}
                    disabled={loadingReport}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs uppercase tracking-wider shadow-lg shadow-slate-900/10 transition cursor-pointer disabled:opacity-50"
                  >
                    {loadingReport ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                        <span>Analizando Edificio con Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                        <span>Generar Auditoría Sísmica FEMA con IA</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* RECUADRO DE REPORTE IA (ANÁLISIS DE RESILIENCIA) */}
              <AnimatePresence>
                {aiReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-900 font-display">
                            Informe Técnico del Método FEMA P-154
                          </h4>
                          <p className="text-[9px] text-slate-400">Auditoría pericial generada por Inteligencia Artificial</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={handleCopyReport}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-slate-500 transition cursor-pointer"
                          title="Copiar informe"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-slate-500 transition cursor-pointer"
                          title="Exportar / Imprimir"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contenedor del Texto */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 max-h-[400px] overflow-y-auto font-sans text-slate-700">
                      {formatMarkdown(aiReport)}
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/30">
                      <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span>Este informe es una evaluación de triaje rápido generada por IA mediante el SDK de Gemini. Debe ser refrendada por ingenieros civiles o patólogos de estructuras acreditados.</span>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {reportError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Error al generar informe:</span> {reportError}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="guide"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
          >
            {/* MANUAL METODOLÓGICO */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-md font-black uppercase text-slate-900 tracking-tight font-display">
                Manual Metodológico FEMA P-154
              </h3>
              <p className="text-xs text-slate-400">Guía técnica y científica de aplicación del Triaje Estructural rápido</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 uppercase font-display flex items-center gap-1.5 text-blue-700">
                    <span>●</span> Propósito del Filtro Rápido (RVS)
                  </h4>
                  <p>
                    El método de <strong>Cribado Visual Rápido (Rapid Visual Screening)</strong> es un filtro técnico ágil que no busca reemplazar los complejos programas de análisis por elementos finitos, sino actuar como un clasificador masivo. En tan solo 20-30 minutos por edificio, permite clasificar un inventario urbano entero de miles de edificios y separar de inmediato aquellos que son seguros de aquellos potencialmente peligrosos.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 uppercase font-display flex items-center gap-1.5 text-blue-700">
                    <span>●</span> Significado Matemático de Score Structural (S)
                  </h4>
                  <p>
                    El Score Estructural de FEMA se relaciona inversamente con la probabilidad de colapso de la edificación ante el sismo máximo reglamentario para la zona geográfica:
                  </p>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-mono text-[10px] text-indigo-700 text-center my-2 font-bold">
                    S = - log10 [ P(Colapso) ]
                  </div>
                  <ul className="list-disc list-inside pl-1 space-y-1.5 text-[11px] text-slate-500">
                    <li>Si <strong>S = 1.0</strong>: La probabilidad de colapso ante el sismo de diseño es de 10^-1 (es decir, un <strong className="text-red-600">10%</strong>).</li>
                    <li>Si <strong>S = 2.0</strong> (Umbral): La probabilidad de colapso es de 10^-2 (es decir, un <strong className="text-emerald-600">1.0%</strong>).</li>
                    <li>Si <strong>S = 3.0</strong>: La probabilidad es del 0.1%.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 uppercase font-display flex items-center gap-1.5 text-blue-700">
                    <span>●</span> Criterio de Selección del Umbral de Corte (S = 2.0)
                  </h4>
                  <p>
                    FEMA establece reglamentariamente que un edificio con **$S \geq 2.0$** posee un margen de seguridad razonable. Si la edificación arroja un puntaje inferior a **2.0**, se califica inmediatamente en semáforo rojo, obligando al inspector a emitir una recomendación oficial de **Evaluación de Fase 2 (Detallada)**. En dicha fase, un calculista debe inspeccionar los planos internos, tomar núcleos de concreto o modelar la edificación con espectros dinámicos.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[11px]">
                  <span className="font-bold text-slate-800 uppercase block mb-2 font-display">Adaptaciones Sugeridas en LATAM</span>
                  <p className="text-slate-500 leading-normal">
                    Dado que el FEMA original de EE. UU. no está concebido expresamente para la tipología andina, las agencias de gestión de riesgo latinoamericanas recomiendan complementar FEMA con las fichas locales (ej. **FUNVISIS** en Venezuela o **AIS** en Colombia) que penalizan explícitamente los sistemas mixtos de pórticos de baja calidad y la mampostería no confinada que son típicos de la autoconstrucción informal en laderas de la región.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
