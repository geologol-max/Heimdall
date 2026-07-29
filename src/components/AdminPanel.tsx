import React, { useState, useEffect } from 'react';
import GisMap from './GisMap';
import { 
  InspectionRecord, 
  InspectorUser, 
  UserRole,
  fetchInspections, 
  fetchUsers, 
  createInspectorUser, 
  deleteInspection 
} from '../lib/supabase';
import { 
  BarChart2, 
  Users, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  MapPin, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: InspectorUser | null;
}

export default function AdminPanel({ currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'inspections'>('dashboard');
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [users, setUsers] = useState<InspectorUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario nuevo usuario
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [newRole, setNewRole] = useState<UserRole>('inspector');
  const [userMsg, setUserMsg] = useState<string | null>(null);

  // Buscador inspecciones
  const [searchQuery, setSearchQuery] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    const inspData = await fetchInspections();
    const userData = await fetchUsers();
    setInspections(inspData);
    setUsers(userData);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPassword) return;

    await createInspectorUser(
      newEmail, 
      newName, 
      newOrg || 'Protección Civil Táchira', 
      newPassword, 
      newRole
    );

    const roleName = newRole === 'supervisor' ? 'Supervisor' : 'Inspector';
    setUserMsg(`¡${roleName} ${newName} registrado con éxito! Clave: ${newPassword}`);
    setNewEmail('');
    setNewName('');
    setNewOrg('');
    setNewPassword('123456');
    setNewRole('inspector');
    loadAllData();
    setTimeout(() => setUserMsg(null), 5000);
  };

  const handleDeleteInspection = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este registro de inspección?")) {
      await deleteInspection(id);
      loadAllData();
    }
  };

  // --- MÉTRICAS ESTADÍSTICAS DEL DASHBOARD RRD ---
  const totalInspections = inspections.length;
  const colapsoCount = inspections.filter(i => i.riskLevel === 'COLAPSO').length;
  const altoCount = inspections.filter(i => i.riskLevel === 'ALTO').length;
  const moderadoCount = inspections.filter(i => i.riskLevel === 'MODERADO').length;
  const bajoCount = inspections.filter(i => i.riskLevel === 'BAJO').length;

  const funvisisCount = inspections.filter(i => i.methodology === 'FUNVISIS').length;
  const femaCount = inspections.filter(i => i.methodology === 'FEMA_P154').length;
  const gndtCount = inspections.filter(i => i.methodology === 'GNDT').length;

  const pctCritical = totalInspections > 0 ? (((colapsoCount + altoCount) / totalInspections) * 100).toFixed(1) : '0';

  // --- FUNCIONES DE EXPORTACIÓN ---
  const exportToGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      features: inspections.map(item => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [item.longitude, item.latitude]
        },
        properties: {
          id: item.id,
          buildingName: item.buildingName,
          address: item.address,
          city: item.city,
          methodology: item.methodology,
          riskLevel: item.riskLevel,
          scoreResult: item.scoreResult,
          typology: item.typology,
          inspectorName: item.inspectorName,
          createdAt: item.createdAt
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heimdall_inspections_${Date.now()}.geojson`;
    a.click();
  };

  const exportToCSV = () => {
    const headers = ["ID", "Nombre Edificio", "Ciudad", "Latitud", "Longitud", "Metodologia", "Riesgo", "Puntaje", "Inspector", "Fecha"];
    const rows = inspections.map(item => [
      item.id,
      `"${item.buildingName}"`,
      `"${item.city}"`,
      item.latitude,
      item.longitude,
      item.methodology,
      item.riskLevel,
      item.scoreResult,
      `"${item.inspectorName}"`,
      item.createdAt
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heimdall_inspections_${Date.now()}.csv`;
    a.click();
  };

  const filteredInspections = inspections.filter(item =>
    item.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.inspectorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6 w-full text-left">
      
      {/* HEADER DEL PANEL ADMINISTRADOR */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
            <BarChart2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded uppercase">
                Panel de Control {currentUser?.role === 'admin' ? 'Administrador Único' : 'Supervisor'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">RRD & Resiliencia Urbana</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-display mt-1">
              Dashboard de Inspecciones & Gestión de Usuarios
            </h2>
          </div>
        </div>

        {/* Pestañas del Panel */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Dashboard RRD</span>
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'inspections'
                ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Inspecciones ({inspections.length})</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Gestión Usuarios ({users.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO TAB 1: DASHBOARD DE ANALÍTICA DE RIESGO SÍSMICO */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* MAPA SIG INTEGRADO EN DASHBOARD SUPERVISOR */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">Sistema de Información Geográfica</span>
                <h3 className="text-md font-black text-white uppercase tracking-wider font-display">Mapa de Puntos de Inspección Registrados</h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">San Cristóbal, Táchira</span>
            </div>
            <GisMap currentUser={currentUser} onOpenAuthModal={() => {}} />
          </div>

          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Total Inspeccionado</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-white font-mono">{totalInspections}</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Edificaciones</span>
              </div>
              <p className="text-[10px] text-slate-500">Registradas en base de datos SIG</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Estructuras Críticas</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-red-500 font-mono">{colapsoCount + altoCount}</span>
                <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{pctCritical}% del total</span>
              </div>
              <p className="text-[10px] text-slate-500">Riesgo Alto o Peligro de Colapso</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Metodología Predominante</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-amber-400 font-mono">FUNVISIS</span>
                <span className="text-xs font-bold text-slate-300">{funvisisCount} fichas</span>
              </div>
              <p className="text-[10px] text-slate-500">Evaluación rápida normalizada</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Usuarios Registrados</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-400 font-mono">{users.length}</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Cuentas</span>
              </div>
              <p className="text-[10px] text-slate-500">Admin, Supervisores e Inspectores</p>
            </div>

          </div>

          {/* Gráficos de Distribución del Riesgo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                Distribución por Nivel de Riesgo Sísmico
              </h3>
              
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-red-400">🔴 Peligro de Colapso</span>
                    <span className="text-slate-300">{colapsoCount} ({totalInspections > 0 ? ((colapsoCount/totalInspections)*100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-red-500 transition-all duration-500" 
                      style={{ width: `${totalInspections > 0 ? (colapsoCount/totalInspections)*100 : 0}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-orange-400">🟠 Riesgo Alto</span>
                    <span className="text-slate-300">{altoCount} ({totalInspections > 0 ? ((altoCount/totalInspections)*100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-500" 
                      style={{ width: `${totalInspections > 0 ? (altoCount/totalInspections)*100 : 0}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-yellow-400">🟡 Riesgo Moderado</span>
                    <span className="text-slate-300">{moderadoCount} ({totalInspections > 0 ? ((moderadoCount/totalInspections)*100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-500" 
                      style={{ width: `${totalInspections > 0 ? (moderadoCount/totalInspections)*100 : 0}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-400">🟢 Riesgo Bajo</span>
                    <span className="text-slate-300">{bajoCount} ({totalInspections > 0 ? ((bajoCount/totalInspections)*100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${totalInspections > 0 ? (bajoCount/totalInspections)*100 : 0}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                Uso por Metodología Homologada
              </h3>

              <div className="grid grid-cols-3 gap-4 pt-4 text-center">
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase">FUNVISIS</span>
                  <span className="text-2xl font-black text-white font-mono">{funvisisCount}</span>
                  <span className="text-[9px] text-slate-500 block">Venezuela</span>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono text-orange-400 font-bold block uppercase">FEMA P-154</span>
                  <span className="text-2xl font-black text-white font-mono">{femaCount}</span>
                  <span className="text-[9px] text-slate-500 block">EE.UU. RVS</span>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase">GNDT</span>
                  <span className="text-2xl font-black text-white font-mono">{gndtCount}</span>
                  <span className="text-[9px] text-slate-500 block">Italia (11 Param)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CONTENIDO TAB 2: GESTIÓN DE USUARIOS (SOLO ADMIN) */}
      {activeTab === 'users' && currentUser?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Formulario Crear Usuario */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl h-fit">
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-widest">
                Crear Usuario (Inspector o Supervisor)
              </h3>
              <p className="text-xs text-slate-400">
                Solo existe 1 Administrador único. Puedes crear cuentas para Inspectores o Supervisores.
              </p>
            </div>

            {userMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{userMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Perfil / Rol del Usuario
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="inspector">👷 Inspector de Campo (Realizar evaluaciones)</option>
                  <option value="supervisor">👁️ Supervisor de Riesgo (Ver dashboard y mapa)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Pedro Pérez"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Correo Electrónico (Usuario)
                </label>
                <input
                  type="email"
                  required
                  placeholder="pedro@heimdall.org"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-amber-400" />
                    Contraseña Asignada
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-slate-400 hover:text-amber-400 text-[10px] flex items-center gap-1 font-mono cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showNewPassword ? "Ocultar" : "Mostrar"}</span>
                  </button>
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Ej. clave123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-amber-400 font-mono font-bold placeholder-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Organización
                </label>
                <input
                  type="text"
                  placeholder="Protección Civil Táchira / FUNVISIS"
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Crear Cuenta de Usuario</span>
              </button>
            </form>
          </div>

          {/* Tabla de Usuarios */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              Usuarios y Perfiles Registrados ({users.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-850">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Perfil / Rol</th>
                    <th className="p-3">Organización</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Clave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3 font-bold text-white">{u.fullName}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          u.role === 'supervisor' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {u.role === 'admin' ? '👑 Admin' : u.role === 'supervisor' ? '👁️ Supervisor' : '👷 Inspector'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{u.organization}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">{u.email}</td>
                      <td className="p-3 font-mono text-[11px] text-amber-400 font-bold">{u.password || '••••••'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* CONTENEDOR TAB 3: TABLA DE INSPECCIONES Y EXPORTACIÓN GIS */}
      {activeTab === 'inspections' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                Catastro General de Inspecciones Sísmicas
              </h3>
              <p className="text-xs text-slate-400">
                Descarga de datos para sistemas QGIS / ArcGIS o auditoría de resiliencia física
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportToGeoJSON}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
              >
                <FileCode className="h-4 w-4" />
                <span>Exportar GeoJSON (QGIS)</span>
              </button>

              <button
                onClick={exportToCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
              >
                <Download className="h-4 w-4" />
                <span>Exportar CSV (Excel)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-850">
                <tr>
                  <th className="p-3">Edificación</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3">Metodología</th>
                  <th className="p-3">Dictamen de Riesgo</th>
                  <th className="p-3">Puntaje</th>
                  <th className="p-3">Inspector</th>
                  {currentUser?.role === 'admin' && <th className="p-3">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredInspections.map(item => (
                  <tr key={item.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3 font-bold text-white">
                      <div>{item.buildingName}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{item.typology} · {item.numFloors} pisos</div>
                    </td>
                    <td className="p-3 text-slate-400">
                      <div>{item.city}</div>
                      <div className="text-[9px] font-mono text-slate-500">{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">{item.methodology}</td>
                    <td className="p-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded text-white ${
                        item.riskLevel === 'COLAPSO' ? 'bg-red-600' :
                        item.riskLevel === 'ALTO' ? 'bg-orange-500' :
                        item.riskLevel === 'MODERADO' ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-white">{item.scoreResult}</td>
                    <td className="p-3 text-slate-300">{item.inspectorName}</td>
                    {currentUser?.role === 'admin' && (
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteInspection(item.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
