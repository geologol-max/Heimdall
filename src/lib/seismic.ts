/**
 * SismoRisk LATAM - Motor de Cálculo de Dinámica Estructural y Espectros Sísmicos
 * Basado en las normativas:
 * - Chile: NCh433 Of.1996 Mod.2012 (Diseño Sísmico de Edificios)
 * - Colombia: NSR-10 (Normas Sismorresistentes Colombianas)
 * - Perú: E.030 2018 (Diseño Sismorresistente)
 */

export interface SoilType {
  code: string;
  name: string;
  factorS: number;
  tp?: number; // Para E.030 / NSR-10
  tl?: number; // Para E.030 / NSR-10
  t0Ch?: number; // Para NCh433
  tpCh?: number; // Para NCh433
  pCh?: number; // Para NCh433
}

export interface SeismicZone {
  code: string;
  name: string;
  value: number; // PGA de diseño (g)
  vValue?: number; // Para NSR-10 (Av)
}

export interface CountryNorm {
  code: string;
  name: string;
  normName: string;
  zones: SeismicZone[];
  soils: SoilType[];
  driftLimit: {
    frame: number;     // Pórticos de Concreto/Acero
    shearWall: number; // Muros de Hormigón Armado
    masonry: number;   // Mampostería Confinada/No Reforzada
    adobe: number;     // Adobe/Madera
  };
}

