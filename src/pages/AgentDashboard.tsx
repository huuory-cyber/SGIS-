import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, getRecords } from '../lib/supabase';
import { 
  Users, PlusCircle, Activity, LogOut, Menu, Clock, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SocialRecord } from '../types';
import EnhancedForm from '../components/EnhancedForm';
import RecordsTable from '../components/RecordsTable';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AgentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'form'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [records, setRecords] = useState<SocialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecords();
    
    // Real-time subscription for new records
    const channel = supabase
      .channel('social_records_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'social_records',
        filter: `agent_id=eq.${user?.station_id}` // Filter by agent's station
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
  }, [user?.station_id]);

  const loadRecords = async () => {
    try {
      const recordsData = await getRecords();
      // Filter records by agent's station
      const agentRecords = (recordsData as SocialRecord[]).filter(r => 
        r.station_id === user?.station_id
      );
      setRecords(agentRecords);
    } catch (error) {
      console.error('Failed to load records:', error);
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
    today: records.filter(r => format(parseISO(r.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
    critical: records.filter(r => r.situation === 'Crítica').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SGIS Impact</h1>
              <p className="text-xs text-slate-400">Painel do Agente</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'overview' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Activity size={20} />
              <span className="font-medium">Visão Geral</span>
            </button>
            <button 
              onClick={() => { setActiveTab('records'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'records' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Activity size={20} />
              <span className="font-medium">Meus Registros</span>
            </button>
            <button 
              onClick={() => { setActiveTab('form'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'form' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <PlusCircle size={20} />
              <span className="font-medium">Novo Registro</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Agente'}</p>
                <p className="text-xs truncate text-indigo-400">Agente de Campo</p>
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
               activeTab === 'records' ? 'Meus Registros' : 'Novo Registro'}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total de Registros', value: stats.total, icon: Users, color: 'indigo' },
                    { label: 'Registros Hoje', value: stats.today, icon: Clock, color: 'emerald' },
                    { label: 'Casos Críticos', value: stats.critical, icon: Activity, color: 'red' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        stat.color === 'indigo' && "bg-indigo-50 text-indigo-500",
                        stat.color === 'emerald' && "bg-emerald-50 text-emerald-500",
                        stat.color === 'red' && "bg-red-50 text-red-500",
                      )}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-4">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Atividade Recente</h3>
                  {records.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nenhum registro ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {records.slice(0, 5).map((record) => (
                        <div key={record.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-sm">
                            {record.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{record.name}</p>
                            <p className="text-xs text-slate-500">{record.neighborhood}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">{format(parseISO(record.created_at), 'dd/MM')}</p>
                            <p className="text-xs text-slate-400">{format(parseISO(record.created_at), 'HH:mm')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                <RecordsTable records={records} isAdmin={false} />
              </motion.div>
            )}

            {activeTab === 'form' && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <EnhancedForm onSubmit={loadRecords} />
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
