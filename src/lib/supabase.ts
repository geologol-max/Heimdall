import { createClient } from '@supabase/supabase-js';

// Variables de entorno para Supabase en la nube
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// --- TIPOS DE DATOS ---

export type RiskLevel = 'BAJO' | 'MODERADO' | 'ALTO' | 'COLAPSO';
export type MethodologyType = 'FUNVISIS' | 'FEMA_P154' | 'GNDT';
export type UserRole = 'admin' | 'inspector';

export interface InspectorUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization: string;
  createdAt: string;
}

export interface InspectionRecord {
  id: string;
  inspectorId: string;
  inspectorName: string;
  buildingName: string;
  address: string;
  city: string;
  stateCountry: string;
  latitude: number;
  longitude: number;
  methodology: MethodologyType;
  riskLevel: RiskLevel;
  scoreResult: number;
  typology: string;
  numFloors: number;
  detailsJson: Record<string, any>;
  createdAt: string;
}

// --- DATOS MOCK INICIALES (Fallback cuando Supabase aún no está conectado) ---
const INITIAL_INSPECTIONS: InspectionRecord[] = [
  {
    id: "insp-101",
    inspectorId: "user-1",
    inspectorName: "Ing. Carlos Mendoza",
    buildingName: "Hospital Central de San Cristóbal",
    address: "Av. 19 de Abril con Av. Ferrero Tamayo",
    city: "San Cristóbal",
    stateCountry: "Táchira, Venezuela",
    latitude: 7.7669,
    longitude: -72.2250,
    methodology: "FUNVISIS",
    riskLevel: "ALTO",
    scoreResult: 78.5,
    typology: "Pórticos de Concreto Armado",
    numFloors: 6,
    detailsJson: { columnaCorta: true, pisoBlando: false, sueloTipo: "C" },
    createdAt: "2026-07-26T14:30:00Z"
  },
  {
    id: "insp-102",
    inspectorId: "user-2",
    inspectorName: "Dra. Elena Ramos",
    buildingName: "Liceo Bolivariano Alberto Adriani",
    address: "Calle 14 sector La Concordia",
    city: "San Cristóbal",
    stateCountry: "Táchira, Venezuela",
    latitude: 7.7580,
    longitude: -72.2210,
    methodology: "FEMA_P154",
    riskLevel: "COLAPSO",
    scoreResult: 1.2,
    typology: "Mampostería no Confinada",
    numFloors: 3,
    detailsJson: { scoreBasico: 2.5, modPisoBlando: -1.0, modGolpeteo: -0.3 },
    createdAt: "2026-07-27T09:15:00Z"
  },
  {
    id: "insp-103",
    inspectorId: "user-1",
    inspectorName: "Ing. Carlos Mendoza",
    buildingName: "Torre Empresarial Los Andes",
    address: "Av. Principal Pueblo Nuevo",
    city: "San Cristóbal",
    stateCountry: "Táchira, Venezuela",
    latitude: 7.7810,
    longitude: -72.2130,
    methodology: "GNDT",
    riskLevel: "BAJO",
    scoreResult: 18.2,
    typology: "Muros de Cortante de Concreto",
    numFloors: 12,
    detailsJson: { indiceGndt: 18.2, conservacion: "Excelente" },
    createdAt: "2026-07-27T16:45:00Z"
  },
  {
    id: "insp-104",
    inspectorId: "user-3",
    inspectorName: "Arq. Sofia Paredes",
    buildingName: "Colegio de Ingenieros del Estado Táchira",
    address: "Av. Universidad, Las Lomas",
    city: "San Cristóbal",
    stateCountry: "Táchira, Venezuela",
    latitude: 7.7720,
    longitude: -72.2340,
    methodology: "FUNVISIS",
    riskLevel: "MODERADO",
    scoreResult: 45.0,
    typology: "Estructura Mixta Acero-Concreto",
    numFloors: 4,
    detailsJson: { irregularidadPlanta: true },
    createdAt: "2026-07-27T18:20:00Z"
  }
];

const INITIAL_USERS: InspectorUser[] = [
  {
    id: "admin-1",
    email: "admin@heimdall.org",
    fullName: "Administrador Heimdall",
    role: "admin",
    organization: "Unidad de Gestión del Riesgo",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "user-1",
    email: "carlos.mendoza@heimdall.org",
    fullName: "Ing. Carlos Mendoza",
    role: "inspector",
    organization: "Protección Civil",
    createdAt: "2026-02-10T00:00:00Z"
  },
  {
    id: "user-2",
    email: "elena.ramos@heimdall.org",
    fullName: "Dra. Elena Ramos",
    role: "inspector",
    organization: "FUNVISIS Inspectoría",
    createdAt: "2026-03-15T00:00:00Z"
  }
];

// --- FUNCIONES DE SERVICIO ---

export async function fetchInspections(): Promise<InspectionRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data) {
        return data as InspectionRecord[];
      }
    } catch (err) {
      console.warn("Supabase fetch error, fallback to local storage:", err);
    }
  }

  // Fallback Local Storage
  const localData = localStorage.getItem('heimdall_inspections');
  if (localData) {
    return JSON.parse(localData);
  }

  localStorage.setItem('heimdall_inspections', JSON.stringify(INITIAL_INSPECTIONS));
  return INITIAL_INSPECTIONS;
}

export async function saveInspection(record: Omit<InspectionRecord, 'id' | 'createdAt'>): Promise<InspectionRecord> {
  const newRecord: InspectionRecord = {
    ...record,
    id: `insp-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert([newRecord])
        .select();

      if (!error && data && data.length > 0) {
        return data[0] as InspectionRecord;
      }
    } catch (err) {
      console.warn("Supabase insert error, saving locally:", err);
    }
  }

  // Fallback Local Storage
  const current = await fetchInspections();
  const updated = [newRecord, ...current];
  localStorage.setItem('heimdall_inspections', JSON.stringify(updated));
  return newRecord;
}

export async function deleteInspection(id: string): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from('inspections').delete().eq('id', id);
    } catch (err) {
      console.warn("Supabase delete error:", err);
    }
  }

  const current = await fetchInspections();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem('heimdall_inspections', JSON.stringify(updated));
  return true;
}

export async function fetchUsers(): Promise<InspectorUser[]> {
  const localUsers = localStorage.getItem('heimdall_users');
  if (localUsers) {
    return JSON.parse(localUsers);
  }
  localStorage.setItem('heimdall_users', JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
}

export async function createInspectorUser(email: string, fullName: string, organization: string): Promise<InspectorUser> {
  const newUser: InspectorUser = {
    id: `user-${Date.now()}`,
    email,
    fullName,
    role: 'inspector',
    organization,
    createdAt: new Date().toISOString()
  };

  const users = await fetchUsers();
  const updated = [...users, newUser];
  localStorage.setItem('heimdall_users', JSON.stringify(updated));
  return newUser;
}
