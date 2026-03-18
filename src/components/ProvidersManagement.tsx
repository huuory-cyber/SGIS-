import { useState } from 'react';
import { CheckCircle, XCircle, Building, Mail, Phone, Calendar, UserCheck, UserX, Eye, AlertCircle, MessageSquare, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { approveProvider, rejectProvider, deactivateProvider, reactivateProvider, createProviderDirectly } from '../lib/supabase';
import { UserProfile } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProvidersManagementProps {
  providers: UserProfile[];
  onRefresh: () => void;
  adminId: string;
}

export default function ProvidersManagement({ providers, onRefresh, adminId }: ProvidersManagementProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedProvider, setSelectedProvider] = useState<UserProfile | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProviderEmail, setNewProviderEmail] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderPassword, setNewProviderPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredProviders = providers.filter(provider => {
    if (filterStatus === 'pending') return provider.approval_status === 'pending_approval';
    if (filterStatus === 'approved') return provider.approval_status === 'approved';
    if (filterStatus === 'rejected') return provider.approval_status === 'rejected';
    return true;
  });

  const handleApprove = async (userId: string) => {
    console.log('Tentando aprovar provedor:', userId, 'Admin ID:', adminId);
    try {
      await approveProvider(userId, adminId);
      console.log('Provedor aprovado com sucesso!');
      alert('Provedor aprovado com sucesso!');
      onRefresh();
    } catch (error: any) {
      console.error('Failed to approve provider:', error);
      alert(`Erro ao aprovar provedor: ${error?.message || JSON.stringify(error)}`);
    }
  };

  const handleReject = async () => {
    if (!selectedProvider || !rejectReason.trim()) {
      alert('Por favor, forneça um motivo para a rejeição.');
      return;
    }
    
    try {
      await rejectProvider(selectedProvider.id, rejectReason, adminId);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedProvider(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to reject provider:', error);
      alert('Erro ao rejeitar provedor.');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este provedor?')) return;
    
    try {
      await deactivateProvider(userId);
      onRefresh();
    } catch (error) {
      console.error('Failed to deactivate provider:', error);
      alert('Erro ao desativar provedor.');
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      await reactivateProvider(userId);
      onRefresh();
    } catch (error) {
      console.error('Failed to reactivate provider:', error);
      alert('Erro ao reativar provedor.');
    }
  };

  const handleCreateProvider = async () => {
    if (!newProviderEmail.trim() || !newProviderName.trim() || !newProviderPassword.trim()) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (newProviderPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsCreating(true);
    try {
      await createProviderDirectly(newProviderEmail, newProviderPassword, newProviderName, adminId);
      setShowCreateModal(false);
      setNewProviderEmail('');
      setNewProviderName('');
      setNewProviderPassword('');
      alert('Provedor cadastrado com sucesso!');
      onRefresh();
    } catch (error: any) {
      console.error('Failed to create provider:', error);
      alert(`Erro ao criar provedor: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setIsCreating(false);
    }
  };

  const pendingCount = providers.filter(p => p.approval_status === 'pending_approval').length;
  const approvedCount = providers.filter(p => p.approval_status === 'approved').length;
  const rejectedCount = providers.filter(p => p.approval_status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total de Provedores</p>
              <p className="text-2xl font-bold text-slate-900">{providers.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Building size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Aprovados</p>
              <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rejeitados</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <XCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Create Provider Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Cadastrar Novo Provedor
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            filterStatus === 'all'
              ? "bg-blue-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          )}
        >
          Todos ({providers.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            filterStatus === 'pending'
              ? "bg-orange-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          )}
        >
          Pendentes ({pendingCount})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            filterStatus === 'approved'
              ? "bg-emerald-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          )}
        >
          Aprovados ({approvedCount})
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            filterStatus === 'rejected'
              ? "bg-red-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          )}
        >
          Rejeitados ({rejectedCount})
        </button>
      </div>

      {/* Providers List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Provedor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status de Aprovação</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cadastro</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                        provider.approval_status === 'approved' ? "bg-blue-50 text-blue-500" :
                        provider.approval_status === 'rejected' ? "bg-red-50 text-red-500" :
                        "bg-slate-100 text-slate-400"
                      )}>
                        {provider.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{provider.full_name}</p>
                        <p className="text-xs text-slate-500">ID: {provider.id.slice(0, 8)}...</p>
                        {provider.rejection_reason && (
                          <div className="flex items-center gap-1 text-red-600 mt-1">
                            <MessageSquare size={12} />
                            <span className="text-xs">{provider.rejection_reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-sm">{provider.email}</span>
                      </div>
                      {provider.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span className="text-sm">{provider.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {provider.approval_status === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                        <CheckCircle size={12} />
                        Aprovado
                      </span>
                    ) : provider.approval_status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                        <XCircle size={12} />
                        Rejeitado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold">
                        <AlertCircle size={12} />
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-sm">{format(parseISO(provider.created_at), 'dd/MM/yyyy')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {provider.approval_status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApprove(provider.id)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Aprovar"
                          >
                            <UserCheck size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProvider(provider);
                              setShowRejectModal(true);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Rejeitar"
                          >
                            <UserX size={18} />
                          </button>
                        </>
                      )}
                      {provider.approval_status === 'approved' && (
                        <button
                          onClick={() => handleDeactivate(provider.id)}
                          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Desativar"
                        >
                          <UserX size={18} />
                        </button>
                      )}
                      {provider.approval_status === 'rejected' && (
                        <button
                          onClick={() => handleApprove(provider.id)}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Aprovar (reverter rejeição)"
                        >
                          <UserCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedProvider(provider)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProviders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum provedor encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProvider && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProvider(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                    selectedProvider.is_active ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"
                  )}>
                    {selectedProvider.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedProvider.full_name}</h3>
                    <p className="text-sm text-slate-500">Provedor de Serviços</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProvider(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-medium text-slate-800">{selectedProvider.email}</p>
              </div>
              
              {selectedProvider.phone && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Telefone</p>
                  <p className="text-sm font-medium text-slate-800">{selectedProvider.phone}</p>
                </div>
              )}

              {selectedProvider.station_id && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Posto</p>
                  <p className="text-sm font-medium text-slate-800">{selectedProvider.station_id}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                {selectedProvider.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                    <CheckCircle size={12} />
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold">
                    <XCircle size={12} />
                    Pendente de Aprovação
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Cadastrado em {format(parseISO(selectedProvider.created_at), 'dd/MM/yyyy')}
                </p>
              </div>

              {!selectedProvider.is_active && (
                <button
                  onClick={() => {
                    handleApprove(selectedProvider.id);
                    setSelectedProvider(null);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck size={18} />
                  Aprovar Provedor
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedProvider && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedProvider(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Rejeitar Provedor</h3>
              <p className="text-sm text-slate-500 mt-1">
                {selectedProvider.full_name}
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivo da Rejeição
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo pelo qual este provedor está sendo rejeitado..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedProvider(null);
                }}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
              >
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Provider Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isCreating) {
              setShowCreateModal(false);
              setNewProviderEmail('');
              setNewProviderName('');
              setNewProviderPassword('');
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Cadastrar Novo Provedor</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    O provedor será criado como já aprovado
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!isCreating) {
                      setShowCreateModal(false);
                      setNewProviderEmail('');
                      setNewProviderName('');
                      setNewProviderPassword('');
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={isCreating}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newProviderEmail}
                  onChange={(e) => setNewProviderEmail(e.target.value)}
                  placeholder="Ex: joao@exemplo.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  value={newProviderPassword}
                  onChange={(e) => setNewProviderPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCreating}
                  minLength={6}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  if (!isCreating) {
                    setShowCreateModal(false);
                    setNewProviderEmail('');
                    setNewProviderName('');
                    setNewProviderPassword('');
                  }
                }}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                disabled={isCreating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProvider}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                disabled={isCreating}
              >
                {isCreating ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
