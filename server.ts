import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
// Usar PORT dinámico para compatibilidad con Hostinger VPS, Cloud Run, Railway, etc.
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "1mb" }));

// Middleware para cabeceras HTTP de seguridad (Helmet-style)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Rate Limiters independientes por endpoint de IA — evita que el consumo en un módulo
// agote el cupo disponible para los demás (20 req / 15 min / IP por endpoint)
const makeAIRateLimiter = (endpoint: string) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: `Demasiadas solicitudes al generador de reportes (${endpoint}). Por favor espere 15 minutos e intente nuevamente.`,
    },
  });

const reportRateLimiter       = makeAIRateLimiter("MDOF");
const funvisisRateLimiter     = makeAIRateLimiter("FUNVISIS");
const fema154RateLimiter      = makeAIRateLimiter("FEMA P-154");
const gndtRateLimiter         = makeAIRateLimiter("GNDT");
const simulationRateLimiter   = makeAIRateLimiter("Simulación");

// Inicialización diferida del cliente Gemini para evitar errores catastróficos en arranque
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La variable de entorno GEMINI_API_KEY no está configurada.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Sanitiza un valor para usarlo de forma segura dentro de un prompt de IA.
 * - Convierte números a su representación numérica (evita inyección de texto en campos numéricos).
 * - Trunca strings a un máximo de `maxLength` caracteres.
 * - Elimina saltos de línea y secuencias que podrían romper la estructura del prompt.
 */
function sanitize(value: unknown, type: "string" | "number" | "int", maxLength = 200): string {
  if (type === "number") {
    const n = Number(value);
    if (!isFinite(n)) return "0";
    return String(n);
  }
  if (type === "int") {
    const n = parseInt(String(value), 10);
    if (!isFinite(n)) return "0";
    return String(n);
  }
  // string
  const str = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
  return str.substring(0, maxLength);
}