// Base de Datos Multinorma Latinoamericana
export const countryNorms: Record<string, CountryNorm> = {
  PE: {
    code: "PE",
    name: "Perú",
    normName: "E.030 (2018)",
    zones: [
      { code: "Z4", name: "Zona 4 (Alta Sismicidad - Costa)", value: 0.45 },
      { code: "Z3", name: "Zona 3 (Sismicidad Intermedia - Sierra)", value: 0.35 },
      { code: "Z2", name: "Zona 2 (Sismicidad Moderada - Selva Alta)", value: 0.25 },
      { code: "Z1", name: "Zona 1 (Baja Sismicidad - Selva Baja)", value: 0.10 },
    ],
    soils: [
      { code: "S0", name: "Roca Dura (S0)", factorS: 0.80, tp: 0.3, tl: 3.0 },
      { code: "S1", name: "Roca o Suelo Rígido (S1)", factorS: 1.00, tp: 0.4, tl: 2.5 },
      { code: "S2", name: "Suelo Intermedio (S2)", factorS: 1.05, tp: 0.6, tl: 2.0 }, // Factor S varía por zona en E.030, usamos promedio o simplificado
      { code: "S3", name: "Suelo Blando / Flexible (S3)", factorS: 1.10, tp: 1.0, tl: 1.6 },
    ],
    driftLimit: {
      frame: 0.007,
      shearWall: 0.006,
      masonry: 0.005,
      adobe: 0.010,
    }
  },
  CL: {
    code: "CL",
    name: "Chile",
    normName: "NCh433 (Of.1996 Mod.2012)",
    zones: [
      { code: "Z3", name: "Zona 3 (Alta Sismicidad - Costa)", value: 0.40 },
      { code: "Z2", name: "Zona 2 (Sismicidad Moderada - Depresión Intermedia)", value: 0.30 },
      { code: "Z1", name: "Zona 1 (Baja Sismicidad - Cordillera)", value: 0.20 },
    ],
    soils: [
      { code: "A", name: "Roca, suelo muy firme (A)", factorS: 0.90, t0Ch: 0.15, tpCh: 0.20, pCh: 2.0 },
      { code: "B", name: "Suelo firme o roca blanda (B)", factorS: 1.00, t0Ch: 0.30, tpCh: 0.35, pCh: 1.5 },
      { code: "C", name: "Suelo de rigidez media (C)", factorS: 1.05, t0Ch: 0.40, tpCh: 0.45, pCh: 1.5 },
      { code: "D", name: "Suelo blando o flexible (D)", factorS: 1.20, t0Ch: 0.75, tpCh: 0.85, pCh: 1.0 },
      { code: "E", name: "Suelos especiales de gran espesor (E)", factorS: 1.30, t0Ch: 1.20, tpCh: 1.35, pCh: 1.0 },
    ],
    driftLimit: {
      frame: 0.002, // En Chile se usa deriva de centro de masas severamente limitada en diseño de servicio
      shearWall: 0.002,
      masonry: 0.0015,
      adobe: 0.005,
    }
  },
  CO: {
    code: "CO",
    name: "Colombia",
    normName: "NSR-10 (y actualización NSR-25)",
    zones: [
      { code: "Alta", name: "Sismicidad Alta (Cali / Bucaramanga)", value: 0.25, vValue: 0.25 },
      { code: "Intermedia", name: "Sismicidad Intermedia (Bogotá / Medellín)", value: 0.15, vValue: 0.20 },
      { code: "Baja", name: "Sismicidad Baja (Barranquilla / Cartagena)", value: 0.05, vValue: 0.05 },
    ],
    soils: [
      { code: "A", name: "Perfil de roca competente (A)", factorS: 0.80, tp: 0.1, tl: 0.4 },
      { code: "B", name: "Perfil de roca medianamente densa (B)", factorS: 1.00, tp: 0.15, tl: 0.5 },
      { code: "C", name: "Perfil de suelo muy denso o roca blanda (C)", factorS: 1.20, tp: 0.25, tl: 1.0 },
      { code: "D", name: "Perfil de suelo rígido / intermedio (D)", factorS: 1.50, tp: 0.35, tl: 1.2 },
      { code: "E", name: "Perfil de suelo blando o arcillas (E)", factorS: 2.00, tp: 0.5, tl: 1.5 },
    ],
    driftLimit: {
      frame: 0.010, // Límite de deriva del 1.0% en NSR-10
      shearWall: 0.010,
      masonry: 0.005,
      adobe: 0.010,
    }
  },
  VE: {
    code: "VE",
    name: "Venezuela",
    normName: "COVENIN 1756:2001",
    zones: [
      { code: "H7", name: "Zona 7 (Alta - Cumaná / Güiria)", value: 0.40 },
      { code: "H5", name: "Zona 5 (Alta Intermedia - Caracas / Mérida)", value: 0.30 },
      { code: "H3", name: "Zona 3 (Moderada - Barquisimeto)", value: 0.20 },
      { code: "H1", name: "Zona 1 (Baja - Maracaibo)", value: 0.10 },
    ],
    soils: [
      { code: "S1", name: "Roca o Suelo Duro (S1)", factorS: 1.00, tp: 0.25, tl: 1.0 },
      { code: "S2", name: "Suelo Rígido / Denso (S2)", factorS: 1.15, tp: 0.40, tl: 1.5 },
      { code: "S3", name: "Suelo Semirígido (S3)", factorS: 1.25, tp: 0.70, tl: 2.0 },
      { code: "S4", name: "Suelo Blando o Flexible (S4)", factorS: 1.40, tp: 1.00, tl: 2.5 },
    ],
    driftLimit: {
      frame: 0.012,
      shearWall: 0.010,
      masonry: 0.004,
      adobe: 0.008,
    }
  },
  SV: {
    code: "SV",
    name: "El Salvador",
    normName: "NTDS OPAMSS",
    zones: [
      { code: "I", name: "Zona I (Alta - Costa / San Salvador)", value: 0.40 },
      { code: "II", name: "Zona II (Moderada - Zona Norte)", value: 0.30 },
    ],
    soils: [
      { code: "S1", name: "Roca o Suelo Muy Denso (S1)", factorS: 1.00, tp: 0.30, tl: 2.0 },
      { code: "S2", name: "Suelo de Densidad Media (S2)", factorS: 1.20, tp: 0.50, tl: 2.0 },
      { code: "S3", name: "Suelo Blando / Cohesivo (S3)", factorS: 1.50, tp: 0.80, tl: 2.0 },
    ],
    driftLimit: {
      frame: 0.015,
      shearWall: 0.010,
      masonry: 0.005,
      adobe: 0.010,
    }
  },
  EC: {
    code: "EC",
    name: "Ecuador",
    normName: "NEC-SE-DS (2015)",
    zones: [
      { code: "VI", name: "Zona VI (Muy Alta - Esmeraldas / Manabí)", value: 0.50 },
      { code: "V", name: "Zona V (Alta - Guayaquil / Quito)", value: 0.40 },
      { code: "IV", name: "Zona IV (Alta - Cuenca)", value: 0.35 },
      { code: "III", name: "Zona III (Moderada - Oriente)", value: 0.25 },
    ],
    soils: [
      { code: "A", name: "Roca competente (A)", factorS: 0.90, tp: 0.15, tl: 1.0 },
      { code: "B", name: "Roca de rigidez media (B)", factorS: 1.00, tp: 0.20, tl: 1.2 },
      { code: "C", name: "Suelos densos / roca blanda (C)", factorS: 1.20, tp: 0.40, tl: 1.6 },
      { code: "D", name: "Suelos rígidos / intermedios (D)", factorS: 1.40, tp: 0.60, tl: 2.0 },
      { code: "E", name: "Suelos blandos (E)", factorS: 1.60, tp: 0.90, tl: 2.4 },
    ],
    driftLimit: {
      frame: 0.020,
      shearWall: 0.020,
      masonry: 0.010,
      adobe: 0.010,
    }
  },
  PA: {
    code: "PA",
    name: "Panamá",
    normName: "REP-14",
    zones: [
      { code: "Alta", name: "Zona 2 (Alta - Chiriquí)", value: 0.35 },
      { code: "Moderada", name: "Zona 1 (Moderada - Panamá / Colón)", value: 0.20 },
    ],
    soils: [
      { code: "A", name: "Roca dura (A)", factorS: 0.80, tp: 0.10, tl: 1.5 },
      { code: "B", name: "Roca media (B)", factorS: 1.00, tp: 0.15, tl: 1.5 },
      { code: "C", name: "Suelo denso / roca blanda (C)", factorS: 1.20, tp: 0.30, tl: 2.0 },
      { code: "D", name: "Suelo de rigidez media (D)", factorS: 1.50, tp: 0.45, tl: 2.0 },
      { code: "E", name: "Suelo blando / flexible (E)", factorS: 2.00, tp: 0.60, tl: 2.0 },
    ],
    driftLimit: {
      frame: 0.015,
      shearWall: 0.015,
      masonry: 0.005,
      adobe: 0.010,
    }
  },
  CU: {
    code: "CU",
    name: "Cuba",
    normName: "NC 46:2017",
    zones: [
      { code: "Z4", name: "Zona 4 (Alta - Santiago de Cuba)", value: 0.30 },
      { code: "Z3", name: "Zona 3 (Moderada - Guantánamo)", value: 0.20 },
      { code: "Z2", name: "Zona 2 (Baja-Moderada - Holguín)", value: 0.15 },
      { code: "Z1", name: "Zona 1 (Muy Baja - La Habana)", value: 0.05 },
    ],
    soils: [
      { code: "A", name: "Roca dura (A)", factorS: 1.00, tp: 0.15, tl: 1.0 },
      { code: "B", name: "Suelo firme / roca blanda (B)", factorS: 1.20, tp: 0.30, tl: 1.5 },
      { code: "C", name: "Suelo de rigidez media (C)", factorS: 1.50, tp: 0.50, tl: 2.0 },
      { code: "D", name: "Suelo blando o flexible (D)", factorS: 2.00, tp: 0.80, tl: 2.5 },
    ],
    driftLimit: {
      frame: 0.015,
      shearWall: 0.012,
      masonry: 0.004,
      adobe: 0.008,
    }
  }
};

