import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  MapPin, 
  Sliders, 
  Download, 
  Share2, 
  FileText, 
  Info, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Tipos e Interfaces ---
interface City {
  name: string;
  lat: number;
  lng: number;
}

interface Fault {
  id: string;
  name: string;
  type: string;
  extension: string;
  slipRate: string;
  coordinates: { lat: number; lng: number }[];
  color: string;
  description: string;
}

const CITIES: City[] = [
  { name: "Caracas", lat: 10.50, lng: -66.90 },
  { name: "Mérida", lat: 8.60, lng: -71.14 },
  { name: "Cumaná", lat: 10.45, lng: -64.18 },
  { name: "Barquisimeto", lat: 10.07, lng: -69.32 },
  { name: "Maracaibo", lat: 10.64, lng: -71.64 },
  { name: "San Cristóbal", lat: 7.77, lng: -72.22 },
  { name: "Valencia", lat: 10.16, lng: -68.00 },
  { name: "Puerto La Cruz", lat: 10.22, lng: -64.62 },
  { name: "Maturín", lat: 9.75, lng: -63.18 },
];

const FAULTS: Fault[] = [
  {
    id: "falla-bocono",
    name: "Falla de Boconó",
    type: "Rumbo Dextral (Strike-slip)",
    extension: "~500 km",
    slipRate: "5.2 - 9.0 mm/año",
    color: "#3b82f6", // azul
    description: "Principal accidente sismogénico del occidente del país. Se extiende desde la frontera con Colombia en el Táchira, recorriendo la cordillera de los Andes hasta unirse con la Falla de San Sebastián en Morón.",
    coordinates: [
      { lat: 7.6, lng: -72.4 },
      { lat: 7.77, lng: -72.22 },
      { lat: 8.60, lng: -71.14 },
      { lat: 9.31, lng: -70.60 },
      { lat: 10.07, lng: -69.32 },
      { lat: 10.48, lng: -68.20 }
    ]
  },
  {
    id: "falla-san-sebastian",
    name: "Falla de San Sebastián",
    type: "Rumbo Dextral (Strike-slip)",
    extension: "~360 km",
    slipRate: "3.0 - 5.0 mm/año",
    color: "#a855f7", // violeta
    description: "Zona de falla transcurrente derecha en la plataforma continental norte de Venezuela. Pasa costa afuera frente a Puerto Cabello, La Guaira y empalma al este con la Falla de El Pilar.",
    coordinates: [
      { lat: 10.48, lng: -68.20 },
      { lat: 10.55, lng: -67.50 },
      { lat: 10.60, lng: -66.93 },
      { lat: 10.58, lng: -66.00 },
      { lat: 10.49, lng: -64.50 }
    ]
  },
  {
    id: "falla-el-pilar",
    name: "Falla de El Pilar",
    type: "Rumbo Dextral (Strike-slip)",
    extension: "~350 km",
    slipRate: "9.0 mm/año",
    color: "#ec4899", // rosa
    description: "Falla sismogénica de gran actividad sísmica en el oriente venezolano. Atraviesa el Golfo de Cariaco, la península de Paria e ingresa al norte de la isla de Trinidad.",
    coordinates: [
      { lat: 10.49, lng: -64.50 },
      { lat: 10.45, lng: -64.18 },
      { lat: 10.50, lng: -63.42 },
      { lat: 10.58, lng: -62.50 },
      { lat: 10.65, lng: -61.50 }
    ]
  },
  {
    id: "falla-oca-ancon",
    name: "Sistema de Fallas de Oca-Ancón",
    type: "Rumbo Dextral (Strike-slip)",
    extension: "~250 km",
    slipRate: "0.45 - 2.0 mm/año",
    color: "#f59e0b", // naranja
    description: "Ubicada al noroeste de Venezuela. Cruza la región del Lago de Maracaibo de oeste a este, adentrándose en el estado Falcón. Responsable del sismo de Churuguara.",
    coordinates: [
      { lat: 11.20, lng: -72.30 },
      { lat: 10.90, lng: -71.60 },
      { lat: 11.02, lng: -70.67 },
      { lat: 10.84, lng: -69.53 },
      { lat: 10.50, lng: -68.90 }
    ]
  },
  {
    id: "falla-valera",
    name: "Falla de Valera",
    type: "Rumbo Sinestral (Left-lateral)",
    extension: "~220 km",
    slipRate: "~1.0 mm/año",
    color: "#10b981", // esmeralda
    description: "Falla activa con desplazamiento lateral izquierdo. Se ramifica del sistema de Boconó en los Andes centrales y se dirige hacia el norte en el estado Trujillo.",
    coordinates: [
      { lat: 8.80, lng: -70.80 },
      { lat: 9.30, lng: -70.65 },
      { lat: 9.70, lng: -70.60 },
      { lat: 10.20, lng: -70.40 }
    ]
  },
  {
    id: "falla-la-victoria",
    name: "Falla de La Victoria",
    type: "Rumbo Dextral (Strike-slip)",
    extension: "~100 km",
    slipRate: "0.55 mm/año",
    color: "#ef4444", // rojo
    description: "Ubicada en la cordillera de la Costa meridional, recorriendo los valles de Aragua y del Tuy. Genera sismos superficiales moderados de gran repercusión local en áreas densamente pobladas.",
    coordinates: [
      { lat: 10.10, lng: -68.00 },
      { lat: 10.18, lng: -67.50 },
      { lat: 10.22, lng: -67.00 },
      { lat: 10.35, lng: -66.50 }
    ]
  }
];