// Endpoint de salud
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API Endpoint para generar reporte de Ingeniería Sismorresistente usando Gemini
app.post("/api/generate-report", reportRateLimiter, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const body = req.body;

    // Validar y sanitizar todos los campos del cuerpo antes de usarlos en el prompt
    const projectName       = sanitize(body.projectName,       "string", 120);
    const country           = sanitize(body.country,           "string",  80);
    const normName          = sanitize(body.normName,          "string",  80);
    const zoneName          = sanitize(body.zoneName,          "string",  80);
    const soilName          = sanitize(body.soilName,          "string",  80);
    const typologyName      = sanitize(body.typologyName,      "string",  80);
    const habitability      = sanitize(body.habitability,      "string",  80);
    const overallRisk       = sanitize(body.overallRisk,       "string",  20);
    const numFloors         = Number(sanitize(body.numFloors,         "int"));
    const interstoryHeight  = Number(sanitize(body.interstoryHeight,  "number"));
    const earthquakeMw      = Number(sanitize(body.earthquakeMw,      "number"));
    const earthquakeDepth   = Number(sanitize(body.earthquakeDepth,   "number"));
    const earthquakeDuration = Number(sanitize(body.earthquakeDuration || 30, "number"));
    const pga               = Number(sanitize(body.pga,               "number"));
    const fundamentalPeriod = Number(sanitize(body.fundamentalPeriod, "number"));
    const maxDrift          = Number(sanitize(body.maxDrift,          "number"));
    const maxDriftFloor     = Number(sanitize(body.maxDriftFloor,     "int"));
    const baseShear         = Number(sanitize(body.baseShear,         "number"));
    const driftLimit        = Number(sanitize(body.driftLimit,        "number"));

    // Validaciones de rango básico
    if (numFloors < 1 || numFloors > 80) {
      res.status(400).json({ error: "Número de pisos fuera de rango permitido (1-80)." }); return;
    }
    if (pga < 0 || pga > 5) {
      res.status(400).json({ error: "PGA fuera de rango permitido (0-5g)." }); return;
    }

    const ai = getGeminiClient();

    const prompt = `
Actúa como un Ingeniero Civil Estructural experto en Sismorresistencia y Especialista en Gestión y Reducción del Riesgo de Desastres (RRD) en Latinoamérica.
Genera un informe técnico formal en Español con recomendaciones profesionales para el siguiente proyecto evaluado en etapas tempranas.

DATOS DEL PROYECTO EVALUADO:
- Nombre del Proyecto: ${projectName || "Evaluación de Riesgo - Escuela Local"}
- Ubicación: ${country} (${zoneName})
- Normativa Aplicada: ${normName}
- Tipo de Suelo: ${soilName}
- Número de Pisos: ${numFloors} pisos
- Altura de entrepiso: ${interstoryHeight} m
- Tipología Constructiva: ${typologyName}

DATOS DEL SISMO EVALUADO:
- Magnitud (Mw): ${earthquakeMw}
- Profundidad Focal: ${earthquakeDepth} km
- Duración de la Fase Fuerte: ${earthquakeDuration} segundos
- PGA Estimado en la base: ${pga.toFixed(3)}g

RESULTADOS DE LA SIMULACIÓN DINÁMICA (MDOF):
- Periodo Fundamental del Edificio: ${fundamentalPeriod.toFixed(3)} segundos
- Cortante Basal de Diseño/Demanda: ${baseShear.toFixed(1)} kN
- Máxima Deriva de Piso Calculada: ${maxDrift.toFixed(5)} (Límite normativo: ${driftLimit})
- Piso con Mayor Deriva: Piso ${maxDriftFloor}
- Nivel de Riesgo Estructural: ${overallRisk}
- Estado de Habitabilidad Post-Sismo: ${habitability}

INSTRUCCIONES PARA EL REPORTE:
1. El informe debe ser riguroso, técnico y redactado con seriedad académica e ingenieril.
2. Debe contener las siguientes secciones bien demarcadas usando formato Markdown estándar:
   - **1. Resumen de Amenaza y Vulnerabilidad**: Explica la relación entre la magnitud del sismo, el tipo de suelo (amplificación) y el comportamiento dinámico.
   - **2. Diagnóstico del Comportamiento Dinámico**: Analiza el periodo fundamental (e.g., si está en rango resonante con el suelo), las derivas y si excedió el límite de la norma ${normName}.
   - **3. Clasificación de Daños Esperados**: Describe detalladamente el tipo de agrietamiento, fallas (corte, flexión, piso blando, etc.) que experimentará esta tipología (${typologyName}) bajo este nivel de deriva (${maxDrift.toFixed(5)}).
   - **4. Plan de Acción y Medidas de Reducción del Riesgo (RRD)**: Proporciona 4 medidas de mitigación específicas (ej. encamisado de concreto, incorporación de muros/placas, disipadores de energía, aislación sísmica, o restricciones de uso) con enfoque latinoamericano.

Mantén el tono profesional e ilustrativo. No utilices jerga innecesariamente compleja sin explicarla.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    const reportText = response.text || "No se pudo generar el reporte. Intente nuevamente.";

    res.json({ report: reportText });
  } catch (error: any) {
    console.error("Error generating Gemini report:", error);
    res.status(500).json({
      error: error.message || "Error interno del servidor al procesar la solicitud con la IA.",
    });
  }
});

// API Endpoint para generar reporte específico de vulnerabilidad sísmica en Venezuela (Metodología FUNVISIS)
app.post("/api/generate-vulnerabilidad-ve", funvisisRateLimiter, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const body = req.body;

    // Sanitizar campos de texto que van al prompt
    const buildingName          = sanitize(body.buildingName,       "string", 120);
    const usageGroup            = sanitize(body.usageGroup,         "string",  10);
    const structuralTypeId      = sanitize(body.structuralType?.id, "string",  20);
    const structuralTypeDesc    = sanitize(body.structuralType?.description, "string", 100);
    const mantenimientoGeneral  = sanitize(body.mantenimientoGeneral, "string", 80);
    const deterioroEstrucCemento = sanitize(body.deterioroEstrucCemento || "Ninguno", "string", 60);
    const deterioroEstrucAcero   = sanitize(body.deterioroEstrucAcero  || "Ninguno", "string", 60);
    const deterioroParedes       = sanitize(body.deterioroParedes       || "Ninguno", "string", 60);
    const floors        = Number(sanitize(body.floors,        "int"));
    const basements     = Number(sanitize(body.basements,     "int"));
    const semiBasements = Number(sanitize(body.semiBasements, "int"));
    const peopleExposed = Number(sanitize(body.peopleExposed, "int"));

    const location      = body.location || {};
    const locState      = sanitize(location.state,        "string", 60);
    const locCity       = sanitize(location.city,         "string", 60);
    const locMuni       = sanitize(location.municipality, "string", 60);
    const locParish     = sanitize(location.parish,       "string", 60);
    const locSector     = sanitize(location.sector,       "string", 60);
    const locCoordX     = sanitize(location.coordX || "S/N", "string", 20);
    const locCoordY     = sanitize(location.coordY || "S/N", "string", 20);
    const locHuso       = sanitize(location.huso   || "S/N", "string", 10);

    const constructionPeriodLabel = sanitize(body.constructionPeriod?.label || "", "string", 80);
    const terrainConditionLabel   = sanitize(body.terrainCondition?.label   || "", "string", 80);
    const hasDrainage   = Boolean(body.hasDrainage);
    const depositDepth  = Boolean(body.depositDepth);
    const irregularities: string[] = Array.isArray(body.irregularities)
      ? body.irregularities.map((s: unknown) => sanitize(s, "string", 60)).slice(0, 10)
      : [];

    const indices = body.indices || {};
    const Ia  = Number(sanitize(indices.Ia,  "number"));
    const I1  = Number(sanitize(indices.I1,  "number"));
    const I2  = Number(sanitize(indices.I2,  "number"));
    const I3  = Number(sanitize(indices.I3,  "number"));
    const I4  = Number(sanitize(indices.I4,  "number"));
    const I5  = Number(sanitize(indices.I5,  "number"));
    const I6  = Number(sanitize(indices.I6,  "number"));
    const Iv  = Number(sanitize(indices.Iv,  "number"));
    const Ii  = Number(sanitize(indices.Ii,  "number"));
    const Ir  = Number(sanitize(indices.Ir,  "number"));
    const Ip  = Number(sanitize(indices.Ip,  "number"));
    const IvLabel    = sanitize(indices.IvLabel,    "string", 40);
    const IrLabel    = sanitize(indices.IrLabel,    "string", 40);
    const IpPrioridad = sanitize(indices.IpPrioridad, "string", 10);

    const ai = getGeminiClient();

    const prompt = `
Actúa como un destacado Especialista en Ingeniería Sismorresistente en Venezuela, experto en la metodología de priorización sísmica de la Fundación Venezolana de Investigaciones Sismológicas (FUNVISIS) y la norma COVENIN 1756.

Genera un reporte técnico de evaluación de vulnerabilidad sísmica formal, estructurado e instructivo en Español para la edificación evaluada bajo el marco de la reducción del riesgo de desastres (RRD).

DATOS DE INSPECCIÓN (PLANILLA FUNVISIS G-20007752-2):
- Nombre/Nº Edificación: ${buildingName || "S/N"}
- Ubicación: ${locState}, ${locCity}, Mun. ${locMuni}, Parroquia ${locParish}, Sector ${locSector}
- Coordenadas UTM: X: ${locCoordX}, Y: ${locCoordY} (Huso: ${locHuso})
- Geometría: ${floors} pisos, ${basements} sótanos, ${semiBasements} semi-sótanos
- Capacidad de Ocupación: ${peopleExposed} personas expuestas
- Grupo de Uso: Grupo ${usageGroup} (Grupo de importancia)
- Período de Construcción: ${constructionPeriodLabel} (Norma aplicable de la época)
- Condición del Terreno: ${terrainConditionLabel} (Drenaje: ${hasDrainage ? "Sí tiene" : "No tiene (descarga al terreno)"})
- Tipología Estructural: Tipo ${structuralTypeId} - ${structuralTypeDesc}
- Irregularidades Presentes: ${irregularities.length > 0 ? irregularities.join(", ") : "Ninguna detectada"}
- Profundidad de Depósito de Sedimentos (>120m, Suelo S3): ${depositDepth ? "Sí (Riesgo en edificios altos)" : "No o No aplica"}
- Grado de Deterioro:
  * Estructura Concreto: ${deterioroEstrucCemento}
  * Estructura Acero: ${deterioroEstrucAcero}
  * Paredes de Relleno: ${deterioroParedes}
  * Estado General de Mantenimiento: ${mantenimientoGeneral}

RESULTADOS DEL CÁLCULO DE ÍNDICES FUNVISIS:
- Índice de Amenaza (Ia): ${Ia.toFixed(3)} (Zona Sísmica de la región)
- Índice de Antigüedad (I1): ${I1.toFixed(1)}
- Índice de Tipo Estructural (I2): ${I2.toFixed(1)}
- Índice de Irregularidad (I3): ${I3.toFixed(1)} (Acotado a 100)
- Índice de Profundidad de Depósito (I4): ${I4.toFixed(1)}
- Índice de Topografía y Drenajes (I5): ${I5.toFixed(1)}
- Índice de Grado de Deterioro (I6): ${I6.toFixed(1)} (Acotado a 100)
- ÍNDICE DE VULNERABILIDAD GLOBAL (Iv): ${Iv.toFixed(2)} (Rango: 0-100) -> Calificación: ${IvLabel}
- ÍNDICE DE IMPORTANCIA (Ii): ${Ii.toFixed(2)}
- ÍNDICE DE RIESGO SÍSMICO (Ir = Ia * Iv): ${Ir.toFixed(2)} (Rango: 0-100) -> Calificación: ${IrLabel}
- ÍNDICE DE PRIORIZACIÓN DE EDIFICIOS (Ip = Ia * Iv * Ii): ${Ip.toFixed(2)} (Rango: 0-100) -> Calificación: P${IpPrioridad}

INSTRUCCIONES PARA LA REDACCIÓN DEL REPORTE:
1. Adopta un tono sumamente técnico, riguroso, formal y didáctico para estudiantes, arquitectos, ingenieros civiles u organismos de gestión de riesgo de desastres en Venezuela.
2. Organiza el reporte con Markdown claro usando la siguiente estructura:
   - ### **1. Diagnóstico de la Amenaza Sísmica Regional**
   - ### **2. Análisis de Vulnerabilidad Estructural (Metodología FUNVISIS)**
   - ### **3. Evaluación del Deterioro y Mantenimiento**
   - ### **4. Clasificación de Riesgo y Nivel de Priorización (RRD)**
   - ### **5. Recomendaciones de Mitigación y Reducción del Riesgo de Desastres**

No utilices afirmaciones exageradas, mantén una perspectiva de seguridad y desarrollo óptimo en las sociedades organizadas de Venezuela.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.3 }
    });

    const reportText = response.text || "No se pudo generar el reporte de vulnerabilidad. Intente de nuevo.";
    res.json({ report: reportText });
  } catch (error: any) {
    console.error("Error generating FUNVISIS report:", error);
    res.status(500).json({
      error: error.message || "Error interno del servidor al procesar la solicitud con la IA.",
    });
  }
});

