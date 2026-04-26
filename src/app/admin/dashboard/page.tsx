'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getApplications, getAdminSession, logoutAdmin,
  getApplicationDetails, getDashboardStats, updateApplicationStatus, updateApplicationDetails, updateItemStatus,
  listAdmins, createAdmin, updateAdmin
} from '../actions';
import {
  Users, FileText, LogOut, Search, Clock, XCircle,
  Menu, X, Eye, Loader2, Award, AlertCircle, Trash2, 
  CheckCircle2, ChevronLeft, ChevronRight, Hash, MessageSquare, ShieldCheck,
  UserPlus, FileSignature
} from 'lucide-react';

const RSC_LEVELS: any = {
  'I':   { minPts: 10, minCrit: 1, reqRules: [] },
  'II':  { minPts: 15, minCrit: 2, reqRules: [] },
  'III': { minPts: 25, minCrit: 2, reqRules: [] },
  'IV':  { minPts: 30, minCrit: 3, reqRules: ['II', 'IV', 'V', 'VI'], ruleMsg: 'Pelo menos 1 do Req II, IV, V ou VI' },
  'V':   { minPts: 52, minCrit: 5, reqRules: ['IV', 'V', 'VI'], ruleMsg: 'Pelo menos 1 do Req IV, V ou VI' },
  'VI':  { minPts: 75, minCrit: 7, reqRules: ['VI'], ruleMsg: 'Pelo menos 1 do Req VI' },
};

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('processos');
  
  // App State
  const [apps, setApps] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState('');
  const PAGE_SIZE = 25;

  // Admin State
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [adminForm, setAdminForm] = useState({ nome: '', username: '', password: '', role: 'Avaliador', isActive: true });

  useEffect(() => {
    async function init() {
      const sess = await getAdminSession();
      if (!sess) { window.location.href = '/admin'; return; }
      setSession(sess);
    }
    init();
  }, []);

  useEffect(() => {
    if (session) {
      if (activeTab === 'processos') {
        loadData(); 
        loadStats();
      } else if (activeTab === 'membros') {
        loadAdmins();
      }
    }
  }, [session, statusFilter, page, activeTab]);

  const loadData = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const result = await getApplications({ search: q ?? search, status: statusFilter, page, pageSize: PAGE_SIZE });
      setApps(result.data as any[]);
      setTotalCount(result.total);
    } finally { setLoading(false); }
  }, [search, statusFilter, page]);

  const loadStats = async () => {
    const s = await getDashboardStats();
    setStats(s);
  };

  const loadAdmins = async () => {
    try {
      const res = await listAdmins();
      setAdminsList(res);
    } catch (e) {
      console.error(e);
      alert("Apenas Administradores Master podem visualizar membros.");
      setActiveTab('processos');
    }
  };

  const openDetails = async (app: any) => {
    setLoading(true);
    const details = await getApplicationDetails(app.id);
    setSelectedApp(details);
    setFeedback(details.app.observacao || '');
    setViewingDetails(true);
    setLoading(false);
  };

  const handleItemAction = async (itemId: number, statusAvaliacao: string, adminComment: string = '') => {
    await updateItemStatus(itemId, { statusAvaliacao, adminComment });
    setSelectedApp((prev: any) => ({
      ...prev,
      items: prev.items.map((i: any) => i.id === itemId ? { ...i, statusAvaliacao, adminComment } : i)
    }));
  };

  const handleUpdateStatus = async (isFinal: boolean) => {
    if (!selectedApp) return;

    // Calculation logic
    const rules = RSC_LEVELS[selectedApp.app.targetLevel || 'I'];
    const validItems = selectedApp.items.filter((i: any) => i.statusAvaliacao !== 'Recusado');
    const pontuacaoValidada = validItems.reduce((acc: number, item: any) => acc + item.pontosTotais, 0);
    const totalCriteria = validItems.length;
    let hasSpecialRule = rules.reqRules.length > 0 ? validItems.some((a: any) => rules.reqRules.includes(a.reqId)) : true;
    const isApproved = pontuacaoValidada >= rules.minPts && totalCriteria >= rules.minCrit && hasSpecialRule;

    const newStatus = isFinal ? (isApproved ? 'Aprovado' : 'Reprovado') : 'Em Análise';

    await updateApplicationDetails(selectedApp.app.id, { status: newStatus, observacao: feedback, pontuacaoValidada });
    loadData(); loadStats();
    setViewingDetails(false);
  };

  const generateSummary = () => {
    if (!selectedApp) return;
    const rules = RSC_LEVELS[selectedApp.app.targetLevel || 'I'];
    let summary = `RESUMO DA AVALIAÇÃO - RSC ${selectedApp.app.targetLevel || 'I'}\n\n`;
    
    selectedApp.items.forEach((item: any, idx: number) => {
      summary += `${idx + 1}. ${item.descricao}\n`;
      summary += `   - Pleiteado: ${item.pontosTotais.toFixed(1)} pts\n`;
      summary += `   - Situação: ${item.statusAvaliacao}\n`;
      if (item.statusAvaliacao === 'Recusado' && item.adminComment) {
        summary += `   - Motivo da Recusa: ${item.adminComment}\n`;
      }
      summary += '\n';
    });

    const validItems = selectedApp.items.filter((i: any) => i.statusAvaliacao !== 'Recusado');
    const pontuacaoValidada = validItems.reduce((acc: number, item: any) => acc + item.pontosTotais, 0);
    const totalCriteria = validItems.length;
    let hasSpecialRule = rules.reqRules.length > 0 ? validItems.some((a: any) => rules.reqRules.includes(a.reqId)) : true;
    const isApproved = pontuacaoValidada >= rules.minPts && totalCriteria >= rules.minCrit && hasSpecialRule;

    summary += `--- RESULTADO MATEMÁTICO ---\n`;
    summary += `Pontuação Validada: ${pontuacaoValidada.toFixed(1)} pts (Mínimo: ${rules.minPts} pts)\n`;
    summary += `Critérios Validados: ${totalCriteria} (Mínimo: ${rules.minCrit})\n`;
    if (rules.reqRules.length > 0) {
      summary += `Regra Especial (${rules.ruleMsg}): ${hasSpecialRule ? 'Atendida' : 'Não Atendida'}\n`;
    }
    summary += `PARECER FINAL: O(A) servidor(a) ${isApproved ? 'ATENDE' : 'NÃO ATENDE'} aos requisitos para o RSC ${selectedApp.app.targetLevel || 'I'}.`;
    
    setFeedback(summary);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdmin) {
      await updateAdmin(editingAdmin.id, adminForm);
    } else {
      await createAdmin(adminForm);
    }
    setShowAdminForm(false);
    setEditingAdmin(null);
    loadAdmins();
  };

  if (!session) return null;

  return (
    <div className="bg-[#fbf9f8] text-[#1b1c1c] min-h-screen flex antialiased">
      {/* SideNavBar */}
      <nav className="hidden md:flex flex-col py-6 overflow-y-auto fixed left-0 h-full w-64 border-r bg-slate-50 border-gray-200 z-40">
        <div className="px-6 mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#001c40] flex items-center justify-center text-white font-bold">M</div>
            <div>
              <h2 className="text-lg font-bold text-[#13315c] tracking-tight">MEU RSC</h2>
              <p className="text-xs text-[#44474f]">Área da Comissão</p>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-1 px-2 flex-grow">
          <li>
            <button onClick={() => setActiveTab('processos')} className={`w-full flex items-center gap-3 p-3 rounded-l-lg ml-2 font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'processos' ? 'bg-white text-[#cba72f] shadow-sm border-r-4 border-[#cba72f]' : 'text-slate-500 hover:text-[#13315c] hover:bg-gray-100'}`}>
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>description</span>
              Processos RSC
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('membros')} className={`w-full flex items-center gap-3 p-3 rounded-l-lg ml-2 font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'membros' ? 'bg-white text-[#cba72f] shadow-sm border-r-4 border-[#cba72f]' : 'text-slate-500 hover:text-[#13315c] hover:bg-gray-100'}`}>
              <span className="material-symbols-outlined">group</span>
              Membros
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('recursos')} className={`w-full flex items-center gap-3 p-3 rounded-l-lg ml-2 font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'recursos' ? 'bg-white text-[#cba72f] shadow-sm border-r-4 border-[#cba72f]' : 'text-slate-500 hover:text-[#13315c] hover:bg-gray-100'}`}>
              <span className="material-symbols-outlined">folder_special</span>
              Recursos
            </button>
          </li>
        </ul>
        <div className="mt-auto px-2 pt-4 border-t border-gray-200 mx-4">
          <button onClick={() => logoutAdmin().then(() => window.location.href = '/admin')} className="w-full flex items-center gap-3 text-slate-500 p-3 hover:text-red-600 hover:bg-red-50 rounded-md transition-all font-bold text-xs uppercase tracking-widest">
            <span className="material-symbols-outlined">logout</span>
            Sair do Painel
          </button>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-8 h-16 sticky top-0 bg-white border-b border-gray-200 z-30">
          <div className="flex items-center gap-4">
             <span className="text-xl font-black tracking-tighter text-[#13315c]">Painel de Avaliação</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#001c40]">{session.username}</span>
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 p-6 md:p-10 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
          
          {activeTab === 'processos' && (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-[#001c40]">Gestão de Protocolos</h1>
                <p className="text-[#44474f] text-lg">Acompanhe e avalie os pedidos de RSC submetidos pelos servidores.</p>
              </div>

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-[#c4c6d0] shadow-sm">
                    <p className="text-xs font-bold text-[#44474f] uppercase tracking-wider mb-2">Total Recebido</p>
                    <p className="text-4xl font-bold text-[#001c40]">{stats.total}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-[#c4c6d0] shadow-sm border-l-4 border-l-[#cba72f]">
                    <p className="text-xs font-bold text-[#44474f] uppercase tracking-wider mb-2">Em Análise</p>
                    <p className="text-4xl font-bold text-[#cba72f]">{stats.emAnalise}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-[#c4c6d0] shadow-sm border-l-4 border-l-[#2757c5]">
                    <p className="text-xs font-bold text-[#44474f] uppercase tracking-wider mb-2">Aprovados</p>
                    <p className="text-4xl font-bold text-[#2757c5]">{stats.aprovadas}</p>
                  </div>
                </div>
              )}

              {/* Table Section */}
              <section className="flex flex-col gap-6 bg-white rounded-xl p-6 md:p-8 border border-[#c4c6d0] shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#001c40]">Protocolos em Andamento</h2>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747780]" size={18} />
                      <input type="text" placeholder="Buscar protocolo..." className="w-full pl-10 pr-4 py-2 border border-[#c4c6d0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2757c5]" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="px-4 py-2 border border-[#c4c6d0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2757c5]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="all">Todos</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Aprovado">Aprovados</option>
                      <option value="Reprovado">Reprovados</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#c4c6d0]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#001c40] text-white font-bold text-sm uppercase tracking-wider">
                        <th className="p-4">Protocolo</th>
                        <th className="p-4">Servidor</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Pontuação</th>
                        <th className="p-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm bg-white divide-y divide-[#c4c6d0]">
                      {apps.map(app => (
                        <tr key={app.id} className="hover:bg-[#f6f3f2] transition-colors">
                          <td className="p-4 font-bold text-[#001c40]">#{app.protocolo}</td>
                          <td className="p-4">
                            <p className="font-semibold text-[#1b1c1c]">{app.userNome}</p>
                            <p className="text-xs text-[#44474f]">{app.userCpf}</p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${
                              app.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                              app.status === 'Reprovado' ? 'bg-red-100 text-red-800' :
                              'bg-[#ffe088] text-[#241a00]'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold">{app.pontuacaoTotal.toFixed(1)}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => openDetails(app)} className="text-[#2757c5] hover:text-[#001c40] font-bold text-sm underline underline-offset-2">
                              Avaliar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {apps.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-[#747780]">Nenhum protocolo encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeTab === 'membros' && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-[#001c40]">Comissão Avaliadora</h1>
                  <p className="text-[#44474f] text-lg">Gerencie os avaliadores que têm acesso aos protocolos RSC.</p>
                </div>
                <button onClick={() => { setEditingAdmin(null); setAdminForm({ nome: '', username: '', password: '', role: 'Avaliador', isActive: true }); setShowAdminForm(true); }} className="bg-[#2757c5] hover:bg-[#001c40] text-white px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm">
                  <UserPlus size={18} /> Novo Membro
                </button>
              </div>

              <div className="bg-white rounded-xl border border-[#c4c6d0] shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f0f0f0] border-b border-[#c4c6d0] font-bold text-sm text-[#001c40] uppercase tracking-wider">
                      <th className="p-4">Nome do Avaliador</th>
                      <th className="p-4">Usuário</th>
                      <th className="p-4">Função</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm bg-white divide-y divide-[#e4e2e1]">
                    {adminsList.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-[#1b1c1c]">{a.nome}</td>
                        <td className="p-4 text-slate-500 font-mono">{a.username}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase ${a.role === 'Admin Master' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {a.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {a.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => { setEditingAdmin(a); setAdminForm({ nome: a.nome, username: a.username, password: '', role: a.role, isActive: a.isActive }); setShowAdminForm(true); }} className="text-[#2757c5] hover:text-[#001c40] font-bold text-sm underline">
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recursos' && (
            <div className="flex flex-col gap-6">
              <h1 className="text-3xl font-bold text-[#001c40]">Recursos</h1>
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-8 rounded-xl text-center">
                <span className="material-symbols-outlined text-4xl mb-2">construction</span>
                <p className="font-bold text-lg">Módulo em Desenvolvimento</p>
                <p className="text-sm">A recepção e avaliação de recursos interpostos por servidores reprovados será liberada na próxima fase.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADMIN FORM MODAL */}
      {showAdminForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#e4e2e1] bg-[#fbf9f8] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#001c40]">{editingAdmin ? 'Editar Membro' : 'Novo Membro da Comissão'}</h2>
              <button onClick={() => setShowAdminForm(false)} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <form onSubmit={handleAdminSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase mb-1">Nome Completo</label>
                <input type="text" value={adminForm.nome} onChange={e=>setAdminForm({...adminForm, nome: e.target.value})} className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase mb-1">Usuário (SIAPE/CPF)</label>
                <input type="text" value={adminForm.username} onChange={e=>setAdminForm({...adminForm, username: e.target.value})} className="w-full p-2 border rounded" required disabled={!!editingAdmin} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase mb-1">Senha {editingAdmin && '(Deixe em branco para não alterar)'}</label>
                <input type="password" value={adminForm.password} onChange={e=>setAdminForm({...adminForm, password: e.target.value})} className="w-full p-2 border rounded" required={!editingAdmin} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase mb-1">Função</label>
                <select value={adminForm.role} onChange={e=>setAdminForm({...adminForm, role: e.target.value})} className="w-full p-2 border rounded">
                  <option value="Avaliador">Avaliador</option>
                  <option value="Admin Master">Admin Master</option>
                </select>
              </div>
              {editingAdmin && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={adminForm.isActive} onChange={e=>setAdminForm({...adminForm, isActive: e.target.checked})} id="isActive" className="w-4 h-4" />
                  <label htmlFor="isActive" className="text-sm font-bold text-[#44474f]">Acesso Ativo</label>
                </div>
              )}
              <div className="pt-4 mt-4 border-t">
                <button type="submit" className="w-full py-3 bg-[#2757c5] text-white rounded font-bold hover:bg-[#001c40] transition-colors">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / OVERLAY DE AVALIAÇÃO (Full screen approach based on the Commission Area HTML) */}
      {viewingDetails && selectedApp && (
        <div className="fixed inset-0 z-50 bg-[#fbf9f8] flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex justify-between items-center px-6 h-16 bg-white border-b border-[#e4e2e1] shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setViewingDetails(false)} className="text-[#44474f] hover:text-[#1b1c1c] flex items-center gap-1 font-bold text-sm">
                <span className="material-symbols-outlined">arrow_back</span> Voltar
              </button>
              <div className="h-6 w-px bg-[#dcd9d9] mx-2"></div>
              <span className="text-[#001c40] font-bold">Avaliação #{selectedApp.app.protocolo}</span>
            </div>
            <div className="text-sm font-semibold text-[#44474f]">
              Servidor: {selectedApp.user.nome}
            </div>
          </header>

          {/* Split Content */}
          <div className="flex-1 flex gap-6 p-6 overflow-hidden bg-[#f6f3f2]">
            {/* Esquerda: Document Viewer Simples */}
            <section className="flex-1 flex flex-col bg-white rounded-xl border border-[#c4c6d0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#e4e2e1] bg-[#fbf9f8]">
                <h2 className="font-bold text-[#001c40] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2757c5]">folder_open</span>
                  Documentos Anexados
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#f0eded]">
                {/* Memorial Section */}
                {selectedApp.app.memorial && (
                  <div className="bg-white p-8 rounded-lg border-2 border-[#13315c] shadow-md mb-4">
                    <h3 className="font-bold text-[#13315c] text-xl mb-4 border-b pb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined">auto_stories</span>
                      Memorial Descritivo do Servidor
                    </h3>
                    <pre className="text-sm text-[#1b1c1c] whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 p-6 rounded-lg">
                      {selectedApp.app.memorial}
                    </pre>
                  </div>
                )}

                {selectedApp.items.map((item: any) => (
                  <div key={item.id} className={`bg-white p-6 rounded-lg border shadow-sm ${item.statusAvaliacao === 'Recusado' ? 'border-red-300 bg-red-50' : item.statusAvaliacao === 'Aceito' ? 'border-green-300' : 'border-[#c4c6d0]'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-[#13315c]">{item.descricao}</h3>
                       <span className="text-sm font-bold bg-[#eae8e7] px-2 py-1 rounded">{item.pontosTotais.toFixed(1)} pts</span>
                    </div>
                    <p className="text-sm text-[#44474f] mb-4 italic">"{item.userComment || 'Sem relato.'}"</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.comprovanteUrls?.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-[#d7e3ff] text-[#001b3e] rounded font-bold text-xs hover:bg-[#b4c5ff] transition-colors">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Ver Documento {idx + 1}
                        </a>
                      ))}
                    </div>

                    <div className="flex gap-2 items-center border-t border-[#e4e2e1] pt-4 mt-2">
                       <span className="text-xs font-bold text-slate-500 uppercase mr-2">Avaliação do Item:</span>
                       <button onClick={() => handleItemAction(item.id, 'Aceito')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${item.statusAvaliacao === 'Aceito' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-800'}`}>Aceitar Evidência</button>
                       <button onClick={() => {
                          const just = window.prompt("Motivo da recusa:", item.adminComment || "");
                          if (just !== null) handleItemAction(item.id, 'Recusado', just);
                       }} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${item.statusAvaliacao === 'Recusado' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-800'}`}>Recusar Evidência</button>
                       {item.statusAvaliacao === 'Pendente' && <span className="text-xs text-amber-600 font-bold ml-auto">Pendente</span>}
                    </div>
                    {item.statusAvaliacao === 'Recusado' && item.adminComment && (
                       <div className="mt-3 p-3 bg-red-100 text-red-800 rounded text-xs">
                          <strong>Motivo da Recusa:</strong> {item.adminComment}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Direita: Avaliação */}
            <section className="w-[450px] flex flex-col bg-white rounded-xl border border-[#c4c6d0] shadow-sm overflow-hidden shrink-0">
              <div className="p-6 border-b border-[#e4e2e1] bg-[#fbf9f8]">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#dbe1ff] text-[#003ea7] font-bold text-[10px] uppercase tracking-wider mb-2">
                  <span className="material-symbols-outlined text-[14px]">checklist</span> Em Análise
                </span>
                <h2 className="text-xl font-bold text-[#001c40]">Matemática do RSC {selectedApp.app.targetLevel || 'I'}</h2>
                
                {(() => {
                  const rules = RSC_LEVELS[selectedApp.app.targetLevel || 'I'];
                  const validItems = selectedApp.items.filter((i: any) => i.statusAvaliacao !== 'Recusado');
                  const pontuacaoValidada = validItems.reduce((acc: number, item: any) => acc + item.pontosTotais, 0);
                  const isApproved = pontuacaoValidada >= rules.minPts && validItems.length >= rules.minCrit && (rules.reqRules.length === 0 || validItems.some((a: any) => rules.reqRules.includes(a.reqId)));
                  
                  return (
                    <div className="mt-4 space-y-4">
                      <div className="flex justify-between items-center bg-white p-3 rounded border border-slate-200">
                        <div>
                          <p className="text-xs text-[#44474f] font-bold uppercase">Pleiteada</p>
                          <p className="text-lg font-bold text-slate-400">{selectedApp.app.pontuacaoTotal.toFixed(1)} pts</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#13315c] font-bold uppercase">Validada</p>
                          <p className="text-2xl font-bold text-[#13315c]">{pontuacaoValidada.toFixed(1)} pts</p>
                        </div>
                      </div>
                      <div className={`p-3 rounded border font-bold flex items-center justify-between text-sm ${isApproved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <span>Meta RSC {selectedApp.app.targetLevel || 'I'}</span>
                        <span>{isApproved ? 'ATINGIDA ✅' : 'NÃO ATINGIDA ❌'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
                <div className="flex justify-between items-end">
                  <label className="font-bold text-[#1b1c1c] text-sm">Parecer Fundamentado da Comissão</label>
                  <button onClick={generateSummary} className="text-xs font-bold flex items-center gap-1 text-[#2757c5] hover:underline bg-[#f0f4ff] px-2 py-1 rounded border border-[#dbe1ff]">
                    <FileSignature size={14}/> Gerar Resumo
                  </button>
                </div>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Redija o parecer geral ou clique em Gerar Resumo..." className="w-full flex-1 min-h-[200px] rounded-md border border-[#c4c6d0] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2757c5] resize-none font-mono"></textarea>
              </div>

              <div className="p-6 border-t border-[#e4e2e1] bg-[#fbf9f8] flex flex-col gap-3">
                <button onClick={() => handleUpdateStatus(false)} className="w-full flex justify-center items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#13315c] text-[#13315c] font-bold hover:bg-slate-100 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">save</span> Gravar Rascunho
                </button>
                <button onClick={() => handleUpdateStatus(true)} className="w-full flex justify-center items-center gap-2 px-6 py-3 rounded-lg bg-[#2757c5] text-white font-bold hover:bg-[#001c40] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span> Concluir Avaliação
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
