'use client';

import { useState, useEffect } from 'react';
import { listAdmins, createAdmin, updateAdmin, resetAdminPassword } from '../actions';
import { UserPlus, Settings, Loader2, ShieldCheck, ShieldAlert, X, Check, Power, Key } from 'lucide-react';

export default function AdminManagement({ session }: { session: any }) {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      await createAdmin(data);
      setShowAdd(false);
      loadAdmins();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      await updateAdmin(selectedAdmin.id, data);
      setShowEdit(false);
      loadAdmins();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(admin: any) {
    const action = admin.isActive ? 'desativar' : 'ativar';
    if (!confirm(`Deseja realmente ${action} o acesso de ${admin.nome}?`)) return;
    
    try {
      await updateAdmin(admin.id, { ...admin, isActive: !admin.isActive });
      loadAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newPass = formData.get('password') as string;
    
    try {
      await resetAdminPassword(selectedAdmin.id, newPass);
      setShowResetPass(false);
      alert('Senha alterada com sucesso!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Equipe de Gestão</h2>
          <p className="text-xs text-slate-400 font-bold">Gerencie os operadores do sistema Ração do Meu Pet</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <UserPlus size={20} /> Novo Operador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400">
            <Loader2 className="animate-spin mx-auto mb-2" />
            Carregando equipe...
          </div>
        ) : admins.map((admin) => (
          <div key={admin.id} className={`bg-white p-6 rounded-[32px] border-2 shadow-sm relative group overflow-hidden transition-all ${admin.isActive ? 'border-slate-100' : 'border-red-100 opacity-75'}`}>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-4 rounded-[20px] ${!admin.isActive ? 'bg-slate-100 text-slate-400' : admin.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {admin.role === 'admin' ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
              </div>
              <div className="overflow-hidden">
                <p className={`font-black uppercase tracking-tight truncate ${admin.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{admin.nome}</p>
                <p className="text-sm text-slate-500 font-bold italic">@{admin.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${admin.role === 'admin' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    {admin.role === 'admin' ? 'Admin Master' : 'Avaliador / SEMMAS'}
                  </span>
                  {!admin.isActive && (
                    <span className="px-2 py-0.5 rounded-lg bg-red-50 text-[10px] font-black uppercase text-red-600">Inativo</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="absolute top-3 right-3 flex gap-2 z-50">
              {admin.id !== session.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(admin); }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border transition-all ${admin.isActive ? 'bg-white border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50' : 'bg-green-600 border-green-600 text-white hover:bg-green-700'}`}
                  title={admin.isActive ? "Desativar Acesso" : "Ativar Acesso"}
                >
                  <Power size={18} />
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedAdmin(admin); setShowEdit(true); }}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 flex items-center justify-center shadow-sm transition-all"
                title="Configurações do Perfil"
              >
                <Settings size={20} />
              </button>
            </div>

            {/* Background Decor */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] rotate-12 ${admin.role === 'admin' ? 'text-orange-600' : 'text-blue-600'}`}>
               {admin.role === 'admin' ? <ShieldCheck size={100} /> : <ShieldAlert size={100} />}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowAdd(false)}></div>
          <div className="bg-white rounded-[32px] w-full max-w-md relative z-10 shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Cadastrar Operador</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Nome Completo</label>
                <input name="nome" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Matrícula ou E-mail (Username)</label>
                <input name="username" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 12345-6 ou nome@manaus.am.gov.br" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Senha Inicial (Mín. 6 chars)</label>
                <input name="password" required type="password" minLength={6} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Nível de Acesso</label>
                <select name="role" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700">
                  <option value="editor">Avaliador (Visualiza e avalia inscrições)</option>
                  <option value="admin">Admin Master (Gestão de equipe e recursos)</option>
                </select>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                <button disabled={submitting} className="flex-1 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all h-14 flex items-center justify-center">
                  {submitting ? <Loader2 className="animate-spin" /> : 'CADASTRAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEdit && selectedAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowEdit(false)}></div>
          <div className="bg-white rounded-[32px] w-full max-w-md relative z-10 shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Editar Perfil</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: #{selectedAdmin.id}</p>
              </div>
              <button onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Nome Completo</label>
                <input name="nome" defaultValue={selectedAdmin.nome} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Matrícula ou E-mail (Imutável)</label>
                <input value={selectedAdmin.username} disabled className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 font-bold cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Nível de Acesso</label>
                <select name="role" defaultValue={selectedAdmin.role} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700">
                  <option value="editor">Avaliador (Visualiza e avalia inscrições)</option>
                  <option value="admin">Admin Master (Gestão de equipe e recursos)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Status da Conta</label>
                <select name="isActive" defaultValue={selectedAdmin.isActive ? 'true' : 'false'} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700">
                  <option value="true">Ativo (Acesso Permitido)</option>
                  <option value="false">Inativo (Acesso Bloqueado)</option>
                </select>
              </div>

              <div className="pt-2">
                <button 
                  type="button"
                  onClick={() => { setShowEdit(false); setShowResetPass(true); }}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-orange-200 hover:text-orange-500 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Key size={14} /> Redefinir Senha do Operador
                </button>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                <button disabled={submitting} className="flex-1 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-900/20 hover:bg-black transition-all h-14 flex items-center justify-center">
                  {submitting ? <Loader2 className="animate-spin" /> : 'SALVAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {showResetPass && selectedAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowResetPass(false)}></div>
          <div className="bg-white rounded-[32px] w-full max-w-sm relative z-10 shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Redefinir Senha</h3>
            <p className="text-xs text-slate-400 font-bold mt-2 mb-6">Informe a nova senha para <span className="text-slate-600">@{selectedAdmin.username}</span></p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input 
                name="password" 
                type="password" 
                required 
                minLength={6} 
                autoFocus
                placeholder="Nova senha (mín. 6)"
                className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 focus:border-orange-500 outline-none text-center font-bold" 
              />
              
              <div className="flex flex-col gap-2 pt-4">
                <button disabled={submitting} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all flex items-center justify-center">
                  {submitting ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ALTERAÇÃO'}
                </button>
                <button type="button" onClick={() => { setShowResetPass(false); setShowEdit(true); }} className="w-full py-3 font-bold text-slate-400 text-xs">Voltar para edição</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
