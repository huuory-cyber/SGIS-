import { useState, useEffect } from 'react';
import { BarChart3, Calendar, TrendingUp, TrendingDown, Minus, Download, RefreshCw } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  getDailyStats,
  getDisabilityDistribution,
  getLocationStats,
  generateMonthlySummary,
  generateQuarterlyImpact,
  getAdminDashboardStats,
} from '../lib/analytics';
import { exportMonthlySummaryToExcel, exportQuarterlyImpactToExcel } from '../lib/export';
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
  Line,
  Legend,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export default function TemporalDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [disabilityData, setDisabilityData] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange, selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dashboardStats = await getAdminDashboardStats();
      setStats(dashboardStats);

      // Load data based on time range
      switch (timeRange) {
        case 'daily':
          const dailyStats = await getDailyStats(selectedDate);
          setChartData(dailyStats);
          break;
        case 'weekly':
        case 'monthly':
          const disabilityStats = await getDisabilityDistribution(4);
          setDisabilityData(disabilityStats);
          const locStats = await getLocationStats(1);
          setLocationData(locStats);
          break;
        case 'quarterly':
          const quarter = Math.floor(selectedDate.getMonth() / 3) + 1;
          const impact = await generateQuarterlyImpact(quarter, selectedDate.getFullYear());
          setChartData([impact]);
          break;
        case 'annual':
          // Load annual data
          break;
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (timeRange === 'monthly') {
        const summary = await generateMonthlySummary(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
        const filename = `relatorio_mensal_${selectedDate.getMonth() + 1}_${selectedDate.getFullYear()}.xlsx`;
        exportMonthlySummaryToExcel(summary, filename);
      } else if (timeRange === 'quarterly') {
        const quarter = Math.floor(selectedDate.getMonth() / 3) + 1;
        const impact = await generateQuarterlyImpact(quarter, selectedDate.getFullYear());
        const filename = `relatorio_trimestral_Q${quarter}_${selectedDate.getFullYear()}.xlsx`;
        exportQuarterlyImpactToExcel(impact, filename);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Erro ao exportar relatório.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Temporal</h2>
          <p className="text-sm text-slate-500">Análise de dados por período de tempo</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isLoading 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar size={20} className="text-slate-400" />
          {(['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                timeRange === range
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {range === 'daily' && 'Diário'}
              {range === 'weekly' && 'Semanal'}
              {range === 'monthly' && 'Mensal'}
              {range === 'quarterly' && 'Trimestral'}
              {range === 'annual' && 'Anual'}
            </button>
          ))}
          
          <input
            type="month"
            value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => setSelectedDate(new Date(e.target.value + '-01'))}
            className="ml-auto px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Registros</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <BarChart3 size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Com Deficiência</p>
                <p className="text-2xl font-bold text-orange-600">{stats.disability}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Desempregados</p>
                <p className="text-2xl font-bold text-purple-600">{stats.unemployed}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Situação Crítica</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <Minus size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disability Distribution */}
        {disabilityData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Distribuição por Deficiência</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={disabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.type}: ${entry.percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {disabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Location Stats */}
        {locationData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Top Localizações</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="neighborhood" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quarterly Impact */}
      {timeRange === 'quarterly' && chartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo Trimestral</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chartData.map((impact) => (
              <div key={impact.quarter} className="space-y-4">
                <div className="text-center pb-4 border-b border-slate-100">
                  <p className="text-sm text-slate-500">Q{impact.quarter} {impact.year}</p>
                  <p className="text-3xl font-bold text-slate-900">{impact.total_records}</p>
                  <p className="text-xs text-slate-500">registros</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Média Diária</span>
                    <span className="font-medium">{impact.avg_daily}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tendência</span>
                    <span className={cn(
                      "font-medium",
                      impact.trend === 'increasing' ? "text-green-600" :
                      impact.trend === 'decreasing' ? "text-red-600" :
                      "text-slate-600"
                    )}>
                      {impact.trend === 'increasing' && '↗ Crescente'}
                      {impact.trend === 'decreasing' && '↘ Decrescente'}
                      {impact.trend === 'stable' && '→ Estável'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Mudança Vulnerabilidade</span>
                    <span className={cn(
                      "font-medium",
                      impact.vulnerability_change > 0 ? "text-red-600" :
                      impact.vulnerability_change < 0 ? "text-green-600" :
                      "text-slate-600"
                    )}>
                      {impact.vulnerability_change > 0 ? '+' : ''}{impact.vulnerability_change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
