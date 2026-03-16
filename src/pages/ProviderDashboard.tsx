import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, getRecords, getStations, getAgents } from '../lib/supabase';
import { 
  Users, PlusCircle, BarChart3, Activity, MapPin, ShieldAlert, LogOut,
  Menu, Clock, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SocialRecord, Station, Agent } from '../types';
import EnhancedForm from '../components/EnhancedForm';
import RecordsTable from '../components/RecordsTable';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProviderDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'stations' | 'form'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [records, setRecords] = useState<SocialRecord[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Real-time subscription for new records
    const channel = supabase
      .channel('social_records_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'social_records',
        filter: `provider_id=eq.${user?.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRecords(prev => [payload.new as SocialRecord, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as SocialRecord : r));
        } else if (payload.eventType === 'DELETE') {
          setRecords(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      const [recordsData, stationsData, agentsData] = await Promise.all([
        getRecords(user.id),
        getStations(user.id),
        getAgents(user.id),
      ]);
      setRecords(recordsData as SocialRecord[]);
      setStations(stationsData as Station[]);
      setAgents(agentsData as Agent[]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const stats = {
    total: records.length,
    disability: records.filter(r => r.has_disability).length,
    unemployed: records.filter(r => r.employment_status === 'Desempregado').length,
    critical: records.filter(r => r.situation === 'Crítica').length,
    today: records.filter(r => format(parseISO(r.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
    stations: stations.length,
    agents: agents.length,
  };

  const chartData = records.reduce((acc: any[], r) => {
    const date = format(parseISO(r.created_at), 'dd/MM');
    const existing = acc.find(a => a.date === date);
    if (existing) existing.count++;
    else acc.push({ date, count: 1 });
    return acc;
  }, []).slice(-7);

  const situationData = [
    { name: 'Crítica', value: stats.critical, color: '#ef4444' },
    { name: 'Moderada', value: records.filter(r => r.situation === 'Moderada').length, color: '#f97316' },
    { name: 'Estável', value: records.filter(r => r.situation === 'Estável').length, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SGIS Impact</h1>
              <p className="text-xs text-slate-400">Painel do Provedor</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'overview' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <BarChart3 size={20} />
              <span className="font-medium">Visão Geral</span>
            </button>
            <button 
              onClick={() => { setActiveTab('records'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'records' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Activity size={20} />
              <span className="font-medium">Registros</span>
            </button>
            <button 
              onClick={() => { setActiveTab('stations'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'stations' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <MapPin size={20} />
              <span className="font-medium">Meus Postos</span>
            </button>
            <button 
              onClick={() => { setActiveTab('form'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'form' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <PlusCircle size={20} />
              <span className="font-medium">Novo Registro</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.full_name?.charAt(0) || 'P'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Provedor'}</p>
                <p className="text-xs truncate text-emerald-400">Provedor de Serviços</p>
              </div>
              <button onClick={handleSignOut} className="hover:text-white transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {activeTab === 'overview' ? 'Visão Geral' : 
               activeTab === 'records' ? 'Registros de Atendimento' :
               activeTab === 'stations' ? 'Meus Postos' : 'Novo Registro'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-sm">
              <Clock size={16} />
              <span>{format(new Date(), 'HH:mm')}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Atendimentos', value: stats.total, icon: Users, color: 'emerald' },
                    { label: 'Situação Crítica', value: stats.critical, icon: ShieldAlert, color: 'red' },
                    { label: 'Desempregados', value: stats.unemployed, icon: Activity, color: 'orange' },
                    { label: 'Postos Ativos', value: stats.stations, icon: MapPin, color: 'blue' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        stat.color === 'emerald' && "bg-emerald-50 text-emerald-500",
                        stat.color === 'red' && "bg-red-50 text-red-500",
                        stat.color === 'orange' && "bg-orange-50 text-orange-500",
                        stat.color === 'blue' && "bg-blue-50 text-blue-500",
                      )}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-4">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Tendência (7 dias)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Situação dos Casos</h3>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={situationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {situationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'records' && (
              <motion.div 
                key="records"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RecordsTable
                  records={records}
                  isAdmin={false}
                  onRecordUpdated={loadData}
                  onRecordDeleted={loadData}
                />
              </motion.div>
            )}

            {activeTab === 'stations' && (
              <motion.div 
                key="stations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {stations.map((station) => (
                  <div key={station.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                      <MapPin size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{station.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{station.neighborhood}, {station.locality}</span>
                      </div>
                      {station.address && (
                        <div className="text-slate-500 text-xs truncate">
                          {station.address}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'form' && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <EnhancedForm onSubmit={loadData} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