// Modelos de velocidad de corteza
interface CrustModel {
  id: string;
  name: string;
  description: string;
  vp: number; // km/s
  vs: number; // km/s
  vr: number; // km/s
  vl: number; // km/s
}

const CRUST_MODELS: CrustModel[] = [
  {
    id: "sedimentos",
    name: "Sedimentos y Suelos Blandos (S3)",
    description: "Velocidades reducidas debido a materiales sueltos. Alta amplificación sísmica.",
    vp: 2.2,
    vs: 1.1,
    vr: 0.99,
    vl: 1.05
  },
  {
    id: "granito",
    name: "Corteza Continental Granítica",
    description: "Rocas cristalinas rígidas. Velocidades medias de la corteza continental promedio.",
    vp: 5.6,
    vs: 3.2,
    vr: 2.88,
    vl: 3.05
  },
  {
    id: "basalto",
    name: "Corteza Profunda Basáltica",
    description: "Rocas máficas muy densas a alta profundidad. Ondas viajan a altas velocidades.",
    vp: 6.8,
    vs: 3.9,
    vr: 3.51,
    vl: 3.70
  }
];

export default function SimuladorSismos() {
  // --- Estados de Simulación ---
  const [epicenter, setEpicenter] = useState<{ lat: number; lng: number }>({ lat: 10.50, lng: -66.90 }); // Caracas por defecto
  const [magnitude, setMagnitude] = useState<number>(6.5);
  const [depth, setDepth] = useState<number>(15);
  const [crustModelId, setCrustModelId] = useState<string>("granito");
  
  // Animación del sismo
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [waveRadius, setWaveRadius] = useState<number>(0);
  
  // Resultados calculados
  const [detectedFault, setDetectedFault] = useState<any>(null);
  const [affectedCities, setAffectedCities] = useState<any[]>([]);

  // Estados de IA
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Modales educativos
  const [showRefModal, setShowRefModal] = useState<boolean>(false);
  
  const mapRef = useRef<SVGSVGElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Conversión geográfica <-> SVG coordenadas
  // Mapa centrado en la mitad norte de Venezuela
  const bounds = {
    lngMin: -73.5,
    lngMax: -59.5,
    latMin: 6.5,
    latMax: 12.5
  };

  const getSVGCoords = (lat: number, lng: number) => {
    const width = 800;
    const height = 450;
    const x = ((lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin)) * width;
    const y = ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * height;
    return { x, y };
  };

  const getGeoCoords = (x: number, y: number) => {
    const width = 800;
    const height = 450;
    const lng = bounds.lngMin + (x / width) * (bounds.lngMax - bounds.lngMin);
    const lat = bounds.latMax - (y / height) * (bounds.latMax - bounds.latMin);
    return { lat: parseFloat(lat.toFixed(2)), lng: parseFloat(lng.toFixed(2)) };
  };

  // Manejar click en mapa SVG
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 800;
    const clickY = ((e.clientY - rect.top) / rect.height) * 450;
    
    // Validar límites
    if (clickX >= 0 && clickX <= 800 && clickY >= 0 && clickY <= 450) {
      const geo = getGeoCoords(clickX, clickY);
      setEpicenter(geo);
      setReportResult(null); // Borrar reporte anterior
      triggerWaveAnimation();
    }
  };

  // Disparar animación de frentes de onda en el mapa
  const triggerWaveAnimation = () => {
    setIsSimulating(true);
    setWaveRadius(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    let startTimestamp: number | null = null;
    const duration = 2500; // 2.5 segundos de viaje de onda visual

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      const percent = Math.min(progress / duration, 1);
      
      setWaveRadius(percent * 350); // Radio máximo de visualización
      
      if (percent < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSimulating(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    triggerWaveAnimation();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epicenter, crustModelId]);

  // --- Fórmulas Físicas Sismológicas ---
  
  // Distancia del círculo máximo usando Haversine (km)
  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Distancia mínima desde el punto a un segmento de línea
  const distToSegment = (p: {lat: number; lng: number}, v: {lat: number; lng: number}, w: {lat: number; lng: number}): number => {
    const l2 = calculateHaversine(v.lat, v.lng, w.lat, w.lng) ** 2;
    if (l2 === 0) return calculateHaversine(p.lat, p.lng, v.lat, v.lng);
    
    // Proyección aproximada en plano local para sismos cercanos
    const t = Math.max(0, Math.min(1, ((p.lng - v.lng) * (w.lng - v.lng) + (p.lat - v.lat) * (w.lat - v.lat)) / ((w.lng - v.lng) ** 2 + (w.lat - v.lat) ** 2)));
    const projectionLat = v.lat + t * (w.lat - v.lat);
    const projectionLng = v.lng + t * (w.lng - v.lng);
    
    return calculateHaversine(p.lat, p.lng, projectionLat, projectionLng);
  };

  // Calcular distancia mínima a una falla
  const distToFault = (epicenterGeo: {lat: number; lng: number}, fault: Fault): number => {
    let minDist = Infinity;
    for (let i = 0; i < fault.coordinates.length - 1; i++) {
      const dist = distToSegment(epicenterGeo, fault.coordinates[i], fault.coordinates[i+1]);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    return minDist;
  };

  // Ejecutar todos los cálculos sísmicos y geológicos cuando cambian los inputs
  useEffect(() => {
    // 1. Detectar Falla Más Cercana
    let closestFaultObj: any = null;
    let minFaultDist = Infinity;
    
    FAULTS.forEach((fault) => {
      const dist = distToFault(epicenter, fault);
      if (dist < minFaultDist) {
        minFaultDist = dist;
        closestFaultObj = {
          ...fault,
          distance: dist
        };
      }
    });

    // Considerar que genera el sismo si está a menos de 75km del plano de falla (o es la más cercana absoluta)
    setDetectedFault(closestFaultObj);

    // 2. Modelo de velocidades de ondas
    const currentCrust = CRUST_MODELS.find(c => c.id === crustModelId) || CRUST_MODELS[1];

    // 3. Estimar impacto en ciudades
    const computedCities = CITIES.map((city) => {
      const epicentralDist = calculateHaversine(epicenter.lat, epicenter.lng, city.lat, city.lng);
      // Distancia Hipocentral D = sqrt(d^2 + h^2)
      const hypocentralDist = Math.sqrt(epicentralDist ** 2 + depth ** 2);
      
      // Tiempos de viaje de ondas (segundos)
      // Ondas corporales usan distancia hipocentral (viajan por el interior)
      const tP = hypocentralDist / currentCrust.vp;
      const tS = hypocentralDist / currentCrust.vs;
      // Ondas superficiales usan distancia epicentral (viajan por la superficie)
      const tR = epicentralDist / currentCrust.vr;
      const tL = epicentralDist / currentCrust.vl;

      // Estimación empírica de PGA (Aceleración pico del terreno en g)
      // PGA = 0.5 * e^(0.75 * (Mw - 6)) / (D + 20)^1.15
      const pga = (0.55 * Math.exp(0.72 * (magnitude - 6.0))) / Math.pow(hypocentralDist + 22, 1.12);

      // Conversión empírica a Intensidad Mercalli Modificada (MMI)
      let mmiStr = "I";
      let damageStr = "Ninguno (Imperceptible)";
      let mmiNum = 1;

      if (pga >= 0.35) {
        mmiStr = "IX - X";
        damageStr = "Pánico general, colapso de viviendas populares/bahareque y daños estructurales severos en edificios sin diseño sismorresistente.";
        mmiNum = 9;
      } else if (pga >= 0.18) {
        mmiStr = "VIII";
        damageStr = "Daños parciales en estructuras sismorresistentes, caída de paredes divisorias, grietas profundas en mampostería.";
        mmiNum = 8;
      } else if (pga >= 0.08) {
        mmiStr = "VII";
        damageStr = "Alarma general, dificultades para mantenerse en pie. Grietas leves en paredes, caídas de tejas y cornisas.";
        mmiNum = 7;
      } else if (pga >= 0.04) {
        mmiStr = "VI";
        damageStr = "Sentido por todos. Temor general, desplazamiento de muebles pesados, caída de vajillas, fisuras leves en frisos.";
        mmiNum = 6;
      } else if (pga >= 0.02) {
        mmiStr = "V";
        damageStr = "Despierta a la mayoría. Objetos colgantes oscilan fuertemente, caída de objetos inestables, animales nerviosos.";
        mmiNum = 5;
      } else if (pga >= 0.008) {
        mmiStr = "IV";
        damageStr = "Sentido en interiores. Vibración similar al paso de un camión pesado, platos y ventanas vibran.";
        mmiNum = 4;
      } else if (pga >= 0.003) {
        mmiStr = "II - III";
        damageStr = "Sentido levemente por personas en reposo en pisos superiores. Balanceo suave de lámparas.";
        mmiNum = 2;
      }

      return {
        ...city,
        distance: epicentralDist,
        hypocentralDist,
        arrivalTimes: {
          p: tP,
          s: tS,
          r: tR,
          l: tL
        },
        pga,
        estimatedIntensity: mmiStr,
        mmiVal: mmiNum,
        damageEstimate: damageStr
      };
    });

    // Ordenar ciudades por distancia (las más cercanas primero)
    computedCities.sort((a, b) => a.distance - b.distance);
    setAffectedCities(computedCities);

  }, [epicenter, magnitude, depth, crustModelId]);

  // --- Generación de Reporte con IA ---
  const handleGenerateAIReport = async () => {
    setGeneratingReport(true);
    setReportResult(null);
    setReportError(null);

    const currentCrust = CRUST_MODELS.find(c => c.id === crustModelId) || CRUST_MODELS[1];

    try {
      const response = await fetch("/api/generate-simulation-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          magnitude,
          depth,
          crustMaterial: currentCrust.name,
          waveVelocities: {
            p: currentCrust.vp,
            s: currentCrust.vs,
            r: currentCrust.vr,
            l: currentCrust.vl
          },
          detectedFault: detectedFault ? {
            name: detectedFault.name,
            type: detectedFault.type,
            slipRate: detectedFault.slipRate,
            extension: detectedFault.extension,
            distance: detectedFault.distance
          } : null,
          affectedCities: affectedCities.slice(0, 4).map(c => ({
            name: c.name,
            distance: c.distance,
            arrivalTimes: c.arrivalTimes,
            estimatedIntensity: c.estimatedIntensity,
            damageEstimate: c.damageEstimate
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al conectar con Gemini.");
      }

      setReportResult(data.report);
    } catch (err: any) {
      console.error(err);
      setReportError(err.message || "Fallo en la comunicación con el servicio de IA.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // --- Descargas ---
  const downloadReportText = () => {
    if (!reportResult) return;
    const currentCrust = CRUST_MODELS.find(c => c.id === crustModelId) || CRUST_MODELS[1];
    
    const content = `
========================================================================
             REPORTE TÉCNICO - SIMULADOR SISMOLÓGICO EDUCATIVO
                      FUNVISIS & SISMORISK LATAM
========================================================================
Fecha de Simulación: ${new Date().toLocaleDateString()}
Coordenadas Epicentro: Latitud ${epicenter.lat}°, Longitud ${epicenter.lng}°
Magnitud de Momento (Mw): ${magnitude}
Profundidad Focal (Hipocentro): ${depth} km

Modelo Geológico: ${currentCrust.name}
Velocidades de propagación de onda estimadas:
 - Onda P (Primaria): ${currentCrust.vp} km/s
 - Onda S (Secundaria): ${currentCrust.vs} km/s
 - Onda Rayleigh (R): ${currentCrust.vr} km/s
 - Onda Love (L): ${currentCrust.vl} km/s

------------------------------------------------------------------------
FALLA SISMOGÉNICA DETECTADA:
------------------------------------------------------------------------
Nombre: ${detectedFault ? detectedFault.name : "No se detectaron fallas principales en un radio cercano"}
Tipo de falla (Neotectónica): ${detectedFault ? detectedFault.type : "N/A"}
Tasa de deslizamiento (Slip rate): ${detectedFault ? detectedFault.slipRate : "N/A"}
Extensión probable: ${detectedFault ? detectedFault.extension : "N/A"}
Distancia al Epicentro: ${detectedFault ? detectedFault.distance.toFixed(2) + " km" : "N/A"}

------------------------------------------------------------------------
TIEMPOS DE VIAJE Y DAÑOS EN POBLACIONES (CIUDADES MÁS CERCANAS):
------------------------------------------------------------------------
${affectedCities.slice(0, 5).map(c => `
* Ciudad: ${c.name}
  - Distancia epicentral: ${c.distance.toFixed(1)} km
  - Tiempo de arribo Onda P: ${c.arrivalTimes.p.toFixed(2)} seg
  - Tiempo de arribo Onda S: ${c.arrivalTimes.s.toFixed(2)} seg
  - Intensidad Estimada (Mercalli): ${c.estimatedIntensity}
  - Efectos y Daños Estimados: ${c.damageEstimate}
`).join("\n")}

========================================================================
INFORME SISMOLÓGICO DE IA (GEMINI 3.5 FLASH):
========================================================================
${reportResult}

------------------------------------------------------------------------
Este documento tiene fines educativos e ilustrativos. Basado en datos geológicos
reales provistos por la literatura científica de FUNVISIS.
========================================================================
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SismoRisk_Simulacion_Mw${magnitude}_Ve.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Descarga del resumen del libro en PDF/Markdown
  const downloadBookSummary = () => {
    const content = `
# La Investigación Sismológica en Venezuela - Resumen de Prevención FUNVISIS

Este material ha sido compilado a partir del texto educativo oficial de la Fundación Venezolana de Investigaciones Sismológicas (FUNVISIS) para promover la cultura sísmica en la población escolar y general de la República Bolivariana de Venezuela.

---

## 1. La Sismología y su Origen en Venezuela
La sismología es la ciencia de la agitación de la Tierra. El gran terremoto de Lisboa en 1755 marcó el inicio de la sismología científica moderna. En Venezuela, los pioneros incluyen a Arístides Rojas, Melchor Centeno Graü (padre de la investigación sísmica nacional con su catálogo general de sismos de 1530-1939) y el geólogo Günther Fiedler, quien impulsó las redes telemétricas a partir de 1955.

A raíz del trágico Terremoto de Caracas de 1967 (Magnitud 6.5, 240+ víctimas, colapso de edificios modernos en Caraballeda y Altamira), el Estado Venezolano fundó formalmente FUNVISIS el 27 de julio de 1972 con el objetivo de planificar y realizar investigaciones sismotectónicas y de sismorresistencia.

---

## 2. Contexto Geodinámico y Sistemas de Fallas
Venezuela está ubicada en la zona de interacción de dos placas tectónicas principales: la placa del **Caribe** y la placa **Sudamericana**. El movimiento de rumbo hacia el este de la placa Caribe respecto a la Sudamericana genera un sistema de deformación activa de aproximadamente 100 km de ancho que alberga las tres fallas principales:

1. **Falla de Boconó (Región Andina)**: Recorre unos 500 km con rumbo SW-NE. Es la falla de mayor tasa de movimiento (hasta 9.0 mm/año) y generadora de sismos históricos catastróficos (1610, 1812, 1894).
2. **Falla de San Sebastián (Región Central / Costera)**: Falla de rumbo dextral costa afuera que pasa frente a Caraballeda y La Guaira. Tasa de movimiento: 3.0 - 5.0 mm/año.
3. **Falla de El Pilar (Región Oriental)**: Cruza longitudinalmente el estado Sucre y el Golfo de Cariaco. Tasa de movimiento de 9.0 mm/año. Causa de los terremotos de Cumaná y del sismo de Cariaco en 1997.

Existen otros accidentes sismogénicos menores de gran importancia local como las fallas de Oca-Ancón (Falcón/Zulia), Valera (Trujillo), La Victoria (Aragua/Miranda), Morón y Tacagua-El Ávila.

---

## 3. Tipos de Ondas Sísmicas
Las vibraciones sísmicas se propagan en forma de ondas elásticas y se clasifican en:

* **Ondas Corpóreas (Viajan por el interior terrestre)**:
  * **Ondas P (Primarias / Longitudinales)**: Son las más rápidas en arribar. Comprimen y dilatan el terreno en la dirección de propagación. Su ruido asemeja a una estampida sónica.
  * **Ondas S (Secundarias / Transversales)**: Más lentas que las P. Sacuden el suelo perpendicularmente a la dirección de propagación de un lado al otro. No se propagan por líquidos.
* **Ondas Superficiales (Viajan por la superficie terrestre y causan el mayor daño a construcciones)**:
  * **Ondas Love (L)**: Sacuden el suelo en plano horizontal de lado a lado. Viajan más rápido que las Rayleigh.
  * **Ondas Rayleigh (R)**: Provocan un movimiento elíptico en plano vertical (similar a las olas del mar).

---

## 4. Ingeniería Sismorresistente y Prevención (Aula Sísmica)
La sismorresistencia no busca evitar el sismo, sino dotar a las estructuras de ductilidad, simetría y continuidad estructural para proteger la vida de las personas y evitar el colapso.

### Normas Fundamentales ante un Evento (Aula Sísmica "Madeleilis Guzmán"):
1. **Antes del Sismo**:
   * Identificar y corregir elementos vulnerables en la edificación.
   * Diseñar planes de desalojo escolar, familiar y comunitario.
   * Mantener un kit de primeros auxilios y una mochila de emergencia.
2. **Durante el Sismo**:
   * Mantener la calma y evitar salir corriendo presas del pánico.
   * **Protegerse**: Adoptar la posición bajo mesas de soporte fuerte ("Autoprotección bajo pupitres/mesas").
   * Alejarse de ventanas, vidrieras, lámparas y armarios altos.
3. **Después del Sismo**:
   * Desalojar el inmueble en orden hacia zonas seguras/puntos de encuentro preestablecidos.
   * Cerrar llaves de paso de gas y agua y desconectar interruptores eléctricos para prevenir incendios.
   * Colaborar de forma ordenada con las brigadas de protección civil y rescate.

---
FUNVISIS - Fundación Venezolana de Investigaciones Sismológicas
Adscrito al Ministerio de Ciencia y Tecnología | www.funvisis.org.ve
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "FUNVISIS_La_Investigacion_Sismologica_Venezuela_Resumen.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Coordenadas en píxeles del epicentro en el mapa
  const epiPixel = getSVGCoords(epicenter.lat, epicenter.lng);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 p-4 lg:p-6 space-y-6">
      
      {/* Cabecera Técnica */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <h1 className="text-xl lg:text-2xl font-black uppercase tracking-wider font-display text-white">
              Simulador Sísmico Educativo
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Simula sismos virtuales en Venezuela usando coordenadas geográficas, detecta fallas neotectónicas activas y calcula velocidades de propagación de ondas reales.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowRefModal(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-800 transition cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
            <span>Guía Geológica & FUNVISIS</span>
          </button>
          
          <button
            onClick={downloadBookSummary}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-900/10"
            title="Descargar resumen de La Investigación Sismológica en Venezuela"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar Material</span>
          </button>
        </div>
      </div>

      {/* Grid Principal del Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL IZQUIERDO: CONFIGURACIÓN E INPUTS (4 columnas) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Parámetros del Sismo */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="h-4.5 w-4.5 text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Parámetros del Foco Sísmico</h2>
            </div>

            {/* Slider Magnitud */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Magnitud de Momento (M<sub>w</sub>)</span>
                <span className="font-mono font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded text-sm">
                  {magnitude.toFixed(1)} Mw
                </span>
              </div>
              <input 
                type="range" 
                min="3.0" 
                max="9.0" 
                step="0.1" 
                value={magnitude}
                onChange={(e) => {
                  setMagnitude(parseFloat(e.target.value));
                  setReportResult(null);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>3.0 (Leve)</span>
                <span>6.0 (Moderado)</span>
                <span>7.5 (Severo)</span>
                <span>9.0 (Catastrófico)</span>
              </div>
            </div>

            {/* Slider Profundidad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Profundidad del Foco (Hipocentro)</span>
                <span className="font-mono font-bold text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded text-sm">
                  {depth} km
                </span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="180" 
                step="1" 
                value={depth}
                onChange={(e) => {
                  setDepth(parseInt(e.target.value));
                  setReportResult(null);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Superficial (&lt;70 km)</span>
                <span>Intermedio (70-150 km)</span>
              </div>
            </div>

            {/* Selección de Material de Corteza */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium block">
                Composición Geológica de la Corteza
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CRUST_MODELS.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => {
                      setCrustModelId(model.id);
                      setReportResult(null);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      crustModelId === model.id
                        ? "bg-blue-650/15 border-blue-500 text-white"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{model.name}</span>
                      {crustModelId === model.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">{model.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Inputs Numéricos Lat / Lng */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block uppercase">Latitud (Norte)</label>
                <input 
                  type="number"
                  min={bounds.latMin}
                  max={bounds.latMax}
                  step="0.01"
                  value={epicenter.lat}
                  onChange={(e) => {
                    const lat = Math.max(bounds.latMin, Math.min(bounds.latMax, parseFloat(e.target.value) || bounds.latMin));
                    setEpicenter(prev => ({ ...prev, lat }));
                    setReportResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block uppercase">Longitud (Oeste)</label>
                <input 
                  type="number"
                  min={bounds.lngMin}
                  max={bounds.lngMax}
                  step="0.01"
                  value={epicenter.lng}
                  onChange={(e) => {
                    const lng = Math.max(bounds.lngMin, Math.min(bounds.lngMax, parseFloat(e.target.value) || bounds.lngMin));
                    setEpicenter(prev => ({ ...prev, lng }));
                    setReportResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal italic">
              * Nota: Puedes colocar el epicentro haciendo clic directamente sobre el mapa de la derecha.
            </p>
          </div>

          {/* Velocidades de Onda */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="h-4.5 w-4.5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Velocidades de Onda Sísmica</h2>
            </div>
            
            {(() => {
              const currentCrust = CRUST_MODELS.find(c => c.id === crustModelId) || CRUST_MODELS[1];
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Ondas Primarias (P)</p>
                    <p className="text-lg font-black font-mono text-blue-400 mt-1">{currentCrust.vp.toFixed(2)} <span className="text-[10px] font-bold">km/s</span></p>
                    <p className="text-[9px] text-slate-500 leading-tight mt-1">Ondas de compresión. Viajan más rápido por rocas sólidas.</p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Ondas Secundarias (S)</p>
                    <p className="text-lg font-black font-mono text-indigo-400 mt-1">{currentCrust.vs.toFixed(2)} <span className="text-[10px] font-bold">km/s</span></p>
                    <p className="text-[9px] text-slate-500 leading-tight mt-1">Corte transversal. No viajan en agua o fluidos.</p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Ondas Rayleigh (R)</p>
                    <p className="text-lg font-black font-mono text-pink-400 mt-1">{currentCrust.vr.toFixed(2)} <span className="text-[10px] font-bold">km/s</span></p>
                    <p className="text-[9px] text-slate-500 leading-tight mt-1">Onda superficial. Movimiento elíptico en plano vertical.</p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Ondas Love (L)</p>
                    <p className="text-lg font-black font-mono text-rose-400 mt-1">{currentCrust.vl.toFixed(2)} <span className="text-[10px] font-bold">km/s</span></p>
                    <p className="text-[9px] text-slate-500 leading-tight mt-1">Onda superficial. Desplazamiento de cizalla horizontal.</p>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

        {/* PANEL DERECHO: VISUALIZACIÓN DE MAPA Y RESULTADOS (8 columnas) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Visualización del Mapa Geológico SVG */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-lg relative overflow-hidden flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3.5 mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Mapa Geotectónico e Fallas de Venezuela</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Epicentro</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-blue-500 inline-block" />
                  <span>Falla de Boconó</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-pink-500 inline-block" />
                  <span>Falla de El Pilar</span>
                </div>
              </div>
            </div>

            {/* Contenedor del Mapa SVG */}
            <div className="relative w-full max-w-[800px] border border-slate-850 rounded-xl bg-slate-950 overflow-hidden cursor-crosshair">
              
              {/* Grilla / Graticule de fondo */}
              <div className="absolute inset-0 pointer-events-none opacity-20 border border-dashed border-slate-800 flex flex-col justify-between p-2 font-mono text-[9px] text-slate-500">
                <div className="flex justify-between"><span>12° N</span><span>10° N</span><span>8° N</span></div>
                <div className="flex justify-between"><span>-72° O</span><span>-66° O</span><span>-60° O</span></div>
              </div>

              <svg 
                ref={mapRef}
                viewBox="0 0 800 450" 
                onClick={handleMapClick}
                className="w-full h-auto select-none"
              >
                {/* Dibujo simplificado de la línea de costa venezolana e islas */}
                {/* Península de la Guajira, Golfo de Venezuela, Paraguaná, Costa Central, Península de Araya/Paria y Delta */}
                <path 
                  d="M 50 150 L 100 135 L 140 160 L 145 190 L 175 190 L 170 120 L 225 140 L 270 160 L 320 190 L 390 198 L 460 200 L 530 202 L 565 210 L 585 200 L 635 195 L 685 192 L 720 220 L 760 260 L 780 320 L 790 380 L 700 380 L 600 380 L 500 380 L 400 380 L 300 380 L 200 380 L 100 380 L 50 350 L 50 150 Z" 
                  fill="#1e293b" 
                  fillOpacity="0.45"
                  stroke="#334155" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Lago de Maracaibo */}
                <ellipse cx="140" cy="220" rx="20" ry="30" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                
                {/* Límite de Placas Caribe - Sudamericana */}
                <path 
                  d="M 40 100 Q 250 85 450 110 T 780 125" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                  opacity="0.6"
                />
                
                {/* Dibujo de las Fallas Sismogénicas */}
                {FAULTS.map((fault) => {
                  const points = fault.coordinates.map(c => getSVGCoords(c.lat, c.lng));
                  const pathD = points.reduce((acc, p, idx) => {
                    return acc + `${idx === 0 ? "M" : "L"} ${p.x} ${p.y} `;
                  }, "");
                  
                  // Resaltar si es la falla causante detectada
                  const isDetected = detectedFault && detectedFault.id === fault.id;

                  return (
                    <g key={fault.id}>
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke={fault.color} 
                        strokeWidth={isDetected ? "5.5" : "2.5"} 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                        opacity={isDetected ? "1.0" : "0.55"}
                      />
                      {/* Efecto resplandor en falla activa */}
                      {isDetected && (
                        <path 
                          d={pathD} 
                          fill="none" 
                          stroke={fault.color} 
                          strokeWidth="12" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          opacity="0.25"
                          className="animate-pulse"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Dibujo de Ciudades en el Mapa */}
                {CITIES.map((city) => {
                  const coords = getSVGCoords(city.lat, city.lng);
                  return (
                    <g key={city.name} className="group cursor-default">
                      <circle 
                        cx={coords.x} 
                        cy={coords.y} 
                        r="4" 
                        fill="#ffffff" 
                        stroke="#1e293b" 
                        strokeWidth="1.5"
                      />
                      <text 
                        x={coords.x + 7} 
                        y={coords.y + 4} 
                        fill="#94a3b8" 
                        fontSize="9" 
                        fontWeight="bold" 
                        fontFamily="sans-serif"
                        className="pointer-events-none opacity-80"
                      >
                        {city.name}
                      </text>
                    </g>
                  );
                })}

                {/* Animación del Frente de Ondas (Onda P y S) */}
                {isSimulating && (
                  <g>
                    {/* Frente Onda P (Rápido, color azul) */}
                    <circle 
                      cx={epiPixel.x} 
                      cy={epiPixel.y} 
                      r={waveRadius} 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="2" 
                      opacity={Math.max(0, 1 - waveRadius / 350)}
                      pointerEvents="none"
                    />
                    {/* Frente Onda S (Lento, color púrpura) */}
                    <circle 
                      cx={epiPixel.x} 
                      cy={epiPixel.y} 
                      r={waveRadius * 0.6} 
                      fill="none" 
                      stroke="#a855f7" 
                      strokeWidth="2.5" 
                      opacity={Math.max(0, 1 - (waveRadius * 0.6) / 350)}
                      pointerEvents="none"
                    />
                  </g>
                )}

                {/* Epicentro del Sismo */}
                <g>
                  <circle 
                    cx={epiPixel.x} 
                    cy={epiPixel.y} 
                    r="8" 
                    fill="#ef4444" 
                    opacity="0.3"
                    className="animate-ping"
                    pointerEvents="none"
                  />
                  <circle 
                    cx={epiPixel.x} 
                    cy={epiPixel.y} 
                    r="4" 
                    fill="#ef4444" 
                    stroke="#ffffff" 
                    strokeWidth="1.5"
                    pointerEvents="none"
                  />
                </g>
              </svg>
            </div>
            
            <div className="w-full flex items-center justify-between text-[10px] text-slate-500 mt-2 px-2">
              <span>Haga clic sobre el mapa para modificar el epicentro del sismo simulado.</span>
              <span className="font-mono">Epicentro actual: Lat {epicenter.lat}°, Lng {epicenter.lng}°</span>
            </div>
          </div>

          {/* Resultados de la Falla Geológica y Tiempos de Onda */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Falla Detectada (5 columnas) */}
            <div className="md:col-span-5 bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                  <ShieldAlert className="h-4.5 w-4.5 text-yellow-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">Falla Activa Causante</h2>
                </div>

                {detectedFault ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Nombre del Sistema</p>
                      <p className="text-sm font-extrabold text-white mt-0.5">{detectedFault.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Tipo de Mecanismo de Falla</p>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">{detectedFault.type}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Slip Rate</p>
                        <p className="text-xs text-blue-400 font-bold font-mono mt-0.5">{detectedFault.slipRate}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Extensión Total</p>
                        <p className="text-xs text-indigo-400 font-bold font-mono mt-0.5">{detectedFault.extension}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Distancia al Epicentro</p>
                      <p className="text-xs text-amber-400 font-extrabold font-mono mt-0.5">
                        {detectedFault.distance.toFixed(1)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Descripción Geológica</p>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">{detectedFault.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Coloque el epicentro en el mapa para realizar la detección sismotectónica.</p>
                )}
              </div>
            </div>

            {/* Tiempos de Viaje a Poblaciones (7 columnas) */}
            <div className="md:col-span-7 bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 shadow-lg">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
                <Activity className="h-4.5 w-4.5 text-blue-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Tiempos de Viaje e Intensidad</h2>
              </div>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {affectedCities.slice(0, 5).map((city) => (
                  <div key={city.name} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850/80 flex items-center justify-between text-xs gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{city.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono">({city.distance.toFixed(0)} km)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 text-[9px] text-slate-400 font-mono mt-1">
                        <span>Onda P: <strong className="text-blue-400">{city.arrivalTimes.p.toFixed(2)}s</strong></span>
                        <span>Onda S: <strong className="text-indigo-400">{city.arrivalTimes.s.toFixed(2)}s</strong></span>
                        <span>Onda R: <strong className="text-pink-400">{city.arrivalTimes.r.toFixed(2)}s</strong></span>
                        <span>Onda L: <strong className="text-rose-400">{city.arrivalTimes.l.toFixed(2)}s</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        city.mmiVal >= 8 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                          : city.mmiVal >= 6 
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                          : city.mmiVal >= 4 
                          ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" 
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        Mercalli: {city.estimatedIntensity}
                      </div>
                      <p className="text-[8px] text-slate-500 font-mono mt-1">PGA: {city.pga.toFixed(3)}g</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sección de Estimación de Daños con IA */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-lg print:border-none print:bg-white print:text-black">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2 print:hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Estimación Inteligente de Daños y RRD</h2>
              </div>
              
              <button
                onClick={handleGenerateAIReport}
                disabled={generatingReport}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
              >
                {generatingReport ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Calculando con IA...</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-3.5 w-3.5" />
                    <span>Calcular Daños y Escenario RRD (IA)</span>
                  </>
                )}
              </button>
            </div>

            {/* Espacio para el Reporte de IA */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 min-h-[150px] max-h-[500px] overflow-y-auto print:bg-white print:border-none print:text-black print:max-h-none">
              
              {generatingReport && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-slate-500">
                    Sismólogo de IA evaluando fallas activas y densidad de población por proximidad...
                  </p>
                </div>
              )}

              {!generatingReport && !reportResult && !reportError && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 space-y-2">
                  <AlertTriangle className="h-8 w-8 text-slate-700" />
                  <p className="text-xs max-w-md">
                    Haz clic en el botón de arriba para generar una simulación detallada con Inteligencia Artificial (Gemini 3.5 Flash) que estimará los daños y riesgos civiles para las poblaciones cercanas.
                  </p>
                </div>
              )}

              {reportError && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-500">
                  <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Error en Simulación IA</p>
                  <p className="mt-1 leading-normal">{reportError}</p>
                </div>
              )}

              {reportResult && (
                <div className="space-y-4 text-xs lg:text-sm text-slate-300 leading-relaxed prose prose-invert max-w-none print:text-black">
                  
                  {/* Botones de Descarga en el propio reporte para el usuario */}
                  <div className="flex items-center justify-end gap-2 border-b border-slate-800 pb-3 mb-3 print:hidden">
                    <button 
                      onClick={downloadReportText}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      Descargar Reporte (.TXT)
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileText className="h-3 w-3 text-indigo-400" />
                      Imprimir / Guardar PDF
                    </button>
                  </div>

                  <div className="markdown-body whitespace-pre-line font-sans">
                    {reportResult}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* MODAL DE GUÍA GEOLÓGICA Y DETALLES DE FALLAS */}
      <AnimatePresence>
        {showRefModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  <h3 className="text-md lg:text-lg font-bold text-white uppercase tracking-wider">Guía de Fallas Geológicas de Venezuela</h3>
                </div>
                <button 
                  onClick={() => setShowRefModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-xs p-1 cursor-pointer"
                >
                  ✕ Cerrar
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-normal">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                  <h4 className="font-extrabold text-white text-sm">¿Cómo ocurren los sismos en Venezuela?</h4>
                  <p>
                    Venezuela se encuentra ligada a un contexto geodinámico complejo producto de la interacción de la Placa del Caribe y la Placa Sudamericana. El desplazamiento lateral derecho (dextral) de la Placa del Caribe a una velocidad promedio de 12.7 mm/año genera deformaciones extremas en la corteza terrestre del norte del país, liberando energía en forma de sismos a lo largo de fallas activas.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <h4 className="font-bold text-white text-xs uppercase border-b border-slate-850 pb-1.5">Sistemas de Fallas Principales</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-xs font-black text-blue-400">Falla de Boconó (Andes)</span>
                      <p className="text-[10px] text-slate-400">Falla de rumbo dextral. Conecta desde Táchira hasta Yaracuy. Slip rate de 5.2 a 9.0 mm/año. Responsable del gran terremoto de los Andes de 1894 y de El Tocuyo en 1950.</p>
                    </div>
                    <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-xs font-black text-pink-400">Falla de El Pilar (Oriente)</span>
                      <p className="text-[10px] text-slate-400">Falla de rumbo dextral que atraviesa Sucre e ingresa a Trinidad. Slip rate de 9.0 mm/año. Responsable de sismos destructores en Cumaná (1530, 1929) y el Terremoto de Cariaco (1997).</p>
                    </div>
                    <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-xs font-black text-purple-400">Falla de San Sebastián (Costera)</span>
                      <p className="text-[10px] text-slate-400">Falla de rumbo dextral costa afuera frente a la región central. Conecta Boconó y El Pilar. Causó el devastador Terremoto de Caracas en 1967 (Mw 6.5).</p>
                    </div>
                    <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-xs font-black text-emerald-400">Falla de Valera (Andes Centrales)</span>
                      <p className="text-[10px] text-slate-400">Falla transcurrente sinestral (izquierda). Se ramifica de Boconó. Con una extensión de ~220 km y slip rate de 1.0 mm/año.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/5 border border-yellow-500/10 p-3.5 rounded-xl space-y-1.5">
                  <h4 className="font-extrabold text-yellow-500 text-xs flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Propósitos Educativos - Aula Sísmica
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Este simulador utiliza modelos simplificados de distancia epicentral e hipocentral para calcular la propagación de ondas elásticas. Tiene fines pedagógicos para familiarizar a los estudiantes con la física sísmica, la relación de neotectónica e ingeniería de mitigación, bajo el lineamiento preventivo de FUNVISIS y el programa "Aula Sísmica Madeleilis Guzmán".
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end">
                <button
                  onClick={() => setShowRefModal(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
