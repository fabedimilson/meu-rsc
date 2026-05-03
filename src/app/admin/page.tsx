'use client';

import { useState } from 'react';
import Image from 'next/image';
import { loginAdmin } from './actions';
import { Lock, User, Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await loginAdmin(formData);

    if (res.success) {
      window.location.href = '/admin/dashboard';
    } else {
      setError(res.error || 'Erro ao fazer login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-6 rounded-3xl bg-white mb-6 shadow-xl relative w-full h-[100px]">
            <Image 
              src="/logos/500px-Instituto_Federal_do_Amazonas_transparente.png" 
              alt="Instituto Federal do Amazonas" 
              fill 
              className="object-contain p-4" 
            />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Área Administrativa</h1>
          <p className="text-slate-400 font-medium">Acesso restrito à equipe IFAM / RSC</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  name="username"
                  required
                  type="text"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none transition-all"
                  placeholder="Seu usuário"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  name="password"
                  required
                  type="password"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'ENTRAR NO SISTEMA'}
            </button>
          </form>
        </div>
        <div className="mt-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm transition-all uppercase tracking-widest group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para o Portal
          </a>
        </div>
      </div>
    </div>
  );
}