// API Endpoint para generar reporte de vulnerabilidad FEMA P-154
app.post("/api/generate-fema154", fema154RateLimiter, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const body = req.body;

    const buildingName   = sanitize(body.buildingName,  "string", 120);
    const location       = sanitize(body.location,      "string", 150);
    const fecha          = sanitize(body.fecha,         "string",  40);
    const hazardLevel    = sanitize(body.hazardLevel,   "string",  20);
    const structuralTypeId   = sanitize(body.structuralType?.id,          "string",  20);
    const structuralTypeDesc = sanitize(body.structuralType?.description, "string", 100);
    const floors         = Number(sanitize(body.floors,         "int"));
    const peopleExposed  = Number(sanitize(body.peopleExposed,  "int"));
    const baseScore      = Number(sanitize(body.baseScore,      "number"));
    const finalScore     = Number(sanitize(body.finalScore,     "number"));
    const pasaEvaluacion = Boolean(body.pasaEvaluacion);
    const modifiers: string[] = Array.isArray(body.modifiers)
      ? body.modifiers.map((s: unknown) => sanitize(s, "string", 80)).slice(0, 15)
      : [];

    const ai = getGeminiClient();

    const prompt = `
Actúa como un Ingeniero Civil Estructural perito y Especialista en Gestión y Reducción del Riesgo de Desastres (RRD) certificado en la metodología FEMA P-154 (Rapid Visual Screening of Buildings for Potential Seismic Hazards).

Genera un reporte técnico de evaluación visual rápida formal, estructurado e instructivo en Español para la edificación evaluada bajo el método de triaje de FEMA.

DATOS DE INSPECCIÓN SÍSMICA RÁPIDA (FEMA P-154):
- Nombre del Edificio: ${buildingName || "S/N"}
- Ubicación/Dirección: ${location || "S/N"}
- Fecha de Inspección: ${fecha || "No especificada"}
- Número de Niveles/Pisos: ${floors} pisos
- Capacidad de Ocupación: ${peopleExposed} personas expuestas
- Nivel de Peligro Sísmico Regional: Peligro ${hazardLevel}
- Tipología Estructural: Tipo ${structuralTypeId} - ${structuralTypeDesc}

RESULTADOS DEL CÁLCULO DE SCORE FÍSICO S:
- Puntaje Básico de Partida (Base Score): ${baseScore.toFixed(2)}
- Modificadores Observados: ${modifiers.length > 0 ? modifiers.join(", ") : "Ninguno detectado"}
- PUNTAJE ESTRUCTURAL FINAL (Score S): ${finalScore.toFixed(2)}
- Umbral de Aceptabilidad de FEMA: S = 2.0
- Clasificación de Triaje: ${pasaEvaluacion ? "Probablemente Seguro (S >= 2.0)" : "DETALLADA REQUERIDA (S < 2.0) - Falla la evaluación rápida"}

INSTRUCCIONES PARA LA REDACCIÓN DEL REPORTE:
1. Adopta un tono sumamente profesional, técnico, formal y didáctico para ingenieros, estudiantes de ingeniería, inspectores municipales o gestores de riesgo.
2. Organiza el reporte con Markdown claro usando la siguiente estructura:
   - ### **1. Diagnóstico del Nivel de Peligro Regional**
   - ### **2. Análisis de Tipología Estructural y Score Básico**
   - ### **3. Impacto de los Modificadores de Puntaje Observados**
   - ### **4. Clasificación del Riesgo y Conclusión del Triaje (FEMA P-154)**
   - ### **5. Recomendaciones Técnicas de Mitigación y Reforzamiento (RRD)**

No uses afirmaciones de venta ni lenguaje florido, mantén una perspectiva de seguridad humana y rigor de cálculo de ingeniería sismorresistente.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.3 }
    });

    const reportText = response.text || "No se pudo generar el reporte FEMA P-154. Intente de nuevo.";
    res.json({ report: reportText });
  } catch (error: any) {
    console.error("Error generating FEMA P-154 report:", error);
    res.status(500).json({
      error: error.message || "Error interno del servidor al procesar la solicitud con la IA.",
    });
  }
});

// API Endpoint para generar reporte de vulnerabilidad GNDT (Benedetti-Petrini)
app.post("/api/generate-gndt", gndtRateLimiter, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const body = req.body;

    const buildingName  = sanitize(body.buildingName, "string", 120);
    const location      = sanitize(body.location,     "string", 150);
    const nivelRiesgo   = sanitize(body.nivelRiesgo,  "string",  40);
    const floors        = Number(sanitize(body.floors,         "int"));
    const peopleExposed = Number(sanitize(body.peopleExposed,  "int"));
    const pgaEsperado   = Number(sanitize(body.pgaEsperado,   "number"));
    const mmi           = Number(sanitize(body.mmi,            "int"));
    const indexIv       = Number(sanitize(body.indexIv,        "number"));
    const danioCalculado = Number(sanitize(body.danioCalculado, "number"));
    const descripcionesActivas: string[] = Array.isArray(body.descripcionesActivas)
      ? body.descripcionesActivas.map((s: unknown) => sanitize(s, "string", 120)).slice(0, 11)
      : [];

    if (pgaEsperado < 0 || pgaEsperado > 5) {
      res.status(400).json({ error: "PGA fuera de rango permitido (0-5g)." }); return;
    }

    const ai = getGeminiClient();

    const prompt = `
Actúa como un Ingeniero Civil Estructural perito y Especialista en Patología de Edificaciones y Reducción de Desastres, especializado en la metodología del Índice de Vulnerabilidad GNDT (Gruppo Nazionale per la Difesa dai Terremoti - Benedetti & Petrini).

Genera un reporte técnico pericial analítico, altamente formal, instructivo y riguroso en Español para la edificación evaluada bajo el método GNDT.

DATOS DE LA EDIFICACIÓN E INSPECCIÓN:
- Nombre de la Estructura: ${buildingName || "S/N"}
- Dirección/Ubicación: ${location || "S/N"}
- Número de Pisos: ${floors} niveles
- Personas Expuestas: ${peopleExposed} ocupantes
- Aceleración Pico del Suelo de Diseño (PGA): ${pgaEsperado.toFixed(2)}g
- Intensidad de Mercalli Modificada Equivalente: MMI ${mmi}

RESULTADOS DEL CÁLCULO GNDT:
- Índice de Vulnerabilidad Normalizado (I_v): ${indexIv} / 100
- Clasificación de Riesgo: ${nivelRiesgo}
- Estimación del Grado de Daño Físico Esperado (D): ${danioCalculado}%

CALIFICACIÓN DE LOS 11 PARÁMETROS OBSERVADOS:
${descripcionesActivas.join("\n")}

INSTRUCCIONES PARA LA REDACCIÓN DEL REPORTE:
1. Emplea un vocabulario estrictamente técnico de ingeniería civil, sismología y patología de materiales. Evita comentarios comerciales o informales.
2. Utiliza Markdown claro para estructurar la auditoría de la siguiente forma:
   - ### **1. Introducción y Marco Teórico de GNDT**
   - ### **2. Análisis Crítico de los 11 Parámetros de Vulnerabilidad**
   - ### **3. Cruce de PGA y Pronóstico de Daño Estructural (Curva de Vulnerabilidad)**
   - ### **4. Clasificación de Riesgo y Recomendación de Intervención**
   - ### **5. Plan de Reforzamiento Estructural y Mitigación (RRD)**

No uses auto-alabanzas ni afirmaciones exageradas, mantén la máxima objetividad de seguridad humana y rigor científico de ingeniería estructural.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.3 }
    });

    const reportText = response.text || "No se pudo generar el reporte de vulnerabilidad GNDT. Intente de nuevo.";
    res.json({ report: reportText });
  } catch (error: any) {
    console.error("Error generating GNDT report:", error);
    res.status(500).json({
      error: error.message || "Error interno del servidor al procesar la solicitud con la IA.",
    });
  }
});

