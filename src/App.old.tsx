import { useState, useEffect } from 'react';
import { 
  Users, 
  PlusCircle, 
  BarChart3, 
  Activity, 
  MapPin, 
  ShieldAlert, 
  LogOut,
  Menu,
  X,
  Search,
  Filter,
  Download,
  Clock,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, differenceInYears, parseISO } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import socket from './socket';
import { Record, NewRecord, FormValues } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const recordSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  locality: z.string().min(1, "Localidade obrigatória"),
  hasDisability: z.boolean(),
  disabilityType: z.string().optional(),
  situation: z.string().min(1, "Situação obrigatória"),
  socialHistory: z.string().optional(),
  employmentStatus: z.string().min(1, "Status de emprego obrigatório"),
  helpNeeded: z.string().min(1, "Tipo de ajuda obrigatório"),
  referral: z.string().min(1, "Encaminhamento obrigatório"),
  agentId: z.string().min(1, "ID do agente obrigatório"),
  stationId: z.string().min(1, "ID do posto obrigatório"),
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'records'>('dashboard');
  const [records, setRecords] = useState<Record[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecords();

    socket.on('record:added', (newRecord: Record) => {
      setRecords(prev => [newRecord, ...prev]);
    });

    return () => {
      socket.off('record:added');
    };
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      setRecords(data as Record[]);
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setIsLoading(false);
    }
  };

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      hasDisability: false,
      agentId: "AG-001",
      stationId: "ST-CENTRAL"
    }
  });

  const hasDisability = watch('hasDisability');

  const onSubmit = async (data: FormValues) => {
    const age = differenceInYears(new Date(), parseISO(data.birthDate));
    const payload: NewRecord = { ...data, age };

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        reset();
        setActiveTab('records');
      }
    } catch (error) {
      console.error("Failed to submit record", error);
    }
  };

  const stats = {
    total: records.length,
    disability: records.filter(r => r.hasDisability).length,
    unemployed: records.filter(r => r.employmentStatus === 'Desempregado').length,
    today: records.filter(r => format(parseISO(r.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length
  };

  const chartData = records.reduce((acc: any[], r) => {
    const date = format(parseISO(r.timestamp), 'dd/MM');
    const existing = acc.find(a => a.date === date);
    if (existing) existing.count++;
    else acc.push({ date, count: 1 });
    return acc;
  }, []).slice(-7);

  const disabilityData = [
    { name: 'Com Deficiência', value: stats.disability },
    { name: 'Sem Deficiência', value: stats.total - stats.disability }
  ];

  const COLORS = ['#3b82f6', '#e2e8f0'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldAlert className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SGIS Impact</h1>
          </div>

          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'dashboard' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <BarChart3 size={20} />
              <span className="font-medium">Dashboard</span>
            </button>
            <button 
              onClick={() => { setActiveTab('form'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'form' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <UserPlus size={20} />
              <span className="font-medium">Novo Atendimento</span>
            </button>
            <button 
              onClick={() => { setActiveTab('records'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === 'records' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Activity size={20} />
              <span className="font-medium">Live Feed</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">JD</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">João Doria</p>
                <p className="text-xs truncate">Agente de Campo</p>
              </div>
              <LogOut size={16} className="cursor-pointer hover:text-white" />
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
              {activeTab === 'dashboard' ? 'Visão Geral' : activeTab === 'form' ? 'Coleta de Dados' : 'Monitoramento em Tempo Real'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-sm">
              <Clock size={16} />
              <span>{format(new Date(), 'HH:mm')}</span>
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Download size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Atendimentos', value: stats.total, icon: Users, color: 'blue' },
                    { label: 'Pessoas com Deficiência', value: stats.disability, icon: ShieldAlert, color: 'emerald' },
                    { label: 'Em Situação de Desemprego', value: stats.unemployed, icon: Activity, color: 'orange' },
                    { label: 'Atendimentos Hoje', value: stats.today, icon: Clock, color: 'indigo' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          stat.color === 'blue' && "bg-blue-50 text-blue-500",
                          stat.color === 'emerald' && "bg-emerald-50 text-emerald-500",
                          stat.color === 'orange' && "bg-orange-50 text-orange-500",
                          stat.color === 'indigo' && "bg-indigo-50 text-indigo-500",
                        )}>
                          <stat.icon size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Tendência de Atendimentos (7 dias)</h3>
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
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Perfil de Vulnerabilidade (PCD)</h3>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={disabilityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {disabilityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold">{Math.round((stats.disability / (stats.total || 1)) * 100)}%</span>
                        <span className="text-xs text-slate-400">PCD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'form' && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Formulário de Assistência Social</h3>
                    <p className="text-sm text-slate-500">Preencha todos os campos obrigatórios para o registro.</p>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                    {/* Identificação Section */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-600 font-semibold mb-4">
                        <Users size={18} />
                        <span>Identificação do Cidadão</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                          <input 
                            {...register('name')}
                            className={cn(
                              "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                              errors.name ? "border-red-300" : "border-slate-200"
                            )}
                            placeholder="Ex: João Silva"
                          />
                          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Data de Nascimento</label>
                          <input 
                            type="date"
                            {...register('birthDate')}
                            className={cn(
                              "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all",
                              errors.birthDate ? "border-red-300" : "border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Bairro</label>
                          <input 
                            {...register('neighborhood')}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="Ex: Centro"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Localidade</label>
                          <input 
                            {...register('locality')}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="Ex: Posto 1"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Vulnerabilidade Section */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-4">
                        <ShieldAlert size={18} />
                        <span>Vulnerabilidade e Saúde</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <input 
                            type="checkbox"
                            {...register('hasDisability')}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm font-medium text-slate-700">Possui algum tipo de deficiência (PCD)?</label>
                        </div>
                        
                        {hasDisability && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-1.5"
                          >
                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Deficiência</label>
                            <select 
                              {...register('disabilityType')}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            >
                              <option value="">Selecione...</option>
                              <option value="Física">Física</option>
                              <option value="Visual">Visual</option>
                              <option value="Auditiva">Auditiva</option>
                              <option value="Intelectual">Intelectual</option>
                              <option value="Múltipla">Múltipla</option>
                            </select>
                          </motion.div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Situação Atual</label>
                          <select 
                            {...register('situation')}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          >
                            <option value="">Selecione...</option>
                            <option value="Crítica">Crítica (Urgente)</option>
                            <option value="Moderada">Moderada</option>
                            <option value="Estável">Estável</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* Contexto Social Section */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-orange-600 font-semibold mb-4">
                        <Activity size={18} />
                        <span>Contexto Social e Ação</span>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Status de Emprego</label>
                          <select 
                            {...register('employmentStatus')}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          >
                            <option value="">Selecione...</option>
                            <option value="Empregado">Empregado</option>
                            <option value="Desempregado">Desempregado</option>
                            <option value="Autônomo">Autônomo</option>
                            <option value="Aposentado">Aposentado</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">História Social (Resumo)</label>
                          <textarea 
                            {...register('socialHistory')}
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                            placeholder="Descreva brevemente o contexto familiar e social..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Ajuda Necessária</label>
                            <input 
                              {...register('helpNeeded')}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                              placeholder="Ex: Cesta Básica"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Encaminhamento</label>
                            <input 
                              {...register('referral')}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                              placeholder="Ex: CRAS Central"
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="pt-6">
                      <button 
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <PlusCircle size={20} />
                        Finalizar Registro de Atendimento
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'records' && (
              <motion.div 
                key="records"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                      placeholder="Buscar por nome ou bairro..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      <Filter size={16} />
                      Filtros
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cidadão</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vulnerabilidade</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Localidade</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data/Hora</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {records.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-xs">
                                  {record.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{record.name}</p>
                                  <p className="text-xs text-slate-500">{record.age} anos • {record.employmentStatus}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                  record.situation === 'Crítica' ? "bg-red-50 text-red-600" : 
                                  record.situation === 'Moderada' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                  {record.situation}
                                </span>
                                {record.hasDisability && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
                                    PCD: {record.disabilityType}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <MapPin size={14} className="text-slate-400" />
                                <span className="text-sm">{record.neighborhood}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-600">{format(parseISO(record.timestamp), 'dd/MM/yy')}</p>
                              <p className="text-xs text-slate-400">{format(parseISO(record.timestamp), 'HH:mm')}</p>
                            </td>
                            <td className="px-6 py-4">
                              <button className="text-xs font-bold text-blue-500 hover:text-blue-600 uppercase tracking-wider">Ver Detalhes</button>
                            </td>
                          </tr>
                        ))}
                        {records.length === 0 && !isLoading && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                              Nenhum registro encontrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
