<div align="center">

# 🛡️ HEIMDALL

### Sistema de Evaluación de Vulnerabilidad Sísmica de Edificaciones

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-3.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Landing Page Moderna · 3 Metodologías Homologadas · FUNVISIS · FEMA P-154 · GNDT · Informes de IA**

</div>

---

## 📋 Descripción del Proyecto

**Heimdall** es una plataforma web especializada en la **Evaluación de la Vulnerabilidad Sísmica de Edificaciones**, desarrollada para ayudar a ingenieros civiles, arquitectos, evaluadores de campo y organismos de Protección Civil a categorizar el riesgo de colapso o daño estructural frente a terremotos.

La plataforma cuenta con una **Landing Page interactiva** y se concentra exclusivamente en tres de las metodologías internacionales y nacionales más reconocidas:
1. 🇻🇪 **Evaluación FUNVISIS** — Ficha de Evaluación Rápida de Edificaciones (Venezuela / COVENIN 1756).
2. 🇺🇸 **Evaluación FEMA P-154** — Rapid Visual Screening of Buildings for Potential Seismic Hazards (FEMA / ATC-130).
3. 🇮🇹 **Índice de Vulnerabilidad GNDT** — Método matricial ponderado de Benedetti-Petrini (11 Parámetros).

---

## ✨ Características Principales

### 🌐 Landing Page Heimdall
- Presentación técnica del proyecto, misión de protección estructural y reducción del riesgo de desastres (RRD).
- Tarjetas de lanzamiento rápido (*Quick Launch*) a cada una de las 3 herramientas de evaluación.
- Cuadro comparativo de metodologías para seleccionar la herramienta adecuada según el tipo de edificación y nivel de detalle.

### 📋 Módulos de Evaluación
- **Ficha Rápida FUNVISIS**: Captura multi-sección de datos generales, tipología estructural, irregularidades físicas, elementos no estructurales y cálculo de nivel de vulnerabilidad.
- **Tamizado FEMA P-154 (RVS)**: Cálculo de Puntaje Final $S$ con puntajes básicos por tipología y modificadores por irregularidad en planta, elevación, suelo suave y efecto de golpeteo.
- **Índice Numérico GNDT**: Ponderación objetiva de 11 parámetros críticos (resistencia, mampostería, conexiones, techos, conservación) para calcular el índice $I_V (\%)$.

### 🤖 Generación de Informes con IA
- Integración con el SDK de Google Gemini para emitir dictámenes técnicos y recomendaciones de reforzamiento sismorresistente.
- Soporte para exportación e impresión rápida de fichas de inspección.

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18 o superior
- NPM 9 o superior

### Instalación

```bash
# Clonar o ubicarse en la carpeta del proyecto
cd heimdall-seismic-vulnerability

# Instalar dependencias
npm install
```

### Ejecutar en Desarrollo

```bash
npm run dev
# Abrir en el navegador: http://localhost:3000
```

### Compilación para Producción

```bash
npm run build
npm run start
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| Componentes | Lucide React + Framer Motion |
| Backend | Express 4 + Node.js |
| Build Tool | Vite 6 |
| IA Server | Google Generative AI (Gemini 3.5 Flash) |

---

## 📄 Licencia

MIT © 2026 Heimdall Project
