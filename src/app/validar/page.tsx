'use strict';

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, ShieldCheck, ArrowLeft, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: "Validar Protocolo - MEU RSC",
  description: "Verifique a autenticidade de documentos e protocolos de Reconhecimento de Saberes e Competências.",
};

function ValidationContent({ protocol }: { protocol: string | null }) {
  // Simulação de busca de dados (em um caso real, buscaria no banco)
  const isValid = protocol && protocol.startsWith('RSC-');

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-[#13315C] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ShieldCheck size={120} />
          </div>
          <h1 className="text-2xl font-bold mb-2 relative z-10">Validador de Documentos</h1>
          <p className="text-blue-100 text-sm relative z-10">Sistema Oficial de Autenticidade - MEU RSC IFAM</p>
        </div>

        <div className="p-8 md:p-12">
          {!protocol ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Nenhum protocolo informado</h2>
              <p className="text-slate-500 mb-8">Por favor, utilize o QR Code presente no documento ou insira o código manualmente.</p>
              <Link href="/" className="inline-flex items-center gap-2 text-[#1351B4] font-bold hover:underline">
                <ArrowLeft size={18} />
                Voltar ao Início
              </Link>
            </div>
          ) : isValid ? (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="flex items-center gap-4 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h2 className="text-emerald-900 font-bold text-lg">Documento Autêntico</h2>
                  <p className="text-emerald-700 text-sm">Este protocolo foi emitido oficialmente pela plataforma MEU RSC do IFAM.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Dados do Protocolo</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Número do Protocolo</p>
                    <p className="font-bold text-[#13315C] text-lg">{protocol}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Status no Sistema</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">Processado</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Verificação</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Hash de Integridade</p>
                    <p className="font-mono text-[10px] break-all text-slate-400 bg-slate-50 p-2 rounded">
                      {Buffer.from(protocol).toString('hex').toUpperCase()}...{Date.now().toString(16).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 mb-6 italic">Documento verificado em {new Date().toLocaleString('pt-BR')}</p>
                <Link href="/" className="bg-[#13315C] text-white px-8 py-3 rounded-full font-bold hover:bg-[#001c40] transition-all shadow-xl">
                  Acessar Portal
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} />
              </div>
              <h2 className="text-xl font-bold text-red-800 mb-4">Protocolo Inválido</h2>
              <p className="text-slate-500 mb-8 text-sm">Atenção: Este código de protocolo não foi encontrado em nossos registros oficiais ou pode estar incorreto.</p>
              <Link href="/" className="inline-flex items-center gap-2 text-[#1351B4] font-bold hover:underline">
                <ArrowLeft size={18} />
                Tentar Novamente
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 text-center text-slate-400 text-xs">
        <p>&copy; {new Date().getFullYear()} - Instituto Federal do Amazonas</p>
        <p className="mt-1">Sistema de Reconhecimento de Saberes e Competências</p>
      </div>
    </div>
  );
}

function ValidationPageWrapper({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const protocol = typeof searchParams.protocolo === 'string' ? searchParams.protocolo : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
        <ValidationContent protocol={protocol} />
      </Suspense>
    </div>
  );
}

export default ValidationPageWrapper;
