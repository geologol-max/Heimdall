import React, { useState } from "react";
import {
  ClipboardList,
  MapPin,
  Building2,
  AlertTriangle,
  Flame,
  CheckSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  FileCheck,
  Layers,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Users,
  Eye,
  Info,
  Download,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Tipos de Datos para la Planilla FUNVISIS ---

interface FormState {
  // 1. Datos Generales
  fecha: string;
  codigoEdif: string;
  inspector: string;
  revisor: string;
  supervisor: string;

  // 3. Datos del Entrevistado
  entrevistadoNombre: string;
  entrevistadoTelf: string;
  entrevistadoRelacion: string; // Dueño, Empleado, Vecino, Alquilado, Otro

  // 4. Identificación y Ubicación
  nombreEdif: string;
  numPisos: number;
  numSotanos: number;
  numSemiSotanos: number;
  estado: string;
  ciudad: string;
  municipio: string;
  parroquia: string;
  urbanizacion: string;
  calle: string;
  ptoReferencia: string;
  coordX: string;
  coordY: string;
  huso: string; // 18, 19, 20, 21

  // 5. Uso de la Edificación
  grupoUso: "A1" | "A2" | "A3"; // A1 (Esencial), A2 (Importante), A3 (Otros/Viviendas)
  usoEspecifico: string;

  // 6. Capacidad de Ocupación
  personasExpuestas: number; // N

  // 7. Año de Construcción (Periodo)
  periodoConstruccion: string; // t<=1939, 1939-1947, 1947-1955, 1955-1967, 1967-1982, 1982-1998, 1998-2001, t>2001, autoconstruida
  
  // 8. Condición del Terreno
  tipoTerreno: "planicie" | "ladera_suave" | "ladera_fuerte" | "cima_base_cerca" | "cima_base_lejos";
  tieneDrenajes: boolean;

  // 9. Tipo Estructural Predominante
  tipoEstructuralId: number; // 1 a 15

  // 12. Irregularidades (Checkboxes)
  irregularidades: {
    vigNoAltas: boolean;       // j=1 (40)
    noMurosUnidir: boolean;    // j=2 (80)
    fragilidadExtrema: boolean; // j=3 (100)
    entrepisoDebil: boolean;   // j=4 (50)
    columnasCortas: boolean;   // j=5 (30)
    discontinuidadEjes: boolean; // j=6 (30)
    aberturasLosas: boolean;    // j=7 (10)
    asimetriaRigidez: boolean;  // j=8 (20)
    adosoLosaLosa: boolean;     // j=9a (10)
    adosoLosaCol: boolean;      // j=9b (20)
    plantaIrregular: boolean;   // j=10 (10)
    elevacionIrregular: boolean; // j=11 (10)
  };

  // 8.5 Separación (para adosamiento)
  separacionEdificiosCm: number;

  // 12.4 Profundidad de depósito
  depositoProfundo: boolean; // Edificios >6 pisos y depósitos sedimentos >120m (Suelo S3)

  // 13. Grado de Deterioro
  deterioroConcreto: "ninguno" | "moderado" | "severo";
  deterioroAcero: "ninguno" | "moderado" | "severo";
  deterioroParedes: "ninguno" | "moderado" | "severo";
  mantenimientoGeneral: "bueno" | "regular" | "bajo";

  // Zona Sísmica COVENIN 1756
  zonaSismica: number; // 0 a 7
  conEfectosTopograficos: boolean;
}

// --- Valores Iniciales por Defecto (Liceo Raimundo Martínez Centeno - Cariaco) ---
const INICIAL_ESTADO: FormState = {
  fecha: "2026-07-07",
  codigoEdif: "SU-RIB-0014",
  inspector: "Ing. Alejandro Guerrero",
  revisor: "Ing. Romme Rojas",
  supervisor: "Ing. Oscar A. López",
  entrevistadoNombre: "Zulmar Meza",
  entrevistadoTelf: "0426-4309751",
  entrevistadoRelacion: "Directora del Plantel",
  nombreEdif: "Liceo Raimundo Martínez Centeno",
  numPisos: 3,
  numSotanos: 0,
  numSemiSotanos: 0,
  estado: "Sucre",
  ciudad: "Cariaco",
  municipio: "Ribero",
  parroquia: "Cariaco",
  urbanizacion: "El Centro",
  calle: "Calle principal c/w Calle Comercio",
  ptoReferencia: "Frente a la Plaza Bolívar",
  coordX: "684361",
  coordY: "1159080",
  huso: "19",
  grupoUso: "A2",
  usoEspecifico: "Educativo (Liceo de Secundaria)",
  personasExpuestas: 1200,
  periodoConstruccion: "1967-1982", // t=1970, norma MOP 1967
  tipoTerreno: "planicie",
  tieneDrenajes: true,
  tipoEstructuralId: 2, // PCAP: Pórticos de concreto armado rellenos con paredes de bloques (I2 = 40)
  irregularidades: {
    vigNoAltas: false,
    noMurosUnidir: false,
    fragilidadExtrema: false,
    entrepisoDebil: true,   // j=4 (50)
    columnasCortas: true,   // j=5 (30)
    discontinuidadEjes: false,
    aberturasLosas: false,
    asimetriaRigidez: true,  // j=8 (20)
    adosoLosaLosa: true,     // j=9a (10)
    adosoLosaCol: false,
    plantaIrregular: false,
    elevacionIrregular: false
  },
  separacionEdificiosCm: 8,
  depositoProfundo: false,
  deterioroConcreto: "ninguno",
  deterioroAcero: "ninguno",
  deterioroParedes: "moderado",
  mantenimientoGeneral: "regular",
  zonaSismica: 5, // Cariaco está en alta zona, el ejemplo usa Zona 5 como calibración base de la tabla, pero dejemos 5 ajustable.
  conEfectosTopograficos: false
};

// --- Tipos Estructurales Predominantes (Tabla 5 / Tabla 2.5) ---
const TIPOS_ESTRUCTURALES = [
  { id: 1, name: "PCA", value: 25, description: "Pórticos de concreto armado (Paredes no interfieren lateralmente)" },
  { id: 2, name: "PCAP", value: 40, description: "Pórticos de concreto armado rellenos con paredes de bloques de arcilla o concreto" },
  { id: 3, name: "MCA2D", value: 10, description: "Muros de concreto armado en dos direcciones horizontales" },
  { id: 4, name: "MCA1D", value: 90, description: "Muros de concreto armado de poco espesor en una dirección (tipo túnel)" },
  { id: 5, name: "PA", value: 40, description: "Pórticos de acero" },
  { id: 6, name: "PAPT", value: 60, description: "Pórticos de acero con perfiles tubulares" },
  { id: 7, name: "PAD", value: 20, description: "Pórticos de acero diagonalizados" },
  { id: 8, name: "PAC", value: 40, description: "Pórticos de acero con cerchas" },
  { id: 9, name: "PRE", value: 90, description: "Sistemas pre-fabricados a base de grandes paneles o de pórticos" },
  { id: 10, name: "MMC", value: 70, description: "Sistemas cuyos elementos portantes sean muros de mampostería confinada" },
  { id: 11, name: "MMNC", value: 100, description: "Sistemas cuyos elementos portantes sean muros de mampostería no confinada (Autoconstrucción)" },
  { id: 12, name: "PMBCB", value: 90, description: "Sistemas mixtos de pórticos y mampostería de baja calidad de construcción, ≤ 2 pisos" },
  { id: 13, name: "PMBCA", value: 95, description: "Sistemas mixtos de pórticos y mampostería de baja calidad de construcción, > 2 pisos" },
  { id: 14, name: "VB", value: 90, description: "Viviendas de bahareque de un piso" },
  { id: 15, name: "VCP", value: 100, description: "Viviendas de construcción precaria (tierra, madera, zinc, etc.)" }
];

// --- Valores de Antigüedad I1 (Tabla 4) ---
const ANTIGUEDAD_VALORES: { [key: string]: { val: number; label: string; norma: string } } = {
  "t<=1939": { val: 100, label: "Antes de 1939", norma: "Pre-normativa (Sin código sismorresistente)" },
  "1939-1947": { val: 80, label: "Entre 1939 y 1947", norma: "Primeras pautas sismorresistentes MOP" },
  "1947-1955": { val: 80, label: "Entre 1947 y 1955", norma: "Normas de Edificios MOP 1947" },
  "1955-1967": { val: 90, label: "Entre 1955 y 1967", norma: "Norma MOP 1955 (Criterios de fuerza reducidos)" },
  "1967-1982": { val: 60, label: "Entre 1967 y 1982", norma: "Norma Provisional MOP 1967 (Post-Terremoto Caracas)" },
  "1982-1998": { val: 30, label: "Entre 1982 y 1998", norma: "Norma COVENIN 1756:1982" },
  "1998-2001": { val: 10, label: "Entre 1998 y 2001", norma: "Norma COVENIN 1756:1998" },
  "t>2001": { val: 15, label: "Después de 2001", norma: "Norma COVENIN 1756-1:2001 vigente" },
  "autoconstruida": { val: 100, label: "Vivienda popular / Autoconstruida", norma: "Sin cumplimiento de normativas formales" }
};

// --- Valores del Índice de Amenaza IA (Tabla 2.1 COVENIN 1756) ---
const AMENAZA_VALORES: { [key: number]: { Ao: number; sinTopografia: number; conTopografia: number } } = {
  7: { Ao: 0.40, sinTopografia: 0.90, conTopografia: 1.00 },
  6: { Ao: 0.35, sinTopografia: 0.80, conTopografia: 0.88 },
  5: { Ao: 0.30, sinTopografia: 0.68, conTopografia: 0.75 },
  4: { Ao: 0.25, sinTopografia: 0.56, conTopografia: 0.63 },
  3: { Ao: 0.20, sinTopografia: 0.45, conTopografia: 0.50 },
  2: { Ao: 0.15, sinTopografia: 0.34, conTopografia: 0.38 },
  1: { Ao: 0.10, sinTopografia: 0.23, conTopografia: 0.25 },
  0: { Ao: 0.00, sinTopografia: 0.05, conTopografia: 0.05 }
};

export default function VulnerabilidadVenezuela() {
  const [form, setForm] = useState<FormState>(INICIAL_ESTADO);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // --- HANDLERS DE FORMULARIO ---
  const handleInputChange = (field: keyof FormState, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (irregularityKey: keyof FormState["irregularidades"]) => {
    setForm(prev => ({
      ...prev,
      irregularidades: {
        ...prev.irregularidades,
        [irregularityKey]: !prev.irregularidades[irregularityKey]
      }
    }));
  };

  const loadPreset = (presetName: "moderno" | "escuela" | "popular") => {
    setAiReport(null);
    setReportError(null);
    if (presetName === "moderno") {
      setForm({
        ...INICIAL_ESTADO,
        codigoEdif: "CCS-SUR-0010",
        nombreEdif: "Edificio Residencial Moderno de 10 pisos",
        numPisos: 10,
        estado: "Distrito Capital",
        ciudad: "Caracas",
        municipio: "Baruta",
        parroquia: "El Cafetal",
        personasExpuestas: 200,
        periodoConstruccion: "t>2001", // I1 = 15
        tipoEstructuralId: 2, // PCAP: I2 = 40
        irregularidades: {
          vigNoAltas: false,
          noMurosUnidir: false,
          fragilidadExtrema: false,
          entrepisoDebil: false,
          columnasCortas: true, // j=5 (30)
          discontinuidadEjes: false,
          aberturasLosas: false,
          asimetriaRigidez: false,
          adosoLosaLosa: false,
          adosoLosaCol: false,
          plantaIrregular: false,
          elevacionIrregular: false
        },
        tipoTerreno: "planicie",
        tieneDrenajes: true,
        deterioroConcreto: "ninguno",
        deterioroAcero: "ninguno",
        deterioroParedes: "ninguno",
        mantenimientoGeneral: "bueno",
        zonaSismica: 5, // AMC Sur
        conEfectosTopograficos: false
      });
      setActiveStep(2);
    } else if (presetName === "escuela") {
      setForm(INICIAL_ESTADO); // El por defecto es Cariaco
      setActiveStep(2);
    } else {
      setForm({
        ...INICIAL_ESTADO,
        codigoEdif: "CCS-LIB-0021",
        nombreEdif: "Vivienda Popular Autoconstruida en Petare",
        numPisos: 3,
        estado: "Miranda",
        ciudad: "Caracas",
        municipio: "Sucre",
        parroquia: "Petare",
        personasExpuestas: 12,
        periodoConstruccion: "autoconstruida", // I1 = 100
        tipoEstructuralId: 11, // MMNC: I2 = 100
        irregularidades: {
          vigNoAltas: false,
          noMurosUnidir: false,
          fragilidadExtrema: false,
          entrepisoDebil: true,   // j=4 (50)
          columnasCortas: true,   // j=5 (30)
          discontinuidadEjes: false,
          aberturasLosas: false,
          asimetriaRigidez: true,  // j=8 (20)
          adosoLosaLosa: false,
          adosoLosaCol: true,      // j=9b (20)
          plantaIrregular: false,
          elevacionIrregular: false
        },
        tipoTerreno: "ladera_suave", // Ladera entre 20 y 45°
        tieneDrenajes: true,
        deterioroConcreto: "ninguno",
        deterioroAcero: "ninguno",
        deterioroParedes: "moderado",
        mantenimientoGeneral: "bajo",
        zonaSismica: 5,
        conEfectosTopograficos: true // Ladera con pendiente notable
      });
      setActiveStep(2);
    }
  };

  // --- CÁLCULOS MATEMÁTICOS DE LA METODOLOGÍA FUNVISIS ---

  // 1. Antigüedad I1
  const i1 = ANTIGUEDAD_VALORES[form.periodoConstruccion]?.val || 15;

  // 2. Tipo Estructural I2
  const selectedStruct = TIPOS_ESTRUCTURALES.find(t => t.id === form.tipoEstructuralId);
  const i2 = selectedStruct ? selectedStruct.value : 40;

  // 3. Irregularidades I3
  // Suma de I3j acotada a 100
  let i3Raw = 0;
  if (form.irregularidades.vigNoAltas) i3Raw += 40;
  if (form.irregularidades.noMurosUnidir) i3Raw += 80;
  if (form.irregularidades.fragilidadExtrema) i3Raw += 100;
  if (form.irregularidades.entrepisoDebil) i3Raw += 50;
  if (form.irregularidades.columnasCortas) i3Raw += 30;
  if (form.irregularidades.discontinuidadEjes) i3Raw += 30;
  if (form.irregularidades.aberturasLosas) i3Raw += 10;
  if (form.irregularidades.asimetriaRigidez) i3Raw += 20;
  if (form.irregularidades.adosoLosaLosa) i3Raw += 10;
  if (form.irregularidades.adosoLosaCol) i3Raw += 20;
  if (form.irregularidades.plantaIrregular) i3Raw += 10;
  if (form.irregularidades.elevacionIrregular) i3Raw += 10;

  // Override: MMNC con >=2 pisos se asigna I3 = 100 automáticamente
  let i3 = Math.min(i3Raw, 100);
  if (form.tipoEstructuralId === 11 && form.numPisos >= 2) {
    i3 = 100;
  }

  // 4. Profundidad del Depósito I4
  const i4 = (form.numPisos > 6 && form.depositoProfundo) ? 100 : 0;

  // 5. Topografía y Drenajes I5
  let i5Loc = 0;
  if (form.tipoTerreno === "ladera_suave") i5Loc = 50;
  else if (form.tipoTerreno === "ladera_fuerte") i5Loc = 80;
  else if (form.tipoTerreno === "cima_base_cerca") i5Loc = 80;
  else if (form.tipoTerreno === "cima_base_lejos") i5Loc = 0;

  const i5Dren = form.tieneDrenajes ? 0 : 20;
  const i5 = Math.min(i5Loc + i5Dren, 100);

  // 6. Grado de Deterioro I6
  let i6EstConcreto = 0;
  if (form.deterioroConcreto === "moderado") i6EstConcreto = 35;
  else if (form.deterioroConcreto === "severo") i6EstConcreto = 70;

  let i6EstAcero = 0;
  if (form.deterioroAcero === "moderado") i6EstAcero = 35;
  else if (form.deterioroAcero === "severo") i6EstAcero = 70;

  const i6Est = Math.max(i6EstConcreto, i6EstAcero); // Mayor si es mixta

  let i6Par = 0;
  if (form.deterioroParedes === "moderado") i6Par = 10;
  else if (form.deterioroParedes === "severo") i6Par = 20;

  let i6Maint = 0;
  if (form.mantenimientoGeneral === "regular") i6Maint = 5;
  else if (form.mantenimientoGeneral === "bajo") i6Maint = 10;

  const i6 = Math.min(i6Est + i6Par + i6Maint, 100);

  // --- ÍNDICE DE VULNERABILIDAD GLOBAL (Iv) ---
  // Iv = sum(alpha_i * I_i)
  // Pesos: I1(0.25), I2(0.35), I3(0.25), I4(0.07), I5(0.04), I6(0.04)
  const Iv = (0.25 * i1) + (0.35 * i2) + (0.25 * i3) + (0.07 * i4) + (0.04 * i5) + (0.04 * i6);

  // --- ÍNDICE DE AMENAZA (Ia) ---
  const amenazaObj = AMENAZA_VALORES[form.zonaSismica] || AMENAZA_VALORES[5];
  const Ia = form.conEfectosTopograficos ? amenazaObj.conTopografia : amenazaObj.sinTopografia;

  // --- ÍNDICE DE IMPORTANCIA (Ii) ---
  // Depende de Grupo de uso y N (personas expuestas)
  let Ii = 0.80;
  const N = form.personasExpuestas;
  if (form.grupoUso === "A1") {
    if (N <= 10) Ii = 0.90;
    else if (N <= 100) Ii = 0.92;
    else if (N <= 500) Ii = 0.95;
    else if (N <= 1000) Ii = 0.97;
    else Ii = 1.00;
  } else if (form.grupoUso === "A2") {
    if (N <= 10) Ii = 0.85;
    else if (N <= 100) Ii = 0.87;
    else if (N <= 500) Ii = 0.90;
    else if (N <= 1000) Ii = 0.93;
    else Ii = 0.95;
  } else { // A3
    if (N <= 10) Ii = 0.80;
    else if (N <= 100) Ii = 0.82;
    else if (N <= 500) Ii = 0.85;
    else if (N <= 1000) Ii = 0.87;
    else Ii = 0.90;
  }

  // --- ÍNDICE DE RIESGO SÍSMICO (Ir = Ia * Iv) ---
  const Ir = Ia * Iv;

  // --- ÍNDICE DE PRIORIZACIÓN DE EDIFICIOS (Ip = Ia * Iv * Ii) ---
  const Ip = Ia * Iv * Ii;

  // --- CALIFICACIONES (Mapeo de Rangos Oficiales) ---
  // Iv Rango (Tabla 2.13)
  let IvLabel = "Muy Baja";
  let IvColor = "text-emerald-500 bg-emerald-50 border-emerald-250";
  if (Iv >= 60) {
    IvLabel = "Muy Elevada";
    IvColor = "text-red-600 bg-red-50 border-red-200 font-black";
  } else if (Iv >= 40) {
    IvLabel = "Elevada";
    IvColor = "text-orange-500 bg-orange-50 border-orange-200 font-bold";
  } else if (Iv >= 30) {
    IvLabel = "Media Alta";
    IvColor = "text-amber-500 bg-amber-50 border-amber-150";
  } else if (Iv >= 20) {
    IvLabel = "Media Baja";
    IvColor = "text-blue-500 bg-blue-50 border-blue-150";
  } else if (Iv >= 10) {
    IvLabel = "Baja";
    IvColor = "text-emerald-600 bg-emerald-50 border-emerald-150";
  }

  // Ir Rango (Tabla 2.14)
  let IrLabel = "Muy Bajo";
  let IrColor = "text-emerald-600 bg-emerald-50";
  if (Ir >= 60) {
    IrLabel = "Muy Elevado";
    IrColor = "text-red-700 bg-red-100 border border-red-300 font-black animate-pulse";
  } else if (Ir >= 40) {
    IrLabel = "Elevado";
    IrColor = "text-red-500 bg-red-50 border border-red-200 font-bold";
  } else if (Ir >= 25) {
    IrLabel = "Alto";
    IrColor = "text-orange-500 bg-orange-50 border border-orange-200";
  } else if (Ir >= 15) {
    IrLabel = "Medio Alto";
    IrColor = "text-amber-500 bg-amber-50 border border-amber-200";
  } else if (Ir >= 8) {
    IrLabel = "Medio Bajo";
    IrColor = "text-blue-500 bg-blue-50";
  } else if (Ir >= 3) {
    IrLabel = "Bajo";
    IrColor = "text-emerald-500 bg-emerald-50";
  }

  // Ip Prioridad Rango (Tabla 2.15)
  let IpPrioridad = "P12";
  let IpLabel = "Prioridad Mínima";
  let IpBg = "bg-emerald-500";
  if (Ip >= 60) { IpPrioridad = "P1"; IpLabel = "Prioridad Máxima"; IpBg = "bg-red-700"; }
  else if (Ip >= 50) { IpPrioridad = "P2"; IpLabel = "Prioridad Muy Alta"; IpBg = "bg-red-500"; }
  else if (Ip >= 40) { IpPrioridad = "P3"; IpLabel = "Prioridad Alta"; IpBg = "bg-orange-600"; }
  else if (Ip >= 30) { IpPrioridad = "P4"; IpLabel = "Prioridad Media Alta"; IpBg = "bg-orange-400"; }
  else if (Ip >= 25) { IpPrioridad = "P5"; IpLabel = "Prioridad Media"; IpBg = "bg-amber-500"; }
  else if (Ip >= 20) { IpPrioridad = "P6"; IpLabel = "Prioridad Media Baja"; IpBg = "bg-amber-400"; }
  else if (Ip >= 16) { IpPrioridad = "P7"; IpLabel = "Prioridad de Monitoreo"; IpBg = "bg-yellow-500"; }
  else if (Ip >= 12) { IpPrioridad = "P8"; IpLabel = "Prioridad Baja-Monitoreo"; IpBg = "bg-yellow-400"; }
  else if (Ip >= 8) { IpPrioridad = "P9"; IpLabel = "Prioridad Baja"; IpBg = "bg-blue-500"; }
  else if (Ip >= 5) { IpPrioridad = "P10"; IpLabel = "Prioridad Muy Baja"; IpBg = "bg-blue-400"; }
  else if (Ip >= 2) { IpPrioridad = "P11"; IpLabel = "Prioridad Despreciable"; IpBg = "bg-emerald-400"; }

  // --- LLAMADA A ENDPOINT DE IA EN BACKEND ---
  const handleGenerateAIReport = async () => {
    setLoadingReport(true);
    setAiReport(null);
    setReportError(null);

    const irregularidadesList: string[] = [];
    if (form.irregularidades.vigNoAltas) irregularidadesList.push("Ausencia de vigas altas");
    if (form.irregularidades.noMurosUnidir) irregularidadesList.push("Ausencia de muros en una dirección");
    if (form.irregularidades.fragilidadExtrema) irregularidadesList.push("Frágil extrema (adobe/sin confinamiento)");
    if (form.irregularidades.entrepisoDebil) irregularidadesList.push("Presencia de entrepiso blando/débil");
    if (form.irregularidades.columnasCortas) irregularidadesList.push("Presencia de columnas cortas");
    if (form.irregularidades.discontinuidadEjes) irregularidadesList.push("Discontinuidad de ejes");
    if (form.irregularidades.aberturasLosas) irregularidadesList.push("Aberturas excesivas en losas (>20%)");
    if (form.irregularidades.asimetriaRigidez) irregularidadesList.push("Asimetría fuerte de masa o rigidez");
    if (form.irregularidades.adosoLosaLosa) irregularidadesList.push("Adosamiento: Losa contra Losa");
    if (form.irregularidades.adosoLosaCol) irregularidadesList.push("Adosamiento: Losa contra Columna");
    if (form.irregularidades.plantaIrregular) irregularidadesList.push("Esquema de Planta irregular (H, T, C, L)");
    if (form.irregularidades.elevacionIrregular) irregularidadesList.push("Esquema de Elevación irregular (Pirámide invertida, T)");

    try {
      const payload = {
        buildingName: form.nombreEdif,
        location: {
          state: form.estado,
          city: form.ciudad,
          municipality: form.municipio,
          parroquia: form.parroquia,
          sector: form.urbanizacion,
          coordX: form.coordX,
          coordY: form.coordY,
          huso: form.huso
        },
        floors: form.numPisos,
        basements: form.numSotanos,
        semiBasements: form.numSemiSotanos,
        peopleExposed: form.personasExpuestas,
        usageGroup: form.grupoUso,
        constructionPeriod: {
          period: form.periodoConstruccion,
          label: ANTIGUEDAD_VALORES[form.periodoConstruccion]?.label || "N/A"
        },
        terrainCondition: {
          terrain: form.tipoTerreno,
          label: form.tipoTerreno === "planicie" ? "Planicie (<20°)" : "Zona de Pendiente / Ladera"
        },
        hasDrainage: form.tieneDrenajes,
        structuralType: {
          id: form.tipoEstructuralId,
          description: selectedStruct?.description || "N/A"
        },
        irregularities: irregularidadesList,
        depositDepth: form.numPisos > 6 && form.depositoProfundo,
        deterioroEstrucCemento: form.deterioroConcreto,
        deterioroEstrucAcero: form.deterioroAcero,
        deterioroParedes: form.deterioroParedes,
        mantenimientoGeneral: form.mantenimientoGeneral,
        indices: {
          Ia,
          I1: i1,
          I2: i2,
          I3: i3,
          I4: i4,
          I5: i5,
          I6: i6,
          Iv,
          IvLabel,
          Ii,
          Ir,
          IrLabel,
          Ip,
          IpPrioridad
        }
      };

      const res = await fetch("/api/generate-vulnerabilidad-ve", {
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

  const handleExportPDF = () => {
    window.print();
  };

  // --- Formateador simple de Markdown a HTML/JSX para el Reporte de IA ---
  const formatMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      // Headers
      if (line.startsWith("###")) {
        return <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-2 border-b border-slate-100 pb-1 uppercase font-display">{line.replace("###", "").trim()}</h4>;
      }
      if (line.startsWith("##")) {
        return <h3 key={idx} className="text-base font-black text-blue-800 mt-5 mb-2 font-display uppercase">{line.replace("##", "").trim()}</h3>;
      }
      if (line.startsWith("#")) {
        return <h2 key={idx} className="text-lg font-black text-slate-900 mt-6 mb-3 font-display uppercase">{line.replace("#", "").trim()}</h2>;
      }
      // List items
      if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
        // Formatear negritas dentro de la línea
        const content = line.trim().substring(1).trim();
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed mb-1 pl-1">
            {formatBoldText(content)}
          </li>
        );
      }
      // Párrafo estándar
      if (line.trim() === "") return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2.5">{formatBoldText(line)}</p>;
    });
  };

  const formatBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-slate-950">{part}</strong> : part);
  };

  return (
    <div className="w-full flex flex-col space-y-6" id="seccion-vulnerabilidad-funvisis">
      
      {/* SECCIÓN CABECERA TIPO BANNER DE CALIBRACIÓN */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden">
        {/* Franja Bandera Venezuela en el tope */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="flex-1 bg-yellow-400" />
          <div className="flex-1 bg-blue-600" />
          <div className="flex-1 bg-red-600" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase border border-blue-500/30">
              Caso de Estudio: Venezuela
            </span>
            <h2 className="text-md sm:text-lg font-black tracking-tight text-white uppercase font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-yellow-400" />
              Evaluación de Vulnerabilidad Sísmica G-20007752-2
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Basado en la metodología oficial de <strong>FUNVISIS</strong> para la priorización de edificios existentes en la gestión del riesgo sísmico. Permite evaluar de forma rápida la vulnerabilidad física cualitativa y el riesgo macro ante solicitaciones sísmicas regionales.
            </p>
          </div>

          {/* Botones de Pre-Carga / Ejemplos Históricos */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono mr-1">Calibraciones:</span>
            <button
              onClick={() => loadPreset("escuela")}
              className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition uppercase ${
                form.codigoEdif === "SU-RIB-0014"
                  ? "bg-yellow-500 text-slate-950 border-yellow-400 shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              Escuela Antigua
            </button>
            <button
              onClick={() => loadPreset("popular")}
              className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition uppercase ${
                form.codigoEdif === "CCS-LIB-0021"
                  ? "bg-yellow-500 text-slate-950 border-yellow-400 shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              Vivienda Popular
            </button>
            <button
              onClick={() => loadPreset("moderno")}
              className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition uppercase ${
                form.codigoEdif === "CCS-SUR-0010"
                  ? "bg-yellow-500 text-slate-950 border-yellow-400 shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              Edificio Moderno
            </button>
          </div>
        </div>
      </div>

      {/* CUERPO DEL EVALUADOR: DOS COLUMNAS (FORMULARIO E INFORME) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO MULTI-PASO (7 Columnas) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Tabs internas de pasos del formulario */}
          <div className="bg-slate-50 border-b border-slate-200 grid grid-cols-4 text-center">
            <button
              onClick={() => setActiveStep(1)}
              className={`py-3 px-1 text-[10px] sm:text-xs font-bold transition uppercase border-b-2 flex flex-col items-center justify-center space-y-0.5 cursor-pointer ${
                activeStep === 1
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:bg-slate-100"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>1. Identificación</span>
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className={`py-3 px-1 text-[10px] sm:text-xs font-bold transition uppercase border-b-2 flex flex-col items-center justify-center space-y-0.5 cursor-pointer ${
                activeStep === 2
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>2. Tipología y Uso</span>
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className={`py-3 px-1 text-[10px] sm:text-xs font-bold transition uppercase border-b-2 flex flex-col items-center justify-center space-y-0.5 cursor-pointer ${
                activeStep === 3
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>3. Irregularidad</span>
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className={`py-3 px-1 text-[10px] sm:text-xs font-bold transition uppercase border-b-2 flex flex-col items-center justify-center space-y-0.5 cursor-pointer ${
                activeStep === 4
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>4. Deterioro</span>
            </button>
          </div>

          <div className="p-5 sm:p-6 min-h-[450px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                
                {/* PASO 1: DATOS GENERALES Y UBICACIÓN */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display">1. Identificación y Ubicación Geográfica</h3>
                      <p className="text-[10px] text-slate-400">Datos principales de la ficha catastral de inspección rápida</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nombre o Nº Edificación</label>
                        <input
                          type="text"
                          value={form.nombreEdif}
                          onChange={(e) => handleInputChange("nombreEdif", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Código Edificación</label>
                        <input
                          type="text"
                          value={form.codigoEdif}
                          onChange={(e) => handleInputChange("codigoEdif", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Fecha Inspección</label>
                        <input
                          type="date"
                          value={form.fecha}
                          onChange={(e) => handleInputChange("fecha", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Inspector</label>
                        <input
                          type="text"
                          value={form.inspector}
                          onChange={(e) => handleInputChange("inspector", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Revisor</label>
                        <input
                          type="text"
                          value={form.revisor}
                          onChange={(e) => handleInputChange("revisor", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Supervisor</label>
                        <input
                          type="text"
                          value={form.supervisor}
                          onChange={(e) => handleInputChange("supervisor", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Estado</label>
                        <input
                          type="text"
                          value={form.estado}
                          onChange={(e) => handleInputChange("estado", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Ciudad</label>
                        <input
                          type="text"
                          value={form.ciudad}
                          onChange={(e) => handleInputChange("ciudad", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Municipio</label>
                        <input
                          type="text"
                          value={form.municipio}
                          onChange={(e) => handleInputChange("municipio", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Parroquia</label>
                        <input
                          type="text"
                          value={form.parroquia}
                          onChange={(e) => handleInputChange("parroquia", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Urbanización, Barrio, Sector</label>
                        <input
                          type="text"
                          value={form.urbanizacion}
                          onChange={(e) => handleInputChange("urbanizacion", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Calle, Vereda, Punto de Referencia</label>
                        <input
                          type="text"
                          value={form.calle}
                          onChange={(e) => handleInputChange("calle", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50/20 border border-blue-100 p-3 rounded-xl">
                      <h4 className="text-[10px] font-black uppercase text-blue-900 mb-2 font-display flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-500" /> Proyección UTM (Datum REGVEN)
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Coordenada X (m)</label>
                          <input
                            type="text"
                            value={form.coordX}
                            onChange={(e) => handleInputChange("coordX", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                            placeholder="684361"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Coordenada Y (m)</label>
                          <input
                            type="text"
                            value={form.coordY}
                            onChange={(e) => handleInputChange("coordY", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                            placeholder="1159080"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Huso UTM</label>
                          <select
                            value={form.huso}
                            onChange={(e) => handleInputChange("huso", e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono bg-white"
                          >
                            <option value="18">Huso 18</option>
                            <option value="19">Huso 19 (AMC/CCS)</option>
                            <option value="20">Huso 20</option>
                            <option value="21">Huso 21</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 2: TIPO ESTRUCTURAL E IMPORTANCIA */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display">2. Características de la Edificación y Exposición</h3>
                      <p className="text-[10px] text-slate-400">Año de construcción, tipo de uso, habitantes y tipología predominante de la edificación</p>
                    </div>

                    {/* Fila: Antigüedad y Grupo de Uso */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Periodo de Construcción */}
                      <div className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-50/30">
                        <label className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-blue-500" /> Año / Periodo de Construcción
                        </label>
                        <select
                          value={form.periodoConstruccion}
                          onChange={(e) => handleInputChange("periodoConstruccion", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        >
                          {Object.entries(ANTIGUEDAD_VALORES).map(([key, item]) => (
                            <option key={key} value={key}>
                              {item.label} (I1 = {item.val})
                            </option>
                          ))}
                        </select>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Norma de la época: <span className="font-bold text-slate-800">{ANTIGUEDAD_VALORES[form.periodoConstruccion]?.norma}</span>
                        </div>
                      </div>

                      {/* Grupo de Uso e Importancia */}
                      <div className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-50/30">
                        <label className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                          <Users className="h-3 w-3 text-blue-500" /> Grupo de Importancia & Uso
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(["A1", "A2", "A3"] as const).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => handleInputChange("grupoUso", g)}
                              className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition uppercase cursor-pointer ${
                                form.grupoUso === g
                                  ? "bg-blue-600 text-white border-blue-500"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              Grupo {g}
                            </button>
                          ))}
                        </div>
                        <div className="text-[9px] text-slate-400 leading-snug">
                          {form.grupoUso === "A1" && "A1: Hospitales, estaciones de bomberos, protección civil."}
                          {form.grupoUso === "A2" && "A2: Escuelas, policías, telecomunicaciones, museos, entes públicos."}
                          {form.grupoUso === "A3" && "A3: Viviendas, oficinas, comercios, hoteles, depósitos."}
                        </div>
                      </div>
                    </div>

                    {/* Exposición y Niveles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Personas Expuestas (N)</label>
                        <input
                          type="number"
                          value={form.personasExpuestas}
                          onChange={(e) => handleInputChange("personasExpuestas", parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nº de Pisos</label>
                        <input
                          type="number"
                          value={form.numPisos}
                          onChange={(e) => handleInputChange("numPisos", parseInt(e.target.value) || 1)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Sótanos / Semi-Sótanos</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            value={form.numSotanos}
                            onChange={(e) => handleInputChange("numSotanos", parseInt(e.target.value) || 0)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono text-center"
                            placeholder="Sót."
                            min="0"
                          />
                          <input
                            type="number"
                            value={form.numSemiSotanos}
                            onChange={(e) => handleInputChange("numSemiSotanos", parseInt(e.target.value) || 0)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono text-center"
                            placeholder="S-S."
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tipología Estructural */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                        <Layers className="h-3 w-3 text-blue-500" /> Tipo Estructural Predominante
                      </label>
                      <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 pr-1">
                        {TIPOS_ESTRUCTURALES.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleInputChange("tipoEstructuralId", t.id)}
                            className={`p-2.5 text-left text-xs transition cursor-pointer flex items-start gap-2.5 ${
                              form.tipoEstructuralId === t.id
                                ? "bg-blue-50/70 text-blue-900 font-semibold"
                                : "hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="font-mono bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                              Tipo {t.id}
                            </span>
                            <div className="flex-1">
                              <span className="block leading-snug">{t.description}</span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                Aporte de Vulnerabilidad Intrínseca (I2) = <strong className="text-slate-700">{t.value}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 3: IRREGULARIDADES Y TERRENO */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display">3. Irregularidades Estructurales e Inestabilidad del Terreno</h3>
                      <p className="text-[10px] text-slate-400">Modificadores cualitativos que incrementan la vulnerabilidad de la edificación (Suma de irregularidades acotada a 100)</p>
                    </div>

                    {/* Terreno y Drenajes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Condición del Terreno</label>
                        <select
                          value={form.tipoTerreno}
                          onChange={(e) => handleInputChange("tipoTerreno", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        >
                          <option value="planicie">Planicie (Pendiente Terreno &lt; 20°)</option>
                          <option value="ladera_suave">Ladera con pendiente suave (Entre 20° y 45°)</option>
                          <option value="ladera_fuerte">Ladera con pendiente fuerte (Mayor a 45°)</option>
                          <option value="cima_base_cerca">Sobre la cima o base de ladera (Distancia &lt; H talud)</option>
                          <option value="cima_base_lejos">Sobre la cima o base de ladera (Distancia &gt; H talud)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Sistema de Drenajes en Laderas</label>
                        <div className="flex items-center space-x-4 pt-1.5">
                          <label className="flex items-center space-x-2 text-xs cursor-pointer">
                            <input
                              type="radio"
                              checked={form.tieneDrenajes}
                              onChange={() => handleInputChange("tieneDrenajes", true)}
                              className="accent-blue-600"
                            />
                            <span>Sí tiene drenajes</span>
                          </label>
                          <label className="flex items-center space-x-2 text-xs cursor-pointer text-red-600">
                            <input
                              type="radio"
                              checked={!form.tieneDrenajes}
                              onChange={() => handleInputChange("tieneDrenajes", false)}
                              className="accent-red-600"
                            />
                            <span className="font-semibold">No tiene drenajes</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Listado de Irregularidades */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-600">
                        <span>Seleccione las Irregularidades Detectadas:</span>
                        <span className="font-mono text-blue-600 font-bold">I3 acumulado: {i3Raw} / 100</span>
                      </div>

                      {/* Caja especial de override */}
                      {form.tipoEstructuralId === 11 && form.numPisos >= 2 && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 text-[10px] leading-relaxed">
                          ⚠️ <strong>Criterio FUNVISIS Especial:</strong> Al tratarse de una vivienda popular del tipo <strong>Mampostería No Confinada (MMNC)</strong> con 2 o más pisos, el índice de irregularidad <strong>I3 se fuerza automáticamente a 100</strong>, debido a su extrema vulnerabilidad inherente al colapso.
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                        
                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.vigNoAltas}
                            onChange={() => handleCheckboxChange("vigNoAltas")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=1: Ausencia de vigas altas</span>
                            <span className="block text-[9px] text-slate-400">Fuerzas concentradas en losas (+40)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.noMurosUnidir}
                            onChange={() => handleCheckboxChange("noMurosUnidir")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=2: Sin muros en una dirección</span>
                            <span className="block text-[9px] text-slate-400">Inestabilidad en un plano (ej. túnel) (+80)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.fragilidadExtrema}
                            onChange={() => handleCheckboxChange("fragilidadExtrema")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-red-600">j=3: Estructura Frágil</span>
                            <span className="block text-[9px] text-slate-400">Adobe o bloques sin ningún acero (+100)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.entrepisoDebil}
                            onChange={() => handleCheckboxChange("entrepisoDebil")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=4: Entrepiso blando o débil</span>
                            <span className="block text-[9px] text-slate-400">Planta baja libre para estacionamiento (+50)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.columnasCortas}
                            onChange={() => handleCheckboxChange("columnasCortas")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=5: Columnas cortas</span>
                            <span className="block text-[9px] text-slate-400">Ventanas altas obstruyen deformación (+30)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.discontinuidadEjes}
                            onChange={() => handleCheckboxChange("discontinuidadEjes")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=6: Discontinuidad de ejes</span>
                            <span className="block text-[9px] text-slate-400">Columnas desalineadas en vertical (+30)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.aberturasLosas}
                            onChange={() => handleCheckboxChange("aberturasLosas")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=7: Grandes aberturas en losas</span>
                            <span className="block text-[9px] text-slate-400">Hueco de ducto &gt; 20% del área de losa (+10)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.asimetriaRigidez}
                            onChange={() => handleCheckboxChange("asimetriaRigidez")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=8: Asimetría fuerte en planta</span>
                            <span className="block text-[9px] text-slate-400">Núcleo de escaleras a un extremo (+20)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.adosoLosaLosa}
                            onChange={() => handleCheckboxChange("adosoLosaLosa")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=9a: Adosamiento Losa-Losa</span>
                            <span className="block text-[9px] text-slate-400">Choque de losas a misma altura (+10)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.adosoLosaCol}
                            onChange={() => handleCheckboxChange("adosoLosaCol")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=9b: Adosamiento Losa-Columna</span>
                            <span className="block text-[9px] text-slate-400">Colisión destructora losa contra columna (+20)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.plantaIrregular}
                            onChange={() => handleCheckboxChange("plantaIrregular")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=10: Planta en H, T, L o U</span>
                            <span className="block text-[9px] text-slate-400">Esquinas reentrantes vulnerables (+10)</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.irregularidades.elevacionIrregular}
                            onChange={() => handleCheckboxChange("elevacionIrregular")}
                            className="rounded text-blue-600 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800">j=11: Elevación en T / Pirámide</span>
                            <span className="block text-[9px] text-slate-400">Masas crecientes con la altura (+10)</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Profundidad del depósito y efectos topográficos de amenaza */}
                    <div className="bg-amber-50/30 border border-amber-200/50 p-3.5 rounded-xl text-xs space-y-2">
                      <div className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          checked={form.depositoProfundo}
                          onChange={() => handleInputChange("depositoProfundo", !form.depositoProfundo)}
                          className="rounded text-amber-600 mt-0.5"
                          id="chk-deposito-profundo"
                        />
                        <label htmlFor="chk-deposito-profundo" className="cursor-pointer">
                          <strong className="text-slate-850 font-bold block">Profundidad del Depósito (Suelo S3 / I4)</strong>
                          ¿La edificación posee más de 6 pisos y está fundada sobre un depósito profundo de sedimentos (&gt;120 metros de espesor como en Los Palos Grandes o San Bernardino en Caracas)? (+100 en I4)
                        </label>
                      </div>
                    </div>

                  </div>
                )}

                {/* PASO 4: GRADO DE DETERIORO Y AMENAZA REGIONAL */}
                {activeStep === 4 && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display">4. Grado de Deterioro de los Elementos y Amenaza Sísmica</h3>
                      <p className="text-[10px] text-slate-400">Grados de agrietamiento, corrosión del acero de refuerzo, estado de paredes de relleno y nivel de zonificación nacional</p>
                    </div>

                    {/* Calificación de Deterioro Físico */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/30 space-y-1.5 text-xs">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Estructura de Concreto</label>
                        <select
                          value={form.deterioroConcreto}
                          onChange={(e) => handleInputChange("deterioroConcreto", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        >
                          <option value="ninguno">Ninguno / Sin grietas</option>
                          <option value="moderado">Moderado (&lt;2mm / oxidación menor)</option>
                          <option value="severo">Severo (&ge;2mm / corrosión expuesta)</option>
                        </select>
                      </div>

                      <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/30 space-y-1.5 text-xs">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Estructura de Acero</label>
                        <select
                          value={form.deterioroAcero}
                          onChange={(e) => handleInputChange("deterioroAcero", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        >
                          <option value="ninguno">Ninguno / Sin corrosión</option>
                          <option value="moderado">Moderado (corrosión superficial)</option>
                          <option value="severo">Severo (pandeo o fractura en nodos)</option>
                        </select>
                      </div>

                      <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/30 space-y-1.5 text-xs">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Paredes / Tabiquería</label>
                        <select
                          value={form.deterioroParedes}
                          onChange={(e) => handleInputChange("deterioroParedes", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                        >
                          <option value="ninguno">Ninguno / Impecable</option>
                          <option value="moderado">Moderado (&lt;2mm de agrietamiento)</option>
                          <option value="severo">Severo (separación o colapso tabique)</option>
                        </select>
                      </div>
                    </div>

                    <div className="border border-slate-150 rounded-xl p-3 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
                      <div className="space-y-1">
                        <strong className="text-slate-850 font-bold block">Estado General de Mantenimiento</strong>
                        <p className="text-[10px] text-slate-400">Inspección de humedad, filtraciones y conservación del edificio.</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(["bueno", "regular", "bajo"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleInputChange("mantenimientoGeneral", m)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border uppercase cursor-pointer transition ${
                              form.mantenimientoGeneral === m
                                ? "bg-slate-900 text-white border-slate-800"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amenaza Sísmica de la Región de Venezuela */}
                    <div className="bg-blue-50/20 border border-blue-100 p-3.5 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-blue-900 font-display">Zona Sísmica COVENIN 1756</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-500 block">Zonificación Sísmica (0 a 7)</label>
                          <select
                            value={form.zonaSismica}
                            onChange={(e) => handleInputChange("zonaSismica", parseInt(e.target.value))}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white font-mono"
                          >
                            <option value="7">Zona 7 (Ao = 0.40) - Peligro Elevado (Cariaco, Cumaná)</option>
                            <option value="6">Zona 6 (Ao = 0.35) - Peligro Elevado (Sucre, El Pilar)</option>
                            <option value="5">Zona 5 (Ao = 0.30) - Peligro Elevado (Caracas, Valencia, Mérida)</option>
                            <option value="4">Zona 4 (Ao = 0.25) - Peligro Intermedio (San Cristóbal, Barquisimeto)</option>
                            <option value="3">Zona 3 (Ao = 0.20) - Peligro Intermedio</option>
                            <option value="2">Zona 2 (Ao = 0.15) - Peligro Bajo</option>
                            <option value="1">Zona 1 (Ao = 0.10) - Peligro Bajo (Maracaibo, El Baúl)</option>
                            <option value="0">Zona 0 (Ao = 0.00) - Peligro Bajo</option>
                          </select>
                        </div>

                        <div className="space-y-2 pt-4">
                          <label className="flex items-start space-x-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.conEfectosTopograficos}
                              onChange={() => handleInputChange("conEfectosTopograficos", !form.conEfectosTopograficos)}
                              className="rounded text-blue-600 mt-0.5"
                            />
                            <div>
                              <strong className="text-slate-850 font-bold block text-[11px]">Considerar Efectos Topográficos (+10%)</strong>
                              Se amplifica la aceleración local si se ubica en la mitad superior de ladera con pendiente &gt; 20° o cerca de cresta de talud.
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Botones de Navegación del Formulario */}
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex items-center justify-between">
            <button
              onClick={() => setActiveStep(prev => Math.max(prev - 1, 1))}
              disabled={activeStep === 1}
              className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </button>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Paso {activeStep} de 4</span>
            <button
              onClick={() => {
                if (activeStep < 4) {
                  setActiveStep(prev => prev + 1);
                } else {
                  // Generar reporte
                  handleGenerateAIReport();
                }
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition shadow-md shadow-blue-500/10 cursor-pointer"
            >
              {activeStep === 4 ? "Calcular y Auditar con IA" : "Siguiente"}
              {activeStep < 4 ? <ChevronRight className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-yellow-300" />}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESULTADOS MATEMÁTICOS DE LA PLANILLA (5 Columnas) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* PANEL DE COEFICIENTES PARCIALES DE VULNERABILIDAD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 font-display mb-4">Cálculo de Índices FUNVISIS G-20007752-2</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              
              <div className="bg-slate-850/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Antigüedad (I₁)</span>
                <span className="text-sm font-extrabold font-mono text-indigo-400">{i1.toFixed(1)}</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">Peso: 25%</span>
              </div>

              <div className="bg-slate-850/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Tipología (I₂)</span>
                <span className="text-sm font-extrabold font-mono text-indigo-400">{i2.toFixed(1)}</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">Peso: 35%</span>
              </div>

              <div className="bg-slate-850/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Irregularidad (I₃)</span>
                <span className="text-sm font-extrabold font-mono text-indigo-400">{i3.toFixed(1)}</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">Peso: 25%</span>
              </div>

              <div className="bg-slate-850/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Depósito (I₄)</span>
                <span className="text-sm font-extrabold font-mono text-indigo-400">{i4.toFixed(1)}</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">Peso: 7%</span>
              </div>

              <div className="bg-slate-850/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Topografía (I₅)</span>
                <span className="text-sm font-extrabold font-mono text-indigo-400">{i5.toFixed(1)}</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">Peso: 4%</span>
              </div>

              <div className="bg-slate-850/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Deterioro (I₆)</span>
                <span className="text-sm font-extrabold font-mono text-indigo-400">{i6.toFixed(1)}</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">Peso: 4%</span>
              </div>
            </div>

            {/* ÍNDICES INTEGRALES SÍSMICOS */}
            <div className="mt-5 border-t border-slate-800 pt-4 space-y-4">
              
              {/* 1. Vulnerabilidad Global (Iv) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-300">ÍNDICE DE VULNERABILIDAD GLOBAL (Iᵥ)</span>
                  <span className="text-xs font-mono font-bold text-slate-400">Iv = {Iv.toFixed(2)} / 100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      Iv >= 60 ? "bg-red-600" : Iv >= 40 ? "bg-orange-500" : Iv >= 30 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Iv}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Calificación: <strong className="text-white uppercase">{IvLabel}</strong></span>
                  <span className="text-slate-500 font-mono">Pond: sum(α_i * I_i)</span>
                </div>
              </div>

              {/* 2. Coeficientes de Amenaza (Ia) e Importancia (Ii) */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Índice de Amenaza Regional (I_A)</span>
                  <span className="font-mono text-sm font-black text-white">{Ia.toFixed(3)}</span>
                  <span className="text-[9px] text-slate-500 block">COVENIN Zona {form.zonaSismica}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Índice de Importancia (I_I)</span>
                  <span className="font-mono text-sm font-black text-white">{Ii.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-500 block">Grupo {form.grupoUso} (N={N})</span>
                </div>
              </div>

              {/* 3. Indicadores de Decisión: Riesgo (Ir) y Priorización (Ip) */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                
                {/* Riesgo Sísmico */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-center relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ÍNDICE DE RIESGO (I_R)</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-lg font-black font-mono text-red-400">{Ir.toFixed(2)}</span>
                    <span className="text-[9px] text-slate-500">Ir = Ia * Iv</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 block">Riesgo: {IrLabel}</span>
                </div>

                {/* Prioridad de Intervención */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-center relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ÍNDICE PRIORIZACIÓN (I_P)</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-lg font-black font-mono text-yellow-400">{Ip.toFixed(2)}</span>
                    <span className="text-[9px] text-slate-500">Ip = Ir * Ii</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className={`w-2 h-2 rounded-full ${IpBg}`} />
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">{IpPrioridad}: {IpLabel}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* SECCIÓN DEL REPORTE IA DE GEMINI */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs uppercase font-black text-slate-900 tracking-wider font-display">Auditoría Técnica por IA (Gemini 3.5)</h3>
              </div>
              
              {aiReport && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCopyReport}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Copiar Reporte al Portapapeles"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Imprimir Ficha de Inspección"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 min-h-[220px] flex flex-col justify-center">
              {loadingReport ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-10">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="text-xs font-semibold text-slate-700 font-display">Analizando parámetros COVENIN / FUNVISIS con IA...</p>
                  <p className="text-[10px] text-slate-400 text-center max-w-xs">Escribiendo diagnóstico técnico formal de vulnerabilidad regional y priorización...</p>
                </div>
              ) : reportError ? (
                <div className="bg-red-50 text-red-800 rounded-xl p-4 border border-red-200 text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                    Error de Comunicación
                  </p>
                  <p className="text-slate-600">{reportError}</p>
                  <button
                    onClick={handleGenerateAIReport}
                    className="mt-2 bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] hover:bg-red-700 transition"
                  >
                    Reintentar Conexión
                  </button>
                </div>
              ) : aiReport ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 bg-slate-50/30 p-4 rounded-xl border border-slate-100/50 print:max-h-none print:overflow-visible print:bg-white print:p-0 print:border-none">
                  <div className="prose prose-slate max-w-none">
                    {formatMarkdown(aiReport)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-3 text-xs text-slate-500">
                  <div className="bg-slate-50 text-slate-400 p-4 rounded-full border border-slate-200">
                    <FileCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <strong className="text-slate-800 font-display block mb-1">Ficha de Evaluación Lista para Procesar</strong>
                    Configure los datos estructurales del edificio y presione el botón de abajo para generar una auditoría detallada de mitigación sísmica.
                  </div>
                  <button
                    onClick={handleGenerateAIReport}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase py-2.5 px-5 rounded-xl transition duration-200 flex items-center space-x-2 shadow-md hover:shadow-slate-500/10 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    <span>Generar Reporte de IA</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