export type TypologyType = "adobe" | "masonry" | "frame" | "shearWall";

export interface StructuralTypology {
  id: TypologyType;
  name: string;
  icon: string;
  description: string;
  stiffnessFactor: number; // Multiplicador de rigidez lateral relativo
  ductilityR: number;      // Factor de reducción de fuerza sísmica (R)
  maxDrift: number;        // Límite de deriva teórica antes de colapso
  baseShearCapacity: number; // Coeficiente de cortante basal último
}

export const structuralTypologies: StructuralTypology[] = [
  {
    id: "adobe",
    name: "Adobe o Tapial",
    icon: "Home",
    description: "Autoconstrucción, tierra, mampostería no reforzada antigua. Muy frágil y pesada.",
    stiffnessFactor: 0.3,
    ductilityR: 1.5,
    maxDrift: 0.008,
    baseShearCapacity: 0.05, // Colapsa muy rápido con cargas bajas
  },
  {
    id: "masonry",
    name: "Mampostería No Reforzada",
    icon: "Grid",
    description: "Bloques de ladrillo artesanal sin vigas ni columnas de confinamiento.",
    stiffnessFactor: 0.8,
    ductilityR: 2.0,
    maxDrift: 0.005,
    baseShearCapacity: 0.12,
  },
  {
    id: "frame",
    name: "Pórticos de Concreto",
    icon: "SquareTerminal",
    description: "Columnas y vigas de concreto armado sin muros estructurales. Flexible con buena ductilidad.",
    stiffnessFactor: 1.0,
    ductilityR: 8.0,
    maxDrift: 0.020, // Puede deformarse mucho antes del colapso si está bien detallado
    baseShearCapacity: 0.25,
  },
  {
    id: "shearWall",
    name: "Hormigón Armado (Muros)",
    icon: "LayoutGrid",
    description: "Muros de corte (placas) de concreto armado. Muy rígido, ideal para controlar derivas.",
    stiffnessFactor: 3.5,
    ductilityR: 6.0,
    maxDrift: 0.015,
    baseShearCapacity: 0.45,
  }
];

