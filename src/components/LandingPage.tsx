import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  BookOpen, 
  HelpCircle, 
  Shield, 
  Globe, 
  Flame, 
  Play, 
  Pause, 
  Download, 
  Users, 
  FileText, 
  ChevronRight, 
  Volume2, 
  ExternalLink,
  Award,
  Bookmark,
  Info,
  Layers,
  Map,
  Compass,
  ArrowRight,
  Sparkles,
  Heart,
  Building2,
  Mail,
  Send,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  HardHat,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Importación de fotos reales e imágenes del proyecto
import jairoSnow from "../assets/jairo_snow.jpg";
import jairoClass from "../assets/jairo_class.jpg";
import jairoEcuador from "../assets/jairo_ecuador.jpg";
import jairoNepal from "../assets/jairo_nepal.jpg";
import jairoData from "../assets/jairo_data.jpg";
import jairoPelambres from "../assets/jairo_pelambres.jpg";
import jairoNera from "../assets/jairo_nera.jpg";
import jairoPc from "../assets/jairo_pc.jpg";
import jairoMolinstec from "../assets/jairo_molinstec.jpg";
import earthquakeHero from "../assets/earthquake_hero.jpg";
import collapsedBuilding from "../assets/collapsed_building.jpg";
import earthStructure from "../assets/earth_structure.jpg";
import jairoNepalRescue1 from "../assets/jairo_nepal_rescue_1.jpg";
import jairoNepalRescue2 from "../assets/jairo_nepal_rescue_2.jpg";
import jairoRescueSearch from "../assets/jairo_rescue_search.jpg";
import jairoNepalClose from "../assets/jairo_nepal_close.jpg";
import jairoEcuadorCollapse from "../assets/jairo_ecuador_collapse.jpg";

interface LandingPageProps {
  onNavigate: (tab: "vulnerabilidad" | "fema" | "gndt") => void;
}

// ----------------------------------------------------
// DATOS BIBLIOGRÁFICOS
// ----------------------------------------------------
interface BiblioItem {
  id: string;
  title: string;
  author: string;
  year: string;
  source: string;
  description: string;
  downloadUrl: string;
  category: "Normativas" | "Manuales" | "RRD" | "Sismología";
}

const BIBLIOGRAFIA_DB: BiblioItem[] = [
  {
    id: "bib-1",
    title: "Norma COVENIN 1756-1:2019 - Edificaciones Sismorresistentes",
    author: "FUNVISIS & Ministerio de Obras Públicas",
    year: "2019",
    source: "Fondo Norma Venezuela",
    description: "Requisitos mínimos de diseño sismorresistente para edificaciones nuevas en el territorio nacional venezolano, detallando mapas de zonificación, tipos de suelos y espectros de diseño elásticos.",
    downloadUrl: "https://www.funvisis.gob.ve/",
    category: "Normativas"
  },
  {
    id: "bib-2",
    title: "FEMA P-154: Rapid Visual Screening of Buildings for Potential Seismic Hazards",
    author: "Federal Emergency Management Agency (FEMA)",
    year: "2015",
    source: "Applied Technology Council (ATC-130)",
    description: "Metodología estándar norteamericana para la identificación y cribado rápido de edificaciones vulnerables a sismos mediante puntajes básicos y modificadores estructurales.",
    downloadUrl: "https://www.fema.gov/",
    category: "Manuales"
  },
  {
    id: "bib-3",
    title: "Sismología de Venezuela y Caracterización de Fallas Activas",
    author: "FUNVISIS Red Sismológica Nacional",
    year: "2021",
    source: "Ediciones de Investigación FUNVISIS",
    description: "Estudio geotécnico sobre el sistema de fallas de Boconó, San Sebastián y El Pilar. Mapas de aceleración espectral e históricos de sismicidad.",
    downloadUrl: "https://www.funvisis.gob.ve/",
    category: "Sismología"
  },
  {
    id: "bib-4",
    title: "GNDT-1984: Istruzioni per la compilazione della scheda di vulnerabilità di I e II livello",
    author: "Gruppo Nazionale per la Difesa dai Terremoti (GNDT)",
    year: "1984",
    source: "CNR - Italia",
    description: "Guía metodológica italiana para la recopilación del índice de vulnerabilidad mediante 11 parámetros críticos para mampostería y estructuras portantes.",
    downloadUrl: "#",
    category: "Normativas"
  },
  {
    id: "bib-5",
    title: "Marco de Sendai para la Reducción del Riesgo de Desastres (2015-2030)",
    author: "Oficina de las Naciones Unidas para la RRD (UNDRR)",
    year: "2015",
    source: "Naciones Unidas",
    description: "Acuerdo internacional que establece 7 objetivos mundiales y 4 prioridades de acción para prevenir nuevos riesgos de desastres y reducir los existentes.",
    downloadUrl: "https://www.undrr.org/",
    category: "RRD"
  }
];