// API Endpoint para generar reporte de simulación educativa de sismo en Venezuela
app.post("/api/generate-simulation-report", simulationRateLimiter, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const body = req.body;

    const magnitude      = Number(sanitize(body.magnitude,  "number"));
    const depth          = Number(sanitize(body.depth,      "number"));
    const crustMaterial  = sanitize(body.crustMaterial,    "string", 80);
    const waveVelocities = body.waveVelocities || {};
    const vp = Number(sanitize(waveVelocities.p, "number"));
    const vs = Number(sanitize(waveVelocities.s, "number"));
    const vr = Number(sanitize(waveVelocities.r, "number"));
    const vl = Number(sanitize(waveVelocities.l, "number"));

    const detectedFault = body.detectedFault
      ? {
          name:      sanitize(body.detectedFault.name,      "string", 80),
          type:      sanitize(body.detectedFault.type,      "string", 60),
          slipRate:  sanitize(body.detectedFault.slipRate,  "string", 40),
          extension: sanitize(body.detectedFault.extension, "string", 40),
          distance:  Number(sanitize(body.detectedFault.distance, "number")),
        }
      : null;

    const affectedCities: any[] = Array.isArray(body.affectedCities)
      ? body.affectedCities.slice(0, 20).map((c: any) => ({
          name:             sanitize(c.name,             "string", 60),
          distance:         Number(sanitize(c.distance, "number")),
          estimatedIntensity: sanitize(c.estimatedIntensity, "string", 20),
          damageEstimate:   sanitize(c.damageEstimate,  "string", 40),
          arrivalTimes: {
            p: Number(sanitize(c.arrivalTimes?.p, "number")),
            s: Number(sanitize(c.arrivalTimes?.s, "number")),
          },
        }))
      : [];

    const ai = getGeminiClient();

    const citiesDescription = affectedCities.map((c) =>
      `- **${c.name}**: Distancia epicentral: ${c.distance.toFixed(1)} km. Tiempo llegada Onda P: ${c.arrivalTimes.p.toFixed(2)}s, Onda S: ${c.arrivalTimes.s.toFixed(2)}s. Intensidad Estimada (Mercalli): ${c.estimatedIntensity}. Riesgo de Daños: ${c.damageEstimate}`
    ).join("\n");

    const prompt = `
Actúa como un destacado Sismólogo y Especialista en Prevención de Desastres de la Fundación Venezolana de Investigaciones Sismológicas (FUNVISIS).
Genera un reporte técnico de simulación sísmica con fines educativos e informativos en Español, analizando de forma rigurosa y clara el sismo simulado en Venezuela.

DATOS DEL SISMO SIMULADO:
- Magnitud de Momento (Mw): ${magnitude}
- Profundidad Focal (Hipocentro): ${depth} km (Clasificación: ${depth <= 70 ? 'Superficial (0-70 km)' : depth <= 300 ? 'Intermedio (70-300 km)' : 'Profundo (300-700 km)'})
- Material de la Corteza Seleccionado: ${crustMaterial}
- Velocidades de Ondas Estimadas:
  * Onda P (Primaria): ${vp.toFixed(2)} km/s
  * Onda S (Secundaria): ${vs.toFixed(2)} km/s
  * Onda R (Rayleigh): ${vr.toFixed(2)} km/s
  * Onda L (Love): ${vl.toFixed(2)} km/s

FALLA SISMOGÉNICA DETECTADA:
- Nombre: ${detectedFault ? detectedFault.name : 'Ninguna falla principal identificada en la cercanía'}
- Tipo de Falla (Neotectónica): ${detectedFault ? detectedFault.type : 'S/N'}
- Tasa de Desplazamiento (Slip Rate): ${detectedFault ? detectedFault.slipRate : 'S/N'}
- Extensión Probable de la Falla: ${detectedFault ? detectedFault.extension : 'S/N'}
- Distancia desde el Epicentro a la Falla: ${detectedFault ? detectedFault.distance.toFixed(1) + ' km' : 'N/A'}

CIUDADES EVALUADAS POR PROXIMIDAD:
${citiesDescription}

INSTRUCCIONES PARA LA REDACCIÓN DEL REPORTE:
1. Adopta un tono académico, técnico pero sumamente didáctico y preventivo, ideal para estudiantes, docentes y el público general interesado en la sismología en Venezuela (Aula Sísmica).
2. Organiza el reporte usando Markdown claro con las siguientes secciones obligatorias:
   - ### **1. Diagnóstico del Evento y Contexto Tectónico**
   - ### **2. Física de las Ondas Sísmicas y Tiempos de Viaje**
   - ### **3. Estimación de Daños y Escala de Mercalli**
   - ### **4. Medidas de Autoprotección y Cultura Preventiva (RRD)**

Mantén la redacción objetiva pero con un fuerte llamado a la prevención y la educación comunitaria.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.3 }
    });

    const reportText = response.text || "No se pudo generar el reporte de simulación. Intente de nuevo.";
    res.json({ report: reportText });
  } catch (error: any) {
    console.error("Error generating simulation report:", error);
    res.status(500).json({
      error: error.message || "Error interno del servidor al procesar la solicitud con la IA.",
    });
  }
});

// Configuración diferida de Nodemailer para evitar errores si no hay variables de entorno en desarrollo
let mailTransporter: nodemailer.Transporter | null = null;

function getMailTransporter(): nodemailer.Transporter {
  if (!mailTransporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error("La configuración SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS) no está completa en las variables de entorno.");
    }

    mailTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true para puerto 465 (SSL), false para otros (TLS)
      auth: {
        user,
        pass,
      },
      tls: {
        // Rechazar certificados inválidos en producción para evitar ataques MITM
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });
  }
  return mailTransporter;
}

// Endpoint para procesar el formulario de contacto
app.post("/api/contact", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: "Por favor complete los campos obligatorios: Nombre, Correo y Mensaje." });
      return;
    }

    console.log("=========================================");
    console.log(`NUEVO MENSAJE DE CONTACTO RECIBIDO - ${new Date().toISOString()}`);
    console.log(`De: ${name} <${email}>`);
    console.log(`Asunto: ${subject || "Sin asunto"}`);
    console.log("=========================================");

    // Envío del correo real a través de SMTP
    const transporter = getMailTransporter();
    const mailOptions = {
      from: `"${name} (Contacto Web)" <${process.env.SMTP_USER}>`, // El remitente autenticado
      replyTo: email, // Responder al correo del usuario
      to: "contacto@grdesastres.com",
      subject: `[Contacto Web] ${subject || "Nuevo Mensaje de Contacto"}`,
      text: `Has recibido un nuevo mensaje desde el formulario de contacto de tu sitio web:

Nombre: ${name}
Correo: ${email}
Asunto: ${subject || "Sin Asunto"}
Mensaje:
----------------------------------------
${message}
----------------------------------------

Fecha: ${new Date().toLocaleString()}
`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
          <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">Nuevo mensaje de contacto</h2>
          <p style="margin: 15px 0;"><strong>Nombre:</strong> ${name}</p>
          <p style="margin: 15px 0;"><strong>Correo:</strong> <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></p>
          <p style="margin: 15px 0;"><strong>Asunto:</strong> ${subject || "Sin Asunto"}</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #ffffff; border-left: 4px solid #3b82f6; border-radius: 4px; color: #334155; line-height: 1.6;">
            <strong>Mensaje:</strong><br />
            ${message.replace(/\n/g, "<br />")}
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">Este correo fue enviado automáticamente desde el formulario de contacto de grdesastres.com</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("Correo enviado con éxito a contacto@grdesastres.com");

    res.json({ success: true, message: "¡Mensaje recibido correctamente! El correo ha sido enviado a la bandeja." });
  } catch (error: any) {
    console.error("Error al procesar/enviar mensaje de contacto:", error);
    if (error.message && error.message.includes("La configuración SMTP")) {
      res.status(500).json({ error: "El servicio de correo no está configurado en el servidor (variables de entorno SMTP faltantes)." });
    } else {
      res.status(500).json({ error: "Error interno al enviar el correo. Por favor, intente más tarde." });
    }
  }
});

// Setup de Vite Middleware o servir archivos estáticos compilados
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SismoRisk LATAM] Servidor escuchando en http://0.0.0.0:${PORT}`);
    console.log(`[SismoRisk LATAM] Entorno: ${process.env.NODE_ENV || "development"}`);
    if (!process.env.GEMINI_API_KEY) {
      console.warn("[SismoRisk LATAM] ⚠️  GEMINI_API_KEY no configurada — los reportes de IA no funcionarán.");
    }
  });
}

setupServer();