// Jacobi eigenvalue solver para matrices simétricas de NxN
export function solveJacobi(A: number[][], maxIterations: number = 1000, tolerance: number = 1e-9): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = A.length;
  const V: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1.0 : 0.0)));
  const D = A.map((row) => [...row]);

  for (let iter = 0; iter < maxIterations; iter++) {
    let maxVal = 0;
    let p = 0;
    let q = 0;

    // Buscar el elemento fuera de la diagonal con mayor valor absoluto
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(D[i][j]) > maxVal) {
          maxVal = Math.abs(D[i][j]);
          p = i;
          q = j;
        }
      }
    }

    if (maxVal < tolerance) break;

    // Calcular el ángulo de rotación de Jacobi
    const theta = (D[q][q] - D[p][p]) / (2 * D[p][q]);
    let t = 0;
    if (Math.abs(theta) < 1e-12) {
      t = 1.0; // aprox. sgn(theta) / (theta + sqrt(1+theta^2)) cuando theta -> 0
    } else {
      t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
    }
    const c = 1 / Math.sqrt(1 + t * t);
    const s = c * t;

    // Rotar matriz D
    const d_pp = D[p][p];
    const d_qq = D[q][q];
    D[p][p] = c * c * d_pp - 2 * s * c * D[p][q] + s * s * d_qq;
    D[q][q] = s * s * d_pp + 2 * s * c * D[p][q] + c * c * d_qq;
    D[p][q] = 0;
    D[q][p] = 0;

    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const d_ip = D[i][p];
        const d_iq = D[i][q];
        D[i][p] = c * d_ip - s * d_iq;
        D[p][i] = D[i][p];
        D[i][q] = s * d_ip + c * d_iq;
        D[q][i] = D[i][q];
      }
    }

    // Acumular transformaciones en los vectores propios V
    for (let i = 0; i < n; i++) {
      const v_ip = V[i][p];
      const v_iq = V[i][q];
      V[i][p] = c * v_ip - s * v_iq;
      V[i][q] = s * v_ip + c * v_iq;
    }
  }

  const eigenvalues = D.map((_, i) => D[i][i]);
  const eigenvectors = V; // Las columnas son los autovectores
  return { eigenvalues, eigenvectors };
}

// Generador de espectro de diseño normativo Sa vs T
export function getSpectralAcceleration(
  T: number,
  normCode: string,
  zoneCode: string,
  soilCode: string,
  ductilityR: number
): number {
  const norm = countryNorms[normCode];
  if (!norm) return 0.1;

  const zone = norm.zones.find(z => z.code === zoneCode) || norm.zones[0];
  const soil = norm.soils.find(s => s.code === soilCode) || norm.soils[0];
  const PGA = zone.value; // Coeficiente de aceleración horizontal (g)

  if (normCode === "PE") {
    // Espectro E.030 Perú: Sa = (Z * U * S * C / R) * g
    // Asumimos categoría de edificio U = 1.0 (Comunes)
    const Z = PGA;
    const S = soil.factorS;
    const Tp = soil.tp || 0.4;
    const Tl = soil.tl || 2.5;
    let C = 2.5;

    if (T < Tp) {
      C = 2.5;
    } else if (T >= Tp && T < Tl) {
      C = 2.5 * (Tp / T);
    } else if (T >= Tl) {
      C = 2.5 * ((Tp * Tl) / (T * T));
    }

    // Sa mínimo es de 0.1 * Z * S
    const Sa = (Z * 1.0 * S * C) / ductilityR;
    return Math.max(Sa, 0.1 * Z * S);
  } else if (normCode === "CL") {
    // Espectro NCh433 Chile simplificado: Sa = (A0 * S * C / R*)
    const A0 = PGA;
    const S = soil.factorS;
    const T0 = soil.t0Ch || 0.3;
    const Tp = soil.tpCh || 0.35;
    const p = soil.pCh || 1.5;

    // Amplificación dinámica C
    let C = (2.75 * S * Tp) / T;
    if (T < T0) {
      C = 2.75 * S * (1 + (T / T0) * (2.75 - 1)); // curva ascendente simplificada o meseta
    }
    C = Math.min(C, 2.75 * S);

    // Factor de reducción chileno R* variable por periodo
    const R_star = 2.0 + (ductilityR - 2.0) / (1.0 + T / T0);

    return (A0 * C) / R_star;
  } else if (normCode === "CO") {
    // Espectro NSR-10 Colombia: Sa = 2.5 * Aa * Fa * I / R (para meseta)
    const Aa = PGA;
    const Av = zone.vValue || PGA;
    const Fa = soil.factorS; // Simplificamos Fa como el factorS del suelo
    const Fv = soil.factorS * 1.2; // Estimado simplificado de Fv
    
    const Tc = 0.48 * (Av * Fv) / (Aa * Fa);
    const Td = 2.4 * Fv;

    let Sa = 2.5 * Aa * Fa;

    if (T < Tc) {
      Sa = 2.5 * Aa * Fa * (0.4 + 0.6 * (T / Tc));
    } else if (T >= Tc && T <= Td) {
      Sa = 2.5 * Aa * Fa;
    } else if (T > Td) {
      Sa = (1.2 * Av * Fv) / T;
    }

    return Sa / ductilityR;
  }

  // Espectro genérico de tres ramas para otras normativas de Latinoamérica (VE, SV, EC, PA, CU, etc.)
  const Z = PGA;
  const S = soil.factorS;
  const Tp = soil.tp || 0.4;
  const Tl = soil.tl || 2.0;
  let C = 2.5;

  if (T < Tp) {
    C = 2.5;
  } else if (T >= Tp && T < Tl) {
    C = 2.5 * (Tp / T);
  } else if (T >= Tl) {
    C = 2.5 * ((Tp * Tl) / (T * T));
  }

  const Sa = (Z * S * C) / ductilityR;
  return Math.max(Sa, 0.05 * Z);
}