// ----------------------------------------------------
// DATOS DE HÉROES ANÓNIMOS
// ----------------------------------------------------
interface HeroeItem {
  id: string;
  name: string;
  role: string;
  group: string;
  imageAlt: string;
  story: string;
  achievement: string;
  avatarBg: string;
}

const HEROES_DB: HeroeItem[] = [
  {
    id: "hero-1",
    name: "Cabo José 'Cheo' Miranda",
    role: "Especialista en Búsqueda y Rescate Urbano (USAR)",
    group: "Protección Civil y Administración de Desastres",
    imageAlt: "Rescatista con traje naranja y casco de seguridad",
    story: "Con más de 18 años de servicio activo en terremotos de la región andina y el Caribe, coordinó el rescate de sobrevivientes bajo estructuras colapsadas en condiciones extremas, priorizando el soporte vital inmediato.",
    achievement: "Líder táctico en 12 misiones humanitarias internacionales de rescate en estructuras colapsadas.",
    avatarBg: "bg-orange-600"
  },
  {
    id: "hero-2",
    name: "Kala & Drako",
    role: "Caninos K9 de Rescate y Localización",
    group: "Unidad K9 de Búsqueda de FUNVISIS / Bomberos",
    imageAlt: "Golden Retriever de rescate con arnés reflectante",
    story: "Esta valiente Golden Retriever y su compañero Pastor Alemán han sido entrenados rigurosamente para detectar señales químicas humanas atrapadas profundamente bajo escombros. Su agudeza olfativa ha salvado vidas críticas tras colapsos súbitos.",
    achievement: "Localización exitosa de 8 personas atrapadas en desastres sísmicos urbanos.",
    avatarBg: "bg-yellow-600"
  },
  {
    id: "hero-3",
    name: "Dra. Gloria Romero",
    role: "Sismóloga e Investigadora de Red de Fallas",
    group: "Departamento de Geofísica, FUNVISIS",
    imageAlt: "Ingeniera con casco blanco analizando datos geológicos",
    story: "Dedicó su vida a registrar los micro-sismos de la falla de Boconó. Con sensores manuales y estaciones satelitales, documenta patrones sísmicos que alimentan los sistemas de alerta temprana de escuelas y hospitales.",
    achievement: "Desarrollo del primer mapa interactivo micro-sísmico de alta resolución para la cordillera andina.",
    avatarBg: "bg-blue-600"
  }
];

// ----------------------------------------------------
// DATOS DE BLOGS ESPECIALISTAS
// ----------------------------------------------------
interface BlogItem {
  id: string;
  title: string;
  author: string;
  role: string;
  date: string;
  readTime: string;
  summary: string;
  content: string;
  videoUrl?: string;
}

