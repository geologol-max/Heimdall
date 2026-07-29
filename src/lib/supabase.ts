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
export type UserRole = 'admin' | 'supervisor' | 'inspector';

export interface InspectorUser {
  id: string;
  email: string;
  password?: string;
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

// --- DATOS MOCK INICIALES (Fallback cuando Supabase no tenga datos aún) ---
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
  }
];

const INITIAL_USERS: InspectorUser[] = [
  {
    id: "admin-1",
    email: "admin@heimdall.org",
    password: "admin123",
    fullName: "Administrador Heimdall",
    role: "admin",
    organization: "Unidad de Gestión del Riesgo",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "user-super-1",
    email: "supervisor@heimdall.org",
    password: "super123",
    fullName: "Ing. Javier Torrealba",
    role: "supervisor",
    organization: "Supervisión RRD Táchira",
    createdAt: "2026-01-15T00:00:00Z"
  },
  {
    id: "user-1",
    email: "inspector@heimdall.org",
    password: "123456",
    fullName: "Ing. Carlos Mendoza",
    role: "inspector",
    organization: "Protección Civil Táchira",
    createdAt: "2026-02-10T00:00:00Z"
  }
];

// --- ADAPTADORES DE MAPEADO CAMELCASE <-> SNAKE_CASE ---

function dbToInspection(row: any): InspectionRecord {
  return {
    id: row.id,
    inspectorId: row.inspector_id || '',
    inspectorName: row.inspector_name || 'Inspector de Campo',
    buildingName: row.building_name || '',
    address: row.address || '',
    city: row.city || 'San Cristóbal',
    stateCountry: row.state_country || 'Táchira, Venezuela',
    latitude: Number(row.latitude) || 7.7669,
    longitude: Number(row.longitude) || -72.2250,
    methodology: row.methodology || 'FUNVISIS',
    riskLevel: row.risk_level || 'BAJO',
    scoreResult: Number(row.score_result) || 0,
    typology: row.typology || '',
    numFloors: Number(row.num_floors) || 1,
    detailsJson: row.details_json || {},
    createdAt: row.created_at || new Date().toISOString()
  };
}

function inspectionToDb(rec: Omit<InspectionRecord, 'id' | 'createdAt'>) {
  return {
    inspector_id: rec.inspectorId,
    inspector_name: rec.inspectorName,
    building_name: rec.buildingName,
    address: rec.address,
    city: rec.city,
    state_country: rec.stateCountry,
    latitude: rec.latitude,
    longitude: rec.longitude,
    methodology: rec.methodology,
    risk_level: rec.riskLevel,
    score_result: rec.scoreResult,
    typology: rec.typology,
    num_floors: rec.numFloors,
    details_json: rec.detailsJson
  };
}

function dbToUser(row: any): InspectorUser {
  return {
    id: row.id,
    email: row.email,
    password: row.password || '',
    fullName: row.full_name,
    role: (row.role as UserRole) || 'inspector',
    organization: row.organization || '',
    createdAt: row.created_at || new Date().toISOString()
  };
}

// --- FUNCIONES DE SERVICIO ---

export async function fetchInspections(): Promise<InspectionRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(dbToInspection);
      }
    } catch (err) {
      console.warn("Error al consultar Supabase (inspecciones):", err);
    }
  }

  const localData = localStorage.getItem('heimdall_inspections');
  if (localData) {
    return JSON.parse(localData);
  }

  localStorage.setItem('heimdall_inspections', JSON.stringify(INITIAL_INSPECTIONS));
  return INITIAL_INSPECTIONS;
}

export async function saveInspection(record: Omit<InspectionRecord, 'id' | 'createdAt'>): Promise<InspectionRecord> {
  const dbData = inspectionToDb(record);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert([dbData])
        .select();

      if (!error && data && data.length > 0) {
        const newRecord = dbToInspection(data[0]);
        const current = await fetchInspections();
        localStorage.setItem('heimdall_inspections', JSON.stringify([newRecord, ...current.filter(i => i.id !== newRecord.id)]));
        return newRecord;
      } else if (error) {
        console.error("Error al insertar inspección en Supabase:", error);
      }
    } catch (err) {
      console.warn("Excepción al guardar en Supabase:", err);
    }
  }

  const newRecord: InspectionRecord = {
    ...record,
    id: `insp-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

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
      console.warn("Error al eliminar en Supabase:", err);
    }
  }

  const current = await fetchInspections();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem('heimdall_inspections', JSON.stringify(updated));
  return true;
}

export async function fetchUsers(): Promise<InspectorUser[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(dbToUser);
      }
    } catch (err) {
      console.warn("Error al consultar usuarios en Supabase:", err);
    }
  }

  const localUsers = localStorage.getItem('heimdall_users');
  if (localUsers) {
    return JSON.parse(localUsers);
  }
  localStorage.setItem('heimdall_users', JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
}

export async function createInspectorUser(
  email: string, 
  fullName: string, 
  organization: string, 
  password: string,
  role: UserRole = 'inspector'
): Promise<InspectorUser> {
  const dbUser = {
    email: email.toLowerCase().trim(),
    password: password || '123456',
    full_name: fullName,
    role: role,
    organization: organization || 'Protección Civil Táchira'
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([dbUser])
        .select();

      if (!error && data && data.length > 0) {
        const newUser = dbToUser(data[0]);
        const users = await fetchUsers();
        localStorage.setItem('heimdall_users', JSON.stringify([...users.filter(u => u.id !== newUser.id), newUser]));
        return newUser;
      } else if (error) {
        console.error("Error al insertar usuario en Supabase:", error);
      }
    } catch (err) {
      console.warn("Excepción al guardar usuario en Supabase:", err);
    }
  }

  const newUser: InspectorUser = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase().trim(),
    password: password || '123456',
    fullName,
    role: role,
    organization,
    createdAt: new Date().toISOString()
  };

  const users = await fetchUsers();
  const updated = [...users, newUser];
  localStorage.setItem('heimdall_users', JSON.stringify(updated));
  return newUser;
}

export async function authenticateUser(email: string, passwordInput: string): Promise<InspectorUser | null> {
  const users = await fetchUsers();
  const match = users.find(u => 
    u.email.toLowerCase().trim() === email.toLowerCase().trim() &&
    (!u.password || u.password === passwordInput)
  );

  return match || null;
}