// Ground Motion Prediction Equation (GMPE) para sismos reales
// Calcula el PGA epicentral e instrumental en la base del edificio
export function calculateEarthquakePGA(
  magnitude: number,
  depth: number,
  epicentralDistance: number = 30
): { pga: number; duration: number } {
  // Hipotenusa para distancia hipocentral R
  const R = Math.sqrt(depth * depth + epicentralDistance * epicentralDistance);

  // Ecuación simplificada tipo Youngs et al. de atenuación para Sudamérica (Subducción)
  // ln(PGA) = a + b * Mw - c * ln(R + d) + e * H
  // Retorna PGA en g
  const a = 0.45;
  const b = 0.85;
  const c = 1.45;
  const d = 35;

  const lnPGA = a + b * magnitude - c * Math.log(R + d) - 0.003 * R;
  let pga = Math.exp(lnPGA) * 0.18; // Escala empírica para PGA realista en g (e.g. Mw 8 a 50km da ~0.35g)

  // Asegurar límites razonables
  pga = Math.min(Math.max(pga, 0.01), 1.6);

  // Estimación de la duración de fase fuerte en segundos (basado en correlación empírica de Trifunac-Brady)
  const duration = Math.max(5, 10 * Math.exp(0.3 * (magnitude - 5.0)) + 0.1 * R);

  return { pga, duration };
}

// Estructura de resultados detallados por piso
export interface FloorResponse {
  floor: number;
  mass: number;
  stiffness: number;
  displacement: number; // Desplazamiento máximo absoluto (m)
  drift: number;        // Deriva de entrepiso (adimensional: delta / h)
  force: number;        // Fuerza cortante de piso (kN)
  damage: "none" | "light" | "moderate" | "severe" | "collapse";
  damageRatio: number;  // 0 a 1 indicando escala de daño visual
}

export interface BuildingSeismicResults {
  fundamentalPeriod: number;
  realPGA: number; // PGA real calculado por la GMPE para el sismo configurado (en g)
  modes: {
    period: number;
    participationFactor: number;
    shape: number[]; // Deformada modal por piso (normalizada a 1.0 en la azotea)
  }[];
  floorResponses: FloorResponse[];
  maxDrift: number;
  maxDriftFloor: number;
  baseShear: number; // Cortante basal total (kN)
  overallRisk: "BAJO" | "MODERADO" | "CRÍTICO" | "COLAPSO";
  habitability: "HABITABLE" | "RESTRICCIONES / INSPECCIÓN" | "EVACUAR / INHABITABLE";
  capacityCurve: { displacement: number; shear: number }[]; // Datos de curva Pushover
  demandPoint: { displacement: number; shear: number };
}