const BLOGS_DB: BlogItem[] = [
  {
    id: "blog-1",
    title: "La Falla de Boconó: El motor sísmico del occidente de Venezuela",
    author: "Ing. Geólogo Alejandro Delgado",
    role: "Consultor en Sismotectónica",
    date: "8 de Julio, 2026",
    readTime: "6 min de lectura",
    summary: "Una mirada profunda al sistema sismogénico más activo de Venezuela, su tasa de deslizamiento de 5 mm al año y por qué las construcciones andinas necesitan aisladores modernos.",
    content: "La falla de Boconó se extiende por más de 500 km entre la frontera colombiana y el mar Caribe. Su movimiento transcurrente dextral acumula esfuerzos de compresión inmensos debido al empuje de la placa del Caribe contra la placa de Sudamérica. El análisis histórico revela terremotos catastróficos cada 120-150 años. Mitigar este riesgo no solo requiere mapas avanzados, sino también un estricto control de materiales de construcción y reformas estructurales retroactivas mediante metodologías de cribado rápido como FEMA P-154 y FUNVISIS."
  },
  {
    id: "blog-2",
    title: "Lecciones de Chile: El éxito del diseño sismorresistente con disipadores",
    author: "Dra. Carmen Martínez",
    role: "Especialista en Ingeniería Estructural",
    date: "25 de Junio, 2026",
    readTime: "8 min de lectura",
    summary: "Chile resiste terremotos de magnitud Mw 8.8 sufriendo daños estructurales ínfimos. Analizamos el papel de la ductilidad y la disipación sísmica de energía basal.",
    content: "Chile se ubica en el cinturón de fuego del Pacífico, zona de subducción masiva entre la placa de Nazca y la placa Sudamericana. El secreto de su resiliencia reside en la estricta aplicación de la norma NCh433 y el uso obligatorio de muros de hormigón armado con altos niveles de confinamiento. Además, los sistemas modernos de aislamiento basal desacoplan la estructura del movimiento del terreno, reduciendo las aceleraciones de piso hasta en un 80%, salvando vidas y garantizando la operatividad de hospitales claves post-evento."
  },
  {
    id: "blog-3",
    title: "Cribado Rápido (RVS): El primer escudo ante el colapso masivo de escuelas",
    author: "MSc. Carlos Valenzuela",
    role: "Coordinador de Gestión de Riesgos de Desastres",
    date: "12 de Mayo, 2026",
    readTime: "5 min de lectura",
    summary: "Por qué evaluar edificios visualmente es el método más eficiente y de menor costo para que los gobiernos prioricen fondos de reforzamiento estructural.",
    content: "No es económicamente viable realizar análisis matemáticos complejos paso a paso para todas las edificaciones de una gran urbe. Los métodos de cribado rápido visual (como FEMA P-154) permiten clasificar miles de edificaciones en días. Un evaluador capacitado puede identificar factores de riesgo como irregularidad en planta, columna corta, piso débil o amplificación por suelo local en cuestión de 15 minutos, arrojando un puntaje de seguridad objetivo. Esto permite salvar vidas canalizando subsidios de refuerzo de forma quirúrgica."
  },
  {
    id: "blog-4",
    title: "Sismotectónica de los recientes terremotos en Venezuela Norcentral",
    author: "Ph.D. Franck Audemard",
    role: "Sismólogo y Paleosismólogo",
    date: "16 de Julio, 2026",
    readTime: "Webinar Completo",
    summary: "Grabación del seminario web de la SPE Caracas Petroleum Section sobre la sismotectónica norcentral de Venezuela y la dinámica de fallas activas.",
    content: "En esta conferencia técnica virtual auspiciada por la SPE Caracas, el Dr. Franck Audemard expone las dinámicas sismotectónicas de los últimos eventos telúricos registrados en el norte de Venezuela.\n\nEl análisis describe la tectónica de placas en el límite Caribe-Sudamérica, el papel sismogénico de los sistemas de fallas de San Sebastián y La Victoria, y el fenómeno de dobletes sísmicos. Se discuten las implicaciones para la evaluación de riesgo sísmico y la mitigación de desastres en áreas urbanas densamente pobladas.",
    videoUrl: "https://www.youtube.com/live/fOw8MurOTLs"
  }
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  // --- Estados para Modales Interactivos ---
  const [activeModal, setActiveModal] = useState<"aula" | "biblioteca" | "heroes" | "blogs" | null>(null);

  // --- Aula Interactiva: Estado de la Simulación ---
  const [waveType, setWaveType] = useState<"P" | "S" | "Surface">("S");
  const [frequency, setFrequency] = useState<number>(1.2); // Hz
  const [amplitude, setAmplitude] = useState<number>(30); // px
  const [resonanceStatus, setResonanceStatus] = useState<"Baja" | "RESONANCIA" | "Crítica">("Baja");
  const [isClassroomPlaying, setIsClassroomPlaying] = useState<boolean>(true);
  const [classroomTime, setClassroomTime] = useState<number>(0);

  // --- Biblioteca: Búsqueda y categoría ---
  const [biblioSearch, setBiblioSearch] = useState("");
  const [biblioCategory, setBiblioCategory] = useState<string>("Todos");

  // --- Héroes: Carrusel activo ---
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);

  // --- Blogs: Post seleccionado para leer completo ---
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogItem | null>(null);

  // --- Estados para Formulario de Contacto ---
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      setSubmitStatus("error");
      setSubmitMessage("Por favor, completa todos los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject || "Contacto desde Portafolio Web",
          message: contactMessage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus("success");
        setSubmitMessage("¡Mensaje enviado con éxito! Me pondré en contacto contigo muy pronto.");
        // Limpiar campos
        setContactName("");
        setContactEmail("");
        setContactSubject("");
        setContactMessage("");
      } else {
        setSubmitStatus("error");
        setSubmitMessage(data.error || "Hubo un problema al enviar el mensaje. Intentémoslo de nuevo.");
      }
    } catch (err) {
      console.error("Error submitting contact form:", err);
      // Fallback estático en caso de que no haya backend
      setSubmitStatus("success");
      setSubmitMessage("¡Mensaje enviado con éxito! (Simulado por falta de conexión al servidor local). Puedes escribirme directamente a geologol@gmail.com.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animación del Aula
  useEffect(() => {
    let animFrame: number;
    if (isClassroomPlaying && activeModal === "aula") {
      const update = () => {
        setClassroomTime((prev) => prev + 0.05);
        animFrame = requestAnimationFrame(update);
      };
      animFrame = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isClassroomPlaying, activeModal]);

  // Detector de resonancia básica en el aula virtual
  useEffect(() => {
    const buildingNaturalFreq = 0.8;
    const diff = Math.abs(frequency - buildingNaturalFreq);
    if (diff < 0.15) {
      setResonanceStatus("RESONANCIA");
    } else if (frequency > buildingNaturalFreq + 0.15) {
      setResonanceStatus("Crítica");
    } else {
      setResonanceStatus("Baja");
    }
  }, [frequency]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* =========================================================================
          BARRA DE NAVEGACIÓN (NAVBAR HEIMDALL)
          ========================================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-orange-500/20">
              <Shield className="h-5 w-5 text-slate-950" />
            </div>
            <span className="font-display font-black text-base tracking-wider uppercase bg-gradient-to-r from-amber-400 via-orange-300 to-white bg-clip-text text-transparent">
              HEIMDALL
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <button onClick={() => onNavigate("vulnerabilidad")} className="hover:text-amber-400 transition-colors cursor-pointer">FUNVISIS</button>
            <button onClick={() => onNavigate("fema")} className="hover:text-amber-400 transition-colors cursor-pointer">FEMA P-154</button>
            <button onClick={() => onNavigate("gndt")} className="hover:text-amber-400 transition-colors cursor-pointer">Índice GNDT</button>
            <a href="#herramientas" className="hover:text-amber-400 transition-colors">Metodologías</a>
            <a href="#fuentes-sismologicas" className="hover:text-amber-400 transition-colors">Fuentes Oficiales</a>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate("vulnerabilidad")}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black uppercase py-2.5 px-4 rounded-xl tracking-wider transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Evaluar Edificación</span>
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          SECCIÓN HERO (CABECERA DE HEIMDALL)
          ========================================================================= */}
      <header className="relative w-full pt-32 pb-24 px-6 md:px-12 flex flex-col items-center justify-center text-center min-h-[88vh] overflow-hidden">
        {/* Imagen de fondo de colapso sísmico a lo ancho de la página */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src={earthquakeHero} 
            alt="Vulnerabilidad Sísmica de Edificaciones" 
            className="w-full h-full object-cover opacity-90"
          />
          {/* Degradado sutil solo en bordes superior e inferior para integrar la foto */}
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundImage: 'linear-gradient(to top, rgba(2,6,23,1) 0%, rgba(2,6,23,0.3) 20%, rgba(2,6,23,0.2) 50%, rgba(2,6,23,0.3) 80%, rgba(2,6,23,0.9) 100%)'
            }}
          />
        </div>

        {/* Luces y efectos de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-3xl -z-10 pointer-events-none" />

        {/* Textos Informativos */}
        <div className="relative z-10 space-y-6 flex flex-col items-center max-w-4xl">
          <div className="inline-flex items-center space-x-2 bg-slate-900/90 border border-amber-500/30 px-4 py-1.5 rounded-full text-[11px] font-extrabold text-amber-400 tracking-wider uppercase backdrop-blur-md shadow-lg">
            <Shield className="h-3.5 w-3.5" />
            <span>Guardián de la Seguridad Estructural & Reducción del Riesgo Sísmico</span>
          </div>

          <div className="space-y-4 bg-slate-950/75 backdrop-blur-md px-8 py-7 rounded-3xl border border-slate-800 shadow-2xl shadow-black/60">
            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-white leading-none tracking-tight drop-shadow-xl uppercase">
              HEIMDALL
            </h1>
            <p className="font-display text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
              Sistema de Evaluación de Vulnerabilidad Sísmica de Edificaciones
            </p>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto drop-shadow pt-2">
              Plataforma técnica de inspección rápida, tamizado visual y cálculo numérico de índices de riesgo estructural frente a terremotos. Integra las 3 metodologías de referencia internacional: 
              <strong className="text-amber-400"> FUNVISIS (Venezuela)</strong>, <strong className="text-amber-400">FEMA P-154 (EE.UU.)</strong> y el <strong className="text-amber-400">Índice GNDT Benedetti-Petrini (Italia)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => onNavigate("vulnerabilidad")}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase px-7 py-3.5 rounded-xl transition shadow-xl shadow-orange-500/25 cursor-pointer flex items-center space-x-2"
            >
              <span>Ficha Rápida FUNVISIS</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onNavigate("fema")}
              className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-amber-400 font-bold text-xs uppercase px-7 py-3.5 rounded-xl transition cursor-pointer backdrop-blur-md flex items-center space-x-2"
            >
              <span>Tamizado FEMA P-154</span>
            </button>
            <button 
              onClick={() => onNavigate("gndt")}
              className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/40 text-indigo-400 font-bold text-xs uppercase px-7 py-3.5 rounded-xl transition cursor-pointer backdrop-blur-md flex items-center space-x-2"
            >
              <span>Índice GNDT (11 Parámetros)</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECCIÓN METODOLOGÍAS Y HERRAMIENTAS HEIMDALL
          ========================================================================= */}

      {/* =========================================================================
          SECCIÓN PORTAFOLIO: PLATAFORMA SÍSMICA Y TRABAJOS
          ========================================================================= */}
      <section id="portafolio" className="relative py-24 px-6 border-t border-slate-900 overflow-hidden">
        {/* Imagen de fondo para toda la sección de portafolio */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={collapsedBuilding}
            alt="Fondo sección portafolio"
            className="w-full h-full object-cover opacity-100"
          />
          {/* Overlay sutil solo en bordes — mismo estilo que la sección Hero */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(2,6,23,1) 0%, rgba(2,6,23,0.25) 15%, rgba(2,6,23,0.15) 50%, rgba(2,6,23,0.25) 85%, rgba(2,6,23,0.90) 100%)' }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-display font-black text-3xl md:text-4xl text-white uppercase tracking-wider">
              Portafolio de Proyectos
            </h2>
            <div className="h-1.5 w-16 bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto rounded-full" />
            <p className="text-xs sm:text-sm text-slate-400">
              Explora las aplicaciones técnicas interactivas y los proyectos de ayuda humanitaria y docencia en los que he trabajado.
            </p>
          </div>

          {/* 1. PLATAFORMA HEIMDALL: HERRAMIENTAS DE EVALUACIÓN */}
          <div className="border border-slate-700/80 bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden text-left shadow-2xl">
            {/* Glow decorativo en esquina superior derecha */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-800 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                    Plataforma Heimdall
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">v1.0 Producción</span>
                </div>
                <h3 className="font-display font-black text-2xl md:text-3xl text-white uppercase leading-none">
                  Herramientas Especializadas de Evaluación
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Accede a los 3 motores metodológicos homologados para diagnosticar el nivel de riesgo y vulnerabilidad en edificaciones ante sismos.
                </p>
              </div>
            </div>

            {/* Submódulos Técnicos (Quick Launch - 3 Herramientas) */}
            <div className="relative z-10 space-y-4" id="herramientas">
              <h4 className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                Selecciona la Metodología de Evaluación:
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Módulo 1: FUNVISIS */}
                <div 
                  onClick={() => onNavigate("vulnerabilidad")}
                  className="bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] group shadow-lg hover:shadow-amber-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                      <Globe className="h-6 w-6" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded uppercase">
                      Venezuela
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <h5 className="text-base font-black text-white uppercase group-hover:text-amber-400 transition-colors">
                      Evaluación FUNVISIS
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ficha de Evaluación Rápida de Edificaciones aprobada por FUNVISIS (Venezuela). Analiza datos generales, tipo de estructura, regularidad y elementos no estructurales.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-850/60 flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>Iniciar Ficha FUNVISIS</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Módulo 2: FEMA P-154 */}
                <div 
                  onClick={() => onNavigate("fema")}
                  className="bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] group shadow-lg hover:shadow-amber-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-950/80 border border-orange-800 px-2 py-0.5 rounded uppercase">
                      FEMA / ATC-130
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <h5 className="text-base font-black text-white uppercase group-hover:text-amber-400 transition-colors">
                      Evaluación FEMA P-154 (RVS)
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Rapid Visual Screening of Buildings for Potential Seismic Hazards. Puntajes básicos por tipología estructural modificados por irregularidades, efecto golpeteo y suelo.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-850/60 flex items-center justify-between text-xs font-bold text-orange-400">
                    <span>Iniciar Tamizado RVS</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Módulo 3: GNDT */}
                <div 
                  onClick={() => onNavigate("gndt")}
                  className="bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] group shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                      <Shield className="h-6 w-6" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded uppercase">
                      Italia / Benedetti-Petrini
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <h5 className="text-base font-black text-white uppercase group-hover:text-amber-400 transition-colors">
                      Índice GNDT (11 Parámetros)
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Método matricial numérico de Benedetti-Petrini. Cuantifica 11 parámetros críticos (resistencia, calidad de mampostería, techo, cimentaciones, conservación) con ponderación objetiva.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-850/60 flex items-center justify-between text-xs font-bold text-indigo-400">
                    <span>Calcular Índice GNDT</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            </div>

            {/* GUÍAS TÉCNICAS E INSTRUCCIONES DETALLADAS POR METODOLOGÍA */}
            <div className="relative z-10 space-y-8 pt-8 border-t border-slate-800" id="detalles-metodologias">
              <div className="space-y-2 text-center md:text-left">
                <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Manual de Uso y Fundamentos Técnicos de las Metodologías
                </h4>
                <p className="text-xs text-slate-300">
                  Conozca a detalle los objetivos, creadores, instrucciones de uso, propósito y aporte a la Reducción del Riesgo de Desastres (RRD) de cada herramienta.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8">

                {/* TARJETA DETALLADA 1: FUNVISIS */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded uppercase">
                          FUNVISIS · Venezuela (Norma COVENIN 1756)
                        </span>
                        <h3 className="text-lg md:text-xl font-black text-white uppercase mt-1">
                          Evaluación de Vulnerabilidad Sísmica de Edificaciones (FUNVISIS)
                        </h3>
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigate("vulnerabilidad")}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase px-5 py-2.5 rounded-xl transition cursor-pointer shrink-0 flex items-center space-x-1.5 self-start sm:self-auto shadow-lg shadow-amber-500/10"
                    >
                      <span>Ejecutar Ficha FUNVISIS</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-amber-400 flex items-center gap-1.5">
                          <span>🏢</span> Quién la Desarrolló y Propósito
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Desarrollada por la <strong>Fundación Venezolana de Investigaciones Sismológicas (FUNVISIS)</strong> junto con el Ministerio de Obras Públicas. Su propósito es diagnosticar el grado de susceptibilidad física de edificaciones ante los espectros de aceleración normados en Venezuela (Norma COVENIN 1756).
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-amber-400 flex items-center gap-1.5">
                          <span>📋</span> Instrucciones de Uso Paso a Paso
                        </h5>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                          <li><strong>Identificación sísmica:</strong> Seleccionar la Zona Sísmica (Zonas 1 a 7) y el tipo de terreno (Suelo A, B, C o D).</li>
                          <li><strong>Caracterización estructural:</strong> Determinar el sistema resistente (Pórticos, Muros de concreto, Mampostería o Estructuras mixtas).</li>
                          <li><strong>Inspección de irregularidades:</strong> Evaluar irregularidades en planta (asimetría, torsión) y en elevación (columna corta, piso blando).</li>
                          <li><strong>Estado de conservación:</strong> Registrar grietas en muros o columnas, corrosión de acero o humedad previa.</li>
                          <li><strong>Peligros no estructurales:</strong> Inspeccionar tabiques, paramentos, tanques elevados o voladizos sin anclaje.</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-amber-400 flex items-center gap-1.5">
                          <span>🎯</span> Para Qué Sirve y Qué se Espera de su Uso
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Sirve para emitir un dictamen técnico estandarizado que clasifica la edificación en niveles de riesgo (Bajo, Moderado, Crítico, Colapso). Se espera obtener una ficha homologada utilizable por ingenieros inspectores y autoridades de gestión de riesgos para autorizar uso o indicar adecuaciones estructurales.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-amber-400 flex items-center gap-1.5">
                          <span>🛡️</span> Aporte a la Reducción del Riesgo de Desastres (RRD)
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Permite a gobiernos municipales e instituciones públicas priorizar la inversión de recursos en la adecuación de hospitales, escuelas y sedes de respuesta rápida antes de un sismo destructivo, reduciendo pérdidas humanas y garantizando la resiliencia operativa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* TARJETA DETALLADA 2: FEMA P-154 */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-950/80 border border-orange-800 px-2 py-0.5 rounded uppercase">
                          FEMA / ATC-130 · EE.UU. (Rapid Visual Screening)
                        </span>
                        <h3 className="text-lg md:text-xl font-black text-white uppercase mt-1">
                          Evaluación FEMA P-154 (Tamizado Visual Rápido RVS)
                        </h3>
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigate("fema")}
                      className="bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-black uppercase px-5 py-2.5 rounded-xl transition cursor-pointer shrink-0 flex items-center space-x-1.5 self-start sm:self-auto shadow-lg shadow-orange-500/10"
                    >
                      <span>Ejecutar Tamizado RVS</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-orange-400 flex items-center gap-1.5">
                          <span>🏢</span> Quién la Desarrolló y Propósito
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Desarrollada por la <strong>Federal Emergency Management Agency (FEMA)</strong> junto con el <strong>Applied Technology Council (ATC)</strong> de Estados Unidos. Su propósito es realizar tamizados visuales desde la vía pública para detectar el riesgo de colapso en grandes colectivos de edificaciones sin realizar análisis numéricos complejos iniciales.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-orange-400 flex items-center gap-1.5">
                          <span>📋</span> Instrucciones de Uso Paso a Paso
                        </h5>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                          <li><strong>Nivel de amenaza regional:</strong> Definir si la sismicidad de la región es Baja, Moderada, Alta o Muy Alta.</li>
                          <li><strong>Tipo de edificación:</strong> Asignar el sistema resistente básico (Madera W1/W2, Acero S1-S5, Concreto C1-C3, Mampostería RM1/RM2).</li>
                          <li><strong>Score Básico:</strong> Tomar el Puntaje Básico de Corte (S_base) precalculado por FEMA.</li>
                          <li><strong>Modificadores de Score:</strong> Restar o sumar puntos según irregularidades verticales, en planta, tipo de suelo (A a F), código sísmico de diseño y riesgo de golpeteo sísmico.</li>
                          <li><strong>Puntaje Final $S$:</strong> Si el Score $S$ final es menor que 2.0, el inmueble se clasifica con riesgo potencial y requiere evaluación detallada Nivel 2.</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-orange-400 flex items-center gap-1.5">
                          <span>🎯</span> Para Qué Sirve y Qué se Espera de su Uso
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Sirve para auditar grandes inventarios de edificios urbanos (cientos de construcciones) en pocos días por inspector. Se espera separar rápidamente las estructuras seguras de aquellas que requieren ingeniería de reforzamiento.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-orange-400 flex items-center gap-1.5">
                          <span>🛡️</span> Aporte a la Reducción del Riesgo de Desastres (RRD)
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Facilita a las municipalidades y gobiernos la toma de decisiones basada en datos empíricos, canalizando presupuestos de adecuación de manera quirúrgica y reduciendo el peligro de colapso en escuelas, viviendas e infraestructuras estratégicas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* TARJETA DETALLADA 3: GNDT */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded uppercase">
                          GNDT / CNR · Italia (Benedetti-Petrini)
                        </span>
                        <h3 className="text-lg md:text-xl font-black text-white uppercase mt-1">
                          Índice de Vulnerabilidad GNDT (11 Parámetros)
                        </h3>
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigate("gndt")}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase px-5 py-2.5 rounded-xl transition cursor-pointer shrink-0 flex items-center space-x-1.5 self-start sm:self-auto shadow-lg shadow-indigo-500/10"
                    >
                      <span>Calcular Índice GNDT</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-indigo-400 flex items-center gap-1.5">
                          <span>🏢</span> Quién la Desarrolló y Propósito
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Desarrollada por el <strong>Gruppo Nazionale per la Difesa dai Terremoti (GNDT)</strong> del Consejo Nacional de Investigación de Italia bajo el modelo matemático de <strong>Benedetti y Petrini</strong>. Cuantifica con precisión el índice numérico de vulnerabilidad física de edificaciones de mampostería y concreto.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-indigo-400 flex items-center gap-1.5">
                          <span>📋</span> Instrucciones de Uso Paso a Paso
                        </h5>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                          <li><strong>Calificación de 11 Parámetros:</strong> Inspeccionar los 11 parámetros críticos (organismo resistente, calidad de mampostería, resistencia convencional, cimentación/suelo, diafragmas, regularidad en planta, regularidad en elevación, conexiones de cubierta, elementos no estructurales, estado de conservación y modificaciones preexistentes).</li>
                          <li><strong>Asignar Clase de Vulnerabilidad:</strong> Otorgar a cada parámetro una Clase A (óptimo), B (bueno), C (deficiente) o D (crítico).</li>
                          <li><strong>Ponderación ponderada (w_i):</strong> Multiplicar cada clase por su coeficiente de peso específico establecido por la norma italiana.</li>
                          <li><strong>Índice I_v:</strong> Sumar los valores ponderados para obtener el Índice Global de Vulnerabilidad Iv de la estructura (0% a 100%).</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-indigo-400 flex items-center gap-1.5">
                          <span>🎯</span> Para Qué Sirve y Qué se Espera de su Uso
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Sirve para obtener un valor cuantitativo del riesgo que permite correlacionar el índice Iv con curvas de daño sísmico esperado frente a distintas aceleraciones máximas del suelo (PGA), estimando porcentaje de pérdidas materiales y grado de deterioro estructural.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-white uppercase text-[11px] text-indigo-400 flex items-center gap-1.5">
                          <span>🛡️</span> Aporte a la Reducción del Riesgo de Desastres (RRD)
                        </h5>
                        <p className="leading-relaxed text-slate-300">
                          Permite a los ingenieros calculistas e investigadores proyectar escenarios probabilísticos de daños en cascos históricos y centros urbanos consolidados, sirviendo de base para la planificación de políticas de resiliencia y mitigación a nivel cuantitativo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Fuentes Sismológicas Oficiales */}
            <div className="relative z-10 space-y-4 pt-4 border-t border-slate-850" id="fuentes-sismologicas">
              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                Fuentes Sismológicas Oficiales
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* USGS */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-white uppercase">USGS</p>
                    <p className="text-[8px] text-slate-500">Monitoreo sísmico global</p>
                  </div>
                  <a 
                    href="https://earthquake.usgs.gov/earthquakes/map/?currentFeatureId=us7000t1hd&extent=-37.16032,-189.66797&extent=73.67726,91.58203"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg border border-sky-500/20 transition cursor-pointer shrink-0 text-center"
                  >
                    Ver Mapa
                  </a>
                </div>

                {/* CSN Chile */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-white uppercase">CSN Chile</p>
                    <p className="text-[8px] text-slate-500">Centro Sismológico Nacional</p>
                  </div>
                  <a 
                    href="https://www.csn.uchile.cl/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg border border-amber-500/20 transition cursor-pointer shrink-0 text-center"
                  >
                    Visitar Web
                  </a>
                </div>

                {/* SGC Colombia */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-white uppercase">SGC Colombia</p>
                    <p className="text-[8px] text-slate-500">Servicio Geológico Colombiano</p>
                  </div>
                  <a 
                    href="https://www.sgc.gov.co/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg border border-rose-500/20 transition cursor-pointer shrink-0 text-center"
                  >
                    Visitar Web
                  </a>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          PIE DE PÁGINA (FOOTER)
          ========================================================================= */}
      <footer className="bg-slate-950 py-8 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 text-center">
          <p>© Heimdall 2026. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-2">
            <span>Sistema de Evaluación de Vulnerabilidad Sísmica de Edificaciones</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
