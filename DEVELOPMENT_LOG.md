# Historial de Desarrollo y Arquitectura Técnica de la Plataforma (MDOF Seismic Simulator)

Este documento contiene la bitácora de desarrollo, evolución matemática y la hoja de ruta técnica de la plataforma de simulación sísmica. Se mantiene aquí de forma oculta para consultas y revisiones por parte del desarrollador, ingenieros y agentes de IA, sin ser visible en la interfaz pública de usuario.

---

## 📋 Resumen del Proyecto

La plataforma es un simulador sísmico dinámico interactivo para edificaciones de múltiples grados de libertad (MDOF) enfocado en normativas sismorresistentes latinoamericanas (LATAM) e integrado con evaluación de vulnerabilidad estructural y reportes técnicos generados por Inteligencia Artificial (Gemini 1.5 Flash).

---

## 🛠️ Evolución y Fases de Desarrollo

### 🔹 Fase 1: Creación del Simulador de Edificios MDOF (Shear Building)
* **Concepto:** Herramienta educativa y profesional para simular la respuesta sísmica de estructuras con múltiples grados de libertad (MDOF).
* **Modelo Matemático:** Asume que las losas de entrepiso son diafragmas rígidos horizontales (infinitamente rígidos en su plano), concentrando la masa en el nivel de entrepiso y asumiendo que los soportes verticales aportan la rigidez lateral elástica (hipótesis de Shear Building).

### 🔹 Fase 2: Implementación de Análisis Modal Espectral Dinámico
* **Cálculo:** Resolución del problema de valores propios dinámicos para encontrar periodos y modos de vibración libres:
  $$[ K - \omega^2 M ] \Phi = 0$$
  Donde:
  * $K$: Matriz de rigidez lateral de entrepiso acoplada.
  * $M$: Matriz diagonal de masas de piso.
  * $\omega$: Frecuencias circulares naturales de vibración.
  * $\Phi$: Modos de vibración (formas espaciales).
* **Combinación Modal:** Los desplazamientos, aceleraciones y fuerzas cortantes modales se calculan para cada modo y se combinan mediante el método **SRSS (Square Root of the Sum of the Squares - Raíz Cuadrada de la Suma de los Cuadrados)** para estimar la respuesta máxima probable ante la excitación sísmica de diseño.

### 🔹 Fase 3: Integración de Espectros de Diseño Nacionales (LATAM)
* **Soporte Normativo:** Inclusión de curvas de aceleración espectral reglamentarias de 8 países:
  1. **Perú:** Norma Técnica E.030 (2018)
  2. **Chile:** Norma Chilena NCh433
  3. **Colombia:** NSR-10 (Título A)
  4. **Venezuela:** COVENIN 1756 (2001 / 2020)
  5. **El Salvador:** OPAMSS
  6. **Ecuador:** NEC
  7. **Panamá:** REP
  8. **Cuba:** NC 46
* **Parámetros:** Cada norma calibra las aceleraciones basándose en la zona sísmica (PGA), factores de amplificación por tipo de perfil de suelo ($S, T_p, T_l$), factor de importancia o uso ($U$), y ductilidad/reducción de fuerza sísmica ($R$).

### 🔹 Fase 4: Realismo Ingenieril en Amplificaciones, Derivas y Daños
Para evitar las limitaciones de los análisis elásticos puros simplistas, se incorporaron factores de control avanzado por piso:
* **Deriva de Diseño Normativa (Drift):** Multiplica la deriva elástica reducida por el coeficiente de amplificación de deformaciones del código respectivo (ej. $0.75 \cdot R$ para Perú, $1.0$ para Chile, $1.0 \cdot R$ para Colombia). Esta deriva amplificada se compara directamente con el límite legal de tolerancia de la norma correspondiente.
* **Deriva Inelástica Real Física:** Representa la deformación inelástica máxima esperada ante un sismo severo de diseño (calculada como: $\text{Deriva Elástica} \times R$).
* **Capacidad Física Última de Daño:** La severidad y el daño por piso se calibran contra la capacidad límite última de cada tipología estructural específica ($0.015$ para pórticos, $0.010$ para muros de corte, $0.005$ para adobe o mampostería no reforzada), representando con exactitud si la edificación sufre daños leves, moderados, severos o si entra en estado de colapso físico, indicando si permanece habitable o habitable con restricciones.

### 🔹 Fase 5: Auditoría y Reportes de Resiliencia con Gemini
* **Integración:** El modelo **Gemini 1.5 Flash** analiza de forma experta la resonancia modal de la estructura y el perfil de derivas del sismo de diseño.
* **Soluciones de Mitigación:** Sugiere de forma contextual y técnica alternativas de reforzamiento o mitigación como:
  * Colocación de disipadores de energía fluidoviscosos o histeréticos.
  * Sistemas de aislamiento en la base elastoméricos o friccionales.
  * Encamisado de columnas (concreto/acero/FRP).
  * Construcción de nuevos muros de corte o placas de concreto para rigidizar la estructura.

---

## 🚀 Hoja de Ruta para Desarrolladores Futuros (Roadmap)

1. **Amortiguamiento no convencional:** Implementar amortiguamiento de Rayleigh modal para modelar amortiguadores de masa sintonizados (TMD) o amortiguadores viscosos en los techos de edificios altos.
2. **Análisis Tiempo-Historia No Lineal (NLTHA):** Desarrollar la integración numérica paso a paso por el método de Newmark-Beta o Wilson-$\theta$ para resolver la ecuación dinámica general ante registros históricos reales de sismos cargados en formato de archivo JSON.
3. **Efecto de Interacción Suelo-Estructura (ISE):** Añadir resortes modales rotacionales, horizontales e inercias de suelo en el empotramiento basal de la edificación utilizando la teoría de semiespacio elástico.