// Resuelve la respuesta dinámica MDOF utilizando RSA (Response Spectrum Analysis)
export function analyzeMDOFBuilding(
  numFloors: number,
  interstoryHeight: number,
  typologyId: TypologyType,
  normCode: string,
  zoneCode: string,
  soilCode: string,
  earthquakeMw: number,
  earthquakeDepth: number,
  epicentralDistance: number,
  customBaseMass: number = 120, // Masa base por piso (en toneladas)
  customBaseStiffness: number = 380000 // Rigidez lateral base (en kN/m)
): BuildingSeismicResults {
  // 1. Obtener la tipología estructural
  const typology = structuralTypologies.find(t => t.id === typologyId) || structuralTypologies[2];
  const norm = countryNorms[normCode] || countryNorms["PE"];

  // 2. Parámetros físicos por piso
  // Masa típica por piso: customBaseMass toneladas.
  // El Adobe tiene el doble de masa (más pesado). Muros tienen un poco más de masa.
  const baseMass = customBaseMass * 1000; // kg
  const massPerFloor = Array.from({ length: numFloors }, (_, i) => {
    let massFactor = 1.0;
    if (typologyId === "adobe") massFactor = 1.8;
    if (typologyId === "shearWall") massFactor = 1.25;
    // El techo del último piso suele tener ~80% de carga viva reducida
    const isTop = i === numFloors - 1;
    return baseMass * massFactor * (isTop ? 0.85 : 1.0);
  });

  // Rigidez típica por piso.
  // Rigidez base: customBaseStiffness kN/m.
  const baseStiffness = customBaseStiffness * 1000; // N/m
  const stiffnessPerFloor = Array.from({ length: numFloors }, () => {
    // Depende directamente de la tipología, el factor de altura de entrepiso (K es proporcional a 1/h^3)
    const heightRatio = Math.pow(3.0 / interstoryHeight, 3);
    return baseStiffness * typology.stiffnessFactor * heightRatio;
  });

  // 3. Ensamblar matrices de Masa M y Rigidez K
  // M es diagonal. K es tridiagonal (Shear Building Model)
  const M_diag = massPerFloor;
  const K_matrix = Array.from({ length: numFloors }, () => Array(numFloors).fill(0));

  for (let i = 0; i < numFloors; i++) {
    const k_current = stiffnessPerFloor[i];
    const k_next = i < numFloors - 1 ? stiffnessPerFloor[i + 1] : 0;

    K_matrix[i][i] = k_current + k_next;
    if (i > 0) {
      K_matrix[i][i - 1] = -k_current;
    }
    if (i < numFloors - 1) {
      K_matrix[i][i + 1] = -k_next;
    }
  }

  // 4. Normalizar la matriz de rigidez por la masa para aplicar Jacobi
  // K_tilde = M^-1/2 * K * M^-1/2
  const K_tilde = Array.from({ length: numFloors }, () => Array(numFloors).fill(0));
  for (let i = 0; i < numFloors; i++) {
    for (let j = 0; j < numFloors; j++) {
      K_tilde[i][j] = K_matrix[i][j] / (Math.sqrt(M_diag[i]) * Math.sqrt(M_diag[j]));
    }
  }

  // 5. Resolver autovalores y autovectores de K_tilde
  const { eigenvalues, eigenvectors } = solveJacobi(K_tilde);

  // Convertir autovalores a frecuencias circulares omega (rad/s) y periodos T (s)
  // eigenvalues = omega^2
  const modesData = eigenvalues.map((val, idx) => {
    const omegaSq = Math.max(val, 1e-4); // evitar raíz de negativo o cero
    const omega = Math.sqrt(omegaSq);
    const T = (2 * Math.PI) / omega;

    // Recuperar el autovector original phi del edificio (phi = M^-1/2 * Y)
    let shape = Array.from({ length: numFloors }, (_, f) => eigenvectors[f][idx] / Math.sqrt(M_diag[f]));

    // Normalizar la deformada modal para que la azotea (último piso) sea 1.0
    const topVal = shape[numFloors - 1];
    if (Math.abs(topVal) > 1e-12) {
      shape = shape.map(v => v / topVal);
    }

    // Si el primer piso se deforma al revés en el primer modo, volteamos el vector
    if (idx === 0 && shape[0] < 0) {
      shape = shape.map(v => -v);
    }

    return { omega, period: T, shapeRaw: shape };
  });

  // Ordenar los modos del periodo más largo (fundamental) al más corto
  modesData.sort((a, b) => b.period - a.period);

  // 6. Calcular el PGA del sismo real seleccionado para calibrar la demanda
  const eqData = calculateEarthquakePGA(earthquakeMw, earthquakeDepth, epicentralDistance);
  const realPGA = eqData.pga;

  // Encontrar el PGA de diseño de la norma
  const normZone = norm.zones.find(z => z.code === zoneCode) || norm.zones[0];
  const designPGA = normZone.value;

  // Factor de escala del sismo real con respecto al diseño normativo
  const seismicScaleFactor = realPGA / designPGA;

  // 7. Análisis de Espectro de Respuesta (RSA) por superposición modal (SRSS)
  const totalBuildingMass = M_diag.reduce((sum, m) => sum + m, 0);

  // Calcular participación modal para todos los modos disponibles para determinar cuántos usar
  const allModalData = modesData.map((mode) => {
    const T = mode.period;
    const shape = mode.shapeRaw;

    // Calcular el factor de participación modal Gamma
    // Gamma = (phi^T * M * 1) / (phi^T * M * phi)
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < numFloors; i++) {
      numerator += shape[i] * M_diag[i];
      denominator += shape[i] * shape[i] * M_diag[i];
    }
    const Gamma = numerator / (denominator || 1e-4);
    
    // Masa modal del modo m: M_m = Gamma * (phi^T * M * 1)
    const modalMass = Gamma * numerator;
    const ratio = modalMass / totalBuildingMass;

    // Aceleración espectral de diseño de la norma para este periodo modal
    const SaDesign = getSpectralAcceleration(T, normCode, zoneCode, soilCode, typology.ductilityR);

    // Escalar por el sismo real
    const SaReal = SaDesign * seismicScaleFactor;

    return {
      period: T,
      gamma: Gamma,
      shape,
      sa: SaReal, // Aceleración espectral de demanda final (g)
      omega: mode.omega,
      ratio
    };
  });

  // Determinar dinámicamente el número de modos necesarios para alcanzar >= 90% de participación
  let cumulativeRatio = 0;
  let numModesToUse = 0;
  for (let i = 0; i < numFloors; i++) {
    cumulativeRatio += allModalData[i].ratio;
    numModesToUse = i + 1;
    if (cumulativeRatio >= 0.90) {
      break;
    }
  }
  // Garantizar un mínimo de 3 modos (o el número total de pisos si es menor)
  numModesToUse = Math.max(numModesToUse, Math.min(numFloors, 3));

  // Filtrar los modos que usaremos en la superposición
  const modalSpectralData = allModalData.slice(0, numModesToUse);

  // Calcular la respuesta combinada por SRSS para desplazamientos y fuerzas
  const g = 9.81; // m/s^2
  const combinedDisplacements = Array(numFloors).fill(0);
  const combinedForces = Array(numFloors).fill(0);

  for (let f = 0; f < numFloors; f++) {
    let sumSqDisp = 0;
    let sumSqForce = 0;

    for (let m = 0; m < numModesToUse; m++) {
      const mode = modalSpectralData[m];
      // Desplazamiento modal máximo del piso f: u = Gamma * phi * (Sa * g) / omega^2
      const u_fm = mode.gamma * mode.shape[f] * (mode.sa * g) / (mode.omega * mode.omega);
      sumSqDisp += u_fm * u_fm;

      // Fuerza cortante modal máxima en el piso f: f_fm = mass * Gamma * phi * (Sa * g)
      // (Fuerza inercial lateral por piso)
      const f_fm = M_diag[f] * mode.gamma * mode.shape[f] * (mode.sa * g);
      sumSqForce += f_fm * f_fm;
    }

    combinedDisplacements[f] = Math.sqrt(sumSqDisp);
    combinedForces[f] = Math.sqrt(sumSqForce) / 1000; // Convertir a kN
  }

  // Calcular derivas de entrepiso (drift = delta_i - delta_i-1 / h)
  const drifts = Array(numFloors).fill(0);
  for (let f = 0; f < numFloors; f++) {
    const u_current = combinedDisplacements[f];
    const u_prev = f > 0 ? combinedDisplacements[f - 1] : 0;
    drifts[f] = (u_current - u_prev) / interstoryHeight;

    // Evitar derivas negativas o numéricamente inconsistentes por el método SRSS en niveles bajos
    drifts[f] = Math.max(drifts[f], 1e-6);
  }

  // --- Factores de amplificación de deriva según cada norma ---
  // Representa el paso de deriva elástica reducida a deriva de diseño para control normativo.
  let codeAmplificationFactor = 0.75 * typology.ductilityR; // Valor por defecto general
  if (normCode === "PE") {
    codeAmplificationFactor = 0.75 * typology.ductilityR; // E.030: 0.75 * R
  } else if (normCode === "CL") {
    codeAmplificationFactor = 1.0; // NCh433: control elástico directo (límite muy bajo de 0.002)
  } else if (normCode === "CO") {
    codeAmplificationFactor = 1.0 * typology.ductilityR; // NSR-10: 1.0 * R
  } else if (normCode === "VE") {
    codeAmplificationFactor = 0.80 * typology.ductilityR; // COVENIN: 0.8 * R
  } else if (normCode === "SV") {
    codeAmplificationFactor = 0.80 * typology.ductilityR; // OPAMSS: 0.8 * R
  } else if (normCode === "EC") {
    codeAmplificationFactor = 0.75 * typology.ductilityR; // NEC: 0.75 * R
  } else if (normCode === "PA") {
    codeAmplificationFactor = 0.75 * typology.ductilityR; // REP: 0.75 * R
  } else if (normCode === "CU") {
    codeAmplificationFactor = 0.75 * typology.ductilityR; // NC 46: 0.75 * R
  }

  // 8. Determinar los estados de daño por piso
  // Basado en el límite de la deriva normada y la capacidad física última de la tipología
  const normLimit = (norm.driftLimit as any)[typologyId] || 0.007;

  const floorResponses: FloorResponse[] = Array.from({ length: numFloors }, (_, f) => {
    const elasticDrift = drifts[f];
    
    // Deriva de diseño normativo (usada para control de cumplimiento del código)
    const designDrift = elasticDrift * codeAmplificationFactor;
    
    // Deriva inelástica real esperada (representa la deformación física real de la estructura)
    const actualInelasticDrift = elasticDrift * typology.ductilityR;
    
    // Desplazamiento inelástico real esperado en m (desplazamiento elástico x R)
    const actualInelasticDisplacement = combinedDisplacements[f] * typology.ductilityR;

    // Clasificación física del daño basada en la capacidad de deriva última (maxDrift de la tipología)
    const physicalRatio = actualInelasticDrift / typology.maxDrift;
    
    let damage: FloorResponse["damage"] = "none";
    let damageRatio = 0.0;

    if (physicalRatio < 0.15) {
      damage = "none";
      damageRatio = (physicalRatio / 0.15) * 0.1;
    } else if (physicalRatio < 0.45) {
      damage = "light";
      damageRatio = 0.1 + ((physicalRatio - 0.15) / 0.30) * 0.3;
    } else if (physicalRatio < 0.75) {
      damage = "moderate";
      damageRatio = 0.4 + ((physicalRatio - 0.45) / 0.30) * 0.35;
    } else if (physicalRatio < 1.0) {
      damage = "severe";
      damageRatio = 0.75 + ((physicalRatio - 0.75) / 0.25) * 0.2;
    } else {
      damage = "collapse";
      damageRatio = Math.min(1.0, 0.95 + (physicalRatio - 1.0) * 0.1);
    }

    return {
      floor: f + 1,
      mass: M_diag[f] / 1000, // Toneladas
      stiffness: stiffnessPerFloor[f] / 1000, // kN/m
      displacement: actualInelasticDisplacement, // Retornamos desplazamiento real esperado
      drift: designDrift, // Retornamos deriva de diseño (para que en el perfil coincida con el control normado)
      force: combinedForces[f],
      damage,
      damageRatio
    };
  });

  // Cortante basal total = Suma de las fuerzas laterales combinadas por SRSS o acumuladas
  // Para un shear building, se calcula de forma más estable como la rigidez del primer piso * desplazamiento del primer piso
  // Usamos el desplazamiento elástico para el cortante basal de diseño regulatorio
  const baseShear = (stiffnessPerFloor[0] / 1000) * combinedDisplacements[0];

  // Deriva máxima de diseño (para reportes y control normativo)
  let maxDrift = 0;
  let maxDriftFloor = 1;
  for (let f = 0; f < numFloors; f++) {
    const floorDesignDrift = floorResponses[f].drift;
    if (floorDesignDrift > maxDrift) {
      maxDrift = floorDesignDrift;
      maxDriftFloor = f + 1;
    }
  }

  // Deriva inelástica real máxima (para verificar colapso físico)
  const maxActualInelasticDrift = drifts.reduce((max, d) => Math.max(max, d * typology.ductilityR), 0);

  // 9. Calibrar curvas de capacidad y demanda (Visualización Pushover simplificada)
  // Curva de capacidad bilineal teórica de la estructura en términos de desplazamiento inelástico
  const V_ultimate = baseShear * 1.35; // Estimación del cortante último
  const Disp_yield = (V_ultimate * 0.65) / (stiffnessPerFloor[0] / 1000 / numFloors); // Punto de fluencia estimado
  const Disp_ultimate = Disp_yield * typology.ductilityR * 1.5;

  const capacityCurve = [
    { displacement: 0, shear: 0 },
    { displacement: Disp_yield, shear: V_ultimate * 0.7 },
    { displacement: Disp_yield * 1.4, shear: V_ultimate * 0.95 },
    { displacement: Disp_ultimate, shear: V_ultimate }
  ];

  const demandPoint = {
    displacement: combinedDisplacements[numFloors - 1] * typology.ductilityR, // Desplazamiento máximo real esperado en el techo
    shear: baseShear
  };

  // 10. Evaluar Estado de Riesgo Global y Habitabilidad de forma realista e ingenieril
  let overallRisk: BuildingSeismicResults["overallRisk"] = "BAJO";
  let habitability: BuildingSeismicResults["habitability"] = "HABITABLE";

  // Cumplimiento normativo
  const exceedsNorm = maxDrift > normLimit;

  if (maxActualInelasticDrift >= typology.maxDrift) {
    overallRisk = "COLAPSO";
    habitability = "EVACUAR / INHABITABLE";
  } else if (maxActualInelasticDrift >= 0.75 * typology.maxDrift) {
    overallRisk = "CRÍTICO";
    habitability = "EVACUAR / INHABITABLE";
  } else if (exceedsNorm || maxActualInelasticDrift >= 0.45 * typology.maxDrift) {
    overallRisk = "MODERADO";
    habitability = "RESTRICCIONES / INSPECCIÓN";
  } else {
    overallRisk = "BAJO";
    habitability = "HABITABLE";
  }

  // Retornar resultados completos estructurados
  return {
    fundamentalPeriod: modesData[0].period,
    realPGA,
    modes: modalSpectralData.map(m => ({
      period: m.period,
      participationFactor: m.gamma,
      shape: m.shape
    })),
    floorResponses,
    maxDrift,
    maxDriftFloor,
    baseShear,
    overallRisk,
    habitability,
    capacityCurve,
    demandPoint
  };
}
