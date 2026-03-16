import { useState } from 'react';
import { Search, Filter, MapPin, Eye, Calendar, User, Image as ImageIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SocialRecord } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RecordsTableProps {
  records: SocialRecord[];
  isAdmin?: boolean;
}

export default function RecordsTable({ records, isAdmin = false }: RecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSituation, setFilterSituation] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<SocialRecord | null>(null);

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterSituation === 'all' || 
      record.situation === filterSituation;
    
    return matchesSearch && matchesFilter;
  });

  const getSituationColor = (situation: string) => {
    switch (situation) {
      case 'Crítica': return 'bg-red-50 text-red-600';
      case 'Moderada': return 'bg-orange-50 text-orange-600';
      case 'Estável': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
            placeholder="Buscar por nome ou bairro..."
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterSituation}
            onChange={(e) => setFilterSituation(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="all">Todas Situações</option>
            <option value="Crítica">Crítica</option>
            <option value="Moderada">Moderada</option>
            <option value="Estável">Estável</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-xs">
                        {record.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{record.name}</p>
                        <p className="text-xs text-slate-500">{record.age} anos • {record.employment_status}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        getSituationColor(record.situation)
                      )}>
                        {record.situation}
                      </span>
                      {record.has_disability && record.disability_type && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
                          PCD: {record.disability_type}
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
                    <p className="text-sm text-slate-600">{format(parseISO(record.created_at), 'dd/MM/yy')}</p>
                    <p className="text-xs text-slate-400">{format(parseISO(record.created_at), 'HH:mm')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedRecord(record)}
                      className="text-xs font-bold text-blue-500 hover:text-blue-600 uppercase tracking-wider flex items-center gap-1"
                    >
                      <Eye size={14} />
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
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

      {/* Detail Modal */}
      {selectedRecord && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-lg">
                    {selectedRecord.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedRecord.name}</h3>
                    <p className="text-sm text-slate-500">{selectedRecord.age} anos</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Informações Pessoais</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Data de Nascimento</p>
                    <p className="text-sm font-medium text-slate-800">{format(parseISO(selectedRecord.birth_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Gênero</p>
                    <p className="text-sm font-medium text-slate-800">{selectedRecord.gender || 'Não informado'}</p>
                  </div>
                  {selectedRecord.phone && (
                    <div>
                      <p className="text-xs text-slate-500">Telefone</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.phone}</p>
                    </div>
                  )}
                  {selectedRecord.email && (
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.email}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Location */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Localização</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Bairro</p>
                    <p className="text-sm font-medium text-slate-800">{selectedRecord.neighborhood}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Localidade</p>
                    <p className="text-sm font-medium text-slate-800">{selectedRecord.locality}</p>
                  </div>
                  {selectedRecord.address && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Endereço</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.address}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Family & Social Context */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Contexto Familiar e Social</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedRecord.family_size !== undefined && (
                    <div>
                      <p className="text-xs text-slate-500">Tamanho da Família</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.family_size} pessoas</p>
                    </div>
                  )}
                  {selectedRecord.dependents !== undefined && (
                    <div>
                      <p className="text-xs text-slate-500">Dependentes</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.dependents}</p>
                    </div>
                  )}
                  {selectedRecord.education_level && (
                    <div>
                      <p className="text-xs text-slate-500">Escolaridade</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.education_level}</p>
                    </div>
                  )}
                  {selectedRecord.monthly_income !== undefined && (
                    <div>
                      <p className="text-xs text-slate-500">Renda Mensal</p>
                      <p className="text-sm font-medium text-slate-800">
                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(selectedRecord.monthly_income)}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Health & Vulnerability */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Saúde e Vulnerabilidade</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      getSituationColor(selectedRecord.situation)
                    )}>
                      {selectedRecord.situation}
                    </span>
                    {selectedRecord.has_disability && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
                        PCD
                      </span>
                    )}
                  </div>
                  {selectedRecord.disability_type && (
                    <div>
                      <p className="text-xs text-slate-500">Tipo de Deficiência</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.disability_type}</p>
                    </div>
                  )}
                  {selectedRecord.health_condition && (
                    <div>
                      <p className="text-xs text-slate-500">Condição de Saúde</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.health_condition}</p>
                    </div>
                  )}
                  {selectedRecord.social_history && (
                    <div>
                      <p className="text-xs text-slate-500">História Social</p>
                      <p className="text-sm font-medium text-slate-800">{selectedRecord.social_history}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Employment & Action */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Emprego e Ação</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Status de Emprego</p>
                    <p className="text-sm font-medium text-slate-800">{selectedRecord.employment_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ajuda Necessária</p>
                    <p className="text-sm font-medium text-slate-800">{selectedRecord.help_needed}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Encaminhamento</p>
                    <p className="text-sm font-medium text-slate-800">{selectedRecord.referral}</p>
                  </div>
                </div>
              </section>

              {/* Images */}
              {selectedRecord.image_urls && selectedRecord.image_urls.length > 0 && (
                <section>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Imagens de Apoio</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRecord.image_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-slate-200"
                          onClick={() => window.open(url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <ImageIcon className="text-white drop-shadow-lg" size={24} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Clique na imagem para abrir em tamanho original
                  </p>
                </section>
              )}

              {/* System Info */}
              <section className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Registrado em {format(parseISO(selectedRecord.created_at), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>Agente: {selectedRecord.agent_id}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
