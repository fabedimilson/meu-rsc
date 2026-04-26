"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, FileText, Upload, Trash2, 
  AlertCircle, Users, Award, ShieldCheck, ArrowRight,
  History, Heart, Calculator, BookOpen, Sparkles, MessageSquare, X, ChevronDown, ChevronUp, Loader2, Save, FileUp
} from 'lucide-react';
import { submitRegistration, getUserApplication } from './actions';
import { loginUser, logoutUser, getUserSession, updateUserProfile } from './user-actions';
import { upload } from '@vercel/blob/client';

// --- BASE DE DADOS COMPLETA (Fiel ao PDF Anexos I a VI) ---
const RSC_LEVELS: any = {
  'I':   { minPts: 10, minCrit: 1, reqRules: [] },
  'II':  { minPts: 15, minCrit: 2, reqRules: [] },
  'III': { minPts: 25, minCrit: 2, reqRules: [] },
  'IV':  { minPts: 30, minCrit: 3, reqRules: ['II', 'IV', 'V', 'VI'], ruleMsg: 'Pelo menos 1 do Req II, IV, V ou VI' },
  'V':   { minPts: 52, minCrit: 5, reqRules: ['IV', 'V', 'VI'], ruleMsg: 'Pelo menos 1 do Req IV, V ou VI' },
  'VI':  { minPts: 75, minCrit: 7, reqRules: ['VI'], ruleMsg: 'Pelo menos 1 do Req VI' },
};

const REQUISITOS = [
  {
    id: 'I',
    title: 'Req I - Comissões e Órgãos Colegiados',
    items: [
      { id: 'I-1', desc: 'Membro de Conselhos Superiores/Órgãos Colegiados', points: 3, unit: 'Por ano' },
      { id: 'I-2', desc: 'Coordenação/Presidência de Grupos de Trabalho ou Comissões', points: 4.5, unit: 'Por comissão' },
      { id: 'I-3', desc: 'Participação em CPPD, CIS ou órgãos equivalentes', points: 3, unit: 'Por ano' },
      { id: 'I-4', desc: 'Membro titular de comissão de Sindicância ou PAD', points: 15, unit: 'Por processo' },
      { id: 'I-5', desc: 'Membro de comissão de avaliação de desempenho/estágio probatório', points: 3, unit: 'Por ano' },
      { id: 'I-6', desc: 'Atuação em bancas de concurso ou processos seletivos', points: 4.5, unit: 'Por banca' },
    ]
  },
  {
    id: 'II',
    title: 'Req II - Projetos de Ensino, Pesquisa e Extensão',
    items: [
      { id: 'II-1', desc: 'Coordenação de projetos de ensino, pesquisa ou extensão', points: 7.5, unit: 'Por projeto' },
      { id: 'II-2', desc: 'Participação em equipe de projeto (apoio técnico/administrativo)', points: 4.5, unit: 'Por projeto' },
      { id: 'II-3', desc: 'Elaboração de projeto pedagógico de curso', points: 7.5, unit: 'Por projeto' },
      { id: 'II-4', desc: 'Participação em comissão editorial de publicações', points: 7.5, unit: 'Por ano' },
      { id: 'II-5', desc: 'Atividades de orientação, tutoria ou preceptoria', points: 3, unit: 'Por aluno/semestre' },
    ]
  },
  {
    id: 'III',
    title: 'Req III - Prêmios e Reconhecimento',
    items: [
      { id: 'III-1', desc: 'Premiação de âmbito internacional', points: 20, unit: 'Por prêmio' },
      { id: 'III-2', desc: 'Premiação de âmbito nacional', points: 15, unit: 'Por prêmio' },
      { id: 'III-3', desc: 'Premiação de âmbito local/institucional', points: 7.5, unit: 'Por prêmio' },
      { id: 'III-4', desc: 'Homenagem ou título honorífico por mérito profissional', points: 4.5, unit: 'Por título' },
    ]
  },
  {
    id: 'IV',
    title: 'Req IV - Responsabilidades Técnicas e Gestão',
    items: [
      { id: 'IV-1', desc: 'Elaboração de Termo de Referência ou Projeto Básico', points: 3, unit: 'Por documento' },
      { id: 'IV-2', desc: 'Gestão ou fiscalização de contratos', points: 4.5, unit: 'Por contrato/ano' },
      { id: 'IV-3', desc: 'Atuação como Pregoeiro ou Equipe de Apoio', points: 3, unit: 'Por processo' },
      { id: 'IV-4', desc: 'Responsável formal por laboratório, oficina ou unidade', points: 4.5, unit: 'Por ano' },
      { id: 'IV-5', desc: 'Representação institucional externa (órgãos oficiais)', points: 4.5, unit: 'Por ano' },
    ]
  },
  {
    id: 'V',
    title: 'Req V - Cargos de Direção e Funções',
    items: [
      { id: 'V-1', desc: 'Cargo de Direção CD-01 ou CD-02', points: 9, unit: 'Por ano' },
      { id: 'V-2', desc: 'Cargo de Direção CD-03 ou CD-04', points: 7.5, unit: 'Por ano' },
      { id: 'V-3', desc: 'Função Gratificada FG-01, FG-02 ou FG-03', points: 4.5, unit: 'Por ano' },
      { id: 'V-4', desc: 'Função Gratificada FG-04 ou inferior / FCC', points: 3, unit: 'Por ano' },
      { id: 'V-5', desc: 'Substituição formal em cargos de direção/função (mín 30 dias)', points: 1.5, unit: 'Por período' },
    ]
  },
  {
    id: 'VI',
    title: 'Req VI - Produção Técnica e Difusão',
    items: [
      { id: 'VI-1', desc: 'Carta Patente ou Registro de Software/Marca', points: 30, unit: 'Por registro' },
      { id: 'VI-2', desc: 'Depósito de pedido de patente ou registro', points: 15, unit: 'Por pedido' },
      { id: 'VI-3', desc: 'Título de Especialista, Mestre ou Doutor (além do exigido no cargo)', points: 15, unit: 'Por título' },
      { id: 'VI-4', desc: 'Publicação de Livro com ISBN e Conselho Editorial', points: 20, unit: 'Por livro' },
      { id: 'VI-5', desc: 'Capítulo de livro ou Artigo em revista especializada/periódico', points: 7.5, unit: 'Por publicação' },
      { id: 'VI-6', desc: 'Apresentação de trabalho em congresso ou seminário', points: 4.5, unit: 'Por trabalho' },
      { id: 'VI-7', desc: 'Produção de material técnico/metodológico para difusão', points: 4.5, unit: 'Por produto' },
      { id: 'VI-8', desc: 'Instrutor, palestrante ou tutor em ação formativa', points: 4.5, unit: 'Por curso' },
      { id: 'VI-9', desc: 'Coordenação/Mediação de fórum, simpósio ou oficina', points: 4.5, unit: 'Por evento' },
      { id: 'VI-10', desc: 'Orientação de Trabalho de Conclusão de Curso (TCC/Estágio)', points: 7.5, unit: 'Por evento' },
    ]
  }
];

const HomePage = ({ onStart, onLogin, session }: { onStart: () => void, onLogin: () => void, session: any }) => (
  <div className="min-h-screen flex flex-col bg-[#fbf9f8] text-[#1b1c1c]">
    <header className="bg-white sticky top-0 z-50 border-b-4 border-[#13315C]">
      <div className="flex justify-between items-center w-full px-6 md:px-10 max-w-[1200px] mx-auto h-20">
        <div className="flex items-center gap-4">
          <div className="flex flex-col leading-none font-black text-[#13315C] text-xl uppercase tracking-tight">
            <span>MEU</span>
            <span>RSC</span>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
          <div className="hidden md:flex flex-col text-xs text-slate-500 font-medium">
            <span className="font-bold text-[#13315C]">Governo Federal</span>
            <span>Instituto Federal do Amazonas</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <span className="text-[#1351B4] font-bold border-b-2 border-[#1351B4] pb-1 text-sm cursor-pointer">Início</span>
          <a href="#niveis" className="text-slate-600 font-medium hover:text-[#1351B4] transition-colors text-sm">Níveis RSC</a>
          <a href="#como-funciona" className="text-slate-600 font-medium hover:text-[#1351B4] transition-colors text-sm">Como Funciona</a>
        </nav>
        <div className="flex items-center gap-4">
          {session ? (
            <button onClick={onStart} className="bg-[#0042B1] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#13315C] transition-all flex items-center gap-2 shadow-[0_4px_14px_0_rgba(0,66,177,0.39)]">
              Ir para o Painel
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button onClick={onLogin} className="bg-[#0042B1] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#13315C] transition-all flex items-center gap-2 shadow-[0_4px_14px_0_rgba(0,66,177,0.39)]">
              Entrar (Servidor)
              <span className="material-symbols-outlined text-[18px]">login</span>
            </button>
          )}
        </div>
      </div>
    </header>

    <section className="w-full max-w-[1200px] mx-auto px-6 md:px-10 py-16 md:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
      <div className="flex-1 flex flex-col items-start gap-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C5A059]/10 text-[#422e00] rounded-full text-xs font-bold">
          <span className="material-symbols-outlined text-[16px] icon-fill" style={{color:'#C5A059'}}>workspace_premium</span>
          Reconhecimento de Saberes e Competências
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-[48px] font-bold text-[#13315C] leading-tight tracking-tight">
          Sua história construiu a nossa.<br />
          <span className="text-[#0042B1]">Agora, é hora de reconhecer cada passo.</span>
        </h1>
        <p className="text-lg text-[#44474f] leading-relaxed max-w-2xl mt-2">
          O RSC é o tributo ao seu conhecimento, à sua dedicação e ao legado que você deixa para a educação federal. Um processo transparente, humano e feito para valorizar você.
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          <button onClick={onStart} className="bg-[#0042B1] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-[#13315C] transition-all flex items-center gap-2 shadow-[0_4px_14px_0_rgba(0,66,177,0.39)]">
            Simular Protocolo
            <span className="material-symbols-outlined text-[18px]">calculate</span>
          </button>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-[#eae8e7] border border-[#dcd9d9]">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEuglpxhvA_NcslNleUuSohOG0NXvufwlNOIuQSQXJqEUSH6wrzBHOC3JrO_nDFZRUK09HOIhddRCxyQSwAb9UcCmG1ufANJP31Sol_1YF3rY83_s55ebP-2afEqQXmEd2jVsOAJYQ4iR2Lgvgg4ggapXG3IemBFuv1F1nZZi49z1FRuy1Af_mu6lrvxZT8u-kriOA6-8J92NMPmyqHhXOrqXE79X84lRXI-lj6km4JU6FK5U3YL8bhQNuT9c-B6CLr2lEa1Yh0Io" alt="IFAM" className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
    <section id="niveis" className="w-full bg-white py-20 border-y border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#13315C] mb-4">Níveis de Reconhecimento</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Cada nível exige um acúmulo diferente de saberes e competências. Confira os requisitos mínimos de pontuação para cada classe.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { l: 'I', p: 10, c: 1, d: 'Requisitos iniciais de experiência e formação.' },
            { l: 'II', p: 15, c: 2, d: 'Ampliando a atuação em projetos e comissões.' },
            { l: 'III', p: 25, c: 2, d: 'Consolidação da trajetória profissional no IFAM.' },
            { l: 'IV', p: 30, c: 3, d: 'Liderança e produção técnica qualificada.' },
            { l: 'V', p: 52, c: 5, d: 'Alto impacto institucional e gestão de saberes.' },
            { l: 'VI', p: 75, c: 7, d: 'Excelência técnica e reconhecimento nacional.' },
          ].map(level => (
            <div key={level.l} className="p-8 rounded-2xl border border-slate-100 bg-[#fbf9f8] hover:border-[#0042B1] transition-all hover:shadow-xl group">
              <div className="text-4xl font-black text-[#13315C] mb-4 group-hover:text-[#0042B1]">RSC {level.l}</div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-[#0042B1]">{level.p}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pontos Mín.</span>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-700">{level.c}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Critérios</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{level.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="como-funciona" className="w-full py-20 bg-[#fbf9f8]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#13315C] mb-4">Como funciona o processo</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Um fluxo digital, ágil e transparente para garantir que seu reconhecimento seja processado com segurança.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { i: 'person_add', t: 'Cadastro', d: 'Acesse com seu e-mail IFAM e preencha seus dados básicos de servidor.' },
            { i: 'account_tree', t: 'Evidências', d: 'Adicione suas atividades, cargos e produções anexando os documentos PDF.' },
            { i: 'history_edu', t: 'Memorial', d: 'O sistema gera uma base para seu memorial, que você pode editar livremente.' },
            { i: 'verified', t: 'Avaliação', d: 'A comissão analisa seus documentos e emite o parecer final digitalmente.' },
          ].map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center mb-6 text-[#0042B1] group-hover:bg-[#0042B1] group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-[28px]">{step.i}</span>
              </div>
              <h3 className="font-bold text-[#13315C] mb-2">{step.t}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{step.d}</p>
              {idx < 3 && <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-slate-200"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
    <footer className="bg-[#f0f0f0] border-t border-slate-300 py-12 mt-auto">
      <div className="flex flex-col items-center justify-center w-full max-w-[1200px] mx-auto space-y-5 text-center px-6">
        <div className="font-black text-[#13315C] text-base tracking-widest uppercase">MEU RSC</div>
        <p className="text-slate-500 text-sm">
          Respeito ao passado, segurança para o futuro. © {new Date().getFullYear()} Governo Federal | Instituto Federal do Amazonas
        </p>
      </div>
    </footer>
  </div>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', error: '', loading: false });

  const [view, setView] = useState('home');
  const [activeTab, setActiveTab] = useState('jornada');
  const [userData, setUserData] = useState({ nome: '', cpf: '', siape: '', cargo: '', email: '', telefone: '', dataNascimento: '' });
  const [targetLevel, setTargetLevel] = useState('I');
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState('I');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentComment, setCurrentComment] = useState('');
  const [lattesText, setLattesText] = useState('');
  const [memorial, setMemorial] = useState('');
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [protocolNumber, setProtocolNumber] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getUserSession().then(setSession);
  }, []);

  useEffect(() => {
    if (session) {
      setUserData(prev => ({ 
        ...prev, 
        nome: session.nome || '', 
        cpf: session.cpf || '', 
        email: session.email || '', 
        siape: session.siape || '',
        dataNascimento: session.dataNascimento ? session.dataNascimento.split('T')[0] : ''
      }));
      // Load application
      getUserApplication().then(res => {
        if (res.success && res.data) {
          const { app, items } = res.data;
          setTargetLevel(app.targetLevel || 'I');
          setMemorial(app.memorial || '');
          setAppStatus(app.status);
          setProtocolNumber(app.protocolo);
          setAdminFeedback(app.observacao);
          
          if (items && items.length > 0) {
            setActivities(items.map((i: any) => ({
              uid: i.id.toString(), reqId: i.reqId, itemId: i.itemId,
              desc: i.descricao, points: i.pontosTotais, basePoints: i.pontosTotais / (i.quantidade || 1),
              qty: i.quantidade, unit: i.unidade, userComment: i.userComment
            })));
          }
        }
      });
    }
  }, [session]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginForm(prev => ({ ...prev, loading: true, error: '' }));
    const formData = new FormData();
    formData.append('email', loginForm.email);
    formData.append('password', loginForm.password);
    const res = await loginUser(formData);
    if (res.success) {
      const sess = await getUserSession();
      setSession(sess);
      setShowLogin(false);
    } else {
      setLoginForm(prev => ({ ...prev, error: res.error || 'Erro ao entrar.' }));
    }
    setLoginForm(prev => ({ ...prev, loading: false }));
  };

  const handleLogout = async () => {
    await logoutUser();
    setSession(null);
    setAppStatus(null);
    setActivities([]);
    setMemorial('');
    setView('home');
  };

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    const res = await updateUserProfile(userData);
    if (res.success) {
      alert('Perfil atualizado com sucesso!');
      const sess = await getUserSession();
      setSession(sess);
    } else {
      alert(res.error || 'Erro ao atualizar.');
    }
    setIsSubmitting(false);
  };

  const validation = useMemo(() => {
    const rules = RSC_LEVELS[targetLevel];
    const totalPoints = activities.reduce((acc, curr) => acc + curr.points, 0);
    const totalCriteria = activities.length;
    let hasSpecialRule = rules.reqRules.length > 0 ? activities.some(a => rules.reqRules.includes(a.reqId)) : true;
    const isPointsValid = totalPoints >= rules.minPts;
    const isCriteriaValid = totalCriteria >= rules.minCrit;
    const isApproved = isPointsValid && isCriteriaValid && hasSpecialRule;
    return { totalPoints, totalCriteria, hasSpecialRule, isPointsValid, isCriteriaValid, isApproved, rules };
  }, [activities, targetLevel]);

  const generateMemorial = () => {
    // Only generate if empty or user specifically wants to reset it
    if (memorial.trim().length > 0 && !window.confirm("Isso irá sobrescrever o memorial atual com a estrutura padrão baseada nos itens. Deseja continuar?")) {
      return;
    }

    const nivelPleiteado = targetLevel;
    const lines: string[] = [];
    lines.push('MEMORIAL DESCRITIVO DE SABERES E COMPETÊNCIAS');
    lines.push('Base Legal: Art. 13 do Decreto nº 11.355/2023 - RSC-PCCTAE');
    lines.push('Instituto Federal do Amazonas - IFAM');
    lines.push('');
    lines.push('--- APRESENTAÇÃO ------------------------------------------');
    lines.push('');
    lines.push(`Este Memorial Descritivo tem por finalidade demonstrar os saberes e competências diferenciados acumulados ao longo da carreira no serviço público federal, para fins de concessão do RSC no nível ${nivelPleiteado}.`);
    lines.push('');
    if (lattesText.trim()) {
      lines.push('--- PERFIL PROFISSIONAL -------------------------');
      lines.push(lattesText.trim());
      lines.push('');
    }
    const byReq: Record<string, any[]> = {};
    activities.forEach(a => { if (!byReq[a.reqId]) byReq[a.reqId] = []; byReq[a.reqId].push(a); });
    lines.push('--- TRAJETÓRIA E COMPROVAÇÃO -------------------------------');
    Object.entries(byReq).forEach(([reqId, items]) => {
      lines.push(`EIXO ${reqId}`);
      items.forEach((act, i) => {
        lines.push(`  ${i + 1}. ${act.desc} (${act.qty}x | ${act.points.toFixed(1)} pts)`);
        if (act.userComment) lines.push(`     Relato: ${act.userComment}`);
      });
      lines.push('');
    });
    lines.push(`Pontuação total apurada: ${validation.totalPoints.toFixed(1)} pontos`);
    lines.push(`Manaus, ${new Date().toLocaleDateString('pt-BR')}`);
    setMemorial(lines.join('\n'));
  };

  const handleAddActivity = async () => {
    if (!session) { setShowLogin(true); return; }
    if (!selectedItem) return;
    
    const reqGroup = REQUISITOS.find(r => r.id === selectedReq);
    const itemData = reqGroup?.items.find(i => i.id === selectedItem);
    if (!itemData) return;

    let comprovanteUrls: string[] = [];
    if (selectedFile) {
      setIsUploading(true);
      try {
        const newBlob = await upload(selectedFile.name, selectedFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        comprovanteUrls.push(newBlob.url);
      } catch (e: any) {
        console.error("Upload failed", e);
        const errorMsg = e.message || "Erro desconhecido no upload.";
        if (!window.confirm(`O upload falhou: ${errorMsg}\n\nDeseja adicionar o item sem anexo para fins de teste?`)) {
           setIsUploading(false);
           return;
        }
      }
      setIsUploading(false);
    }

    const newActivity = { 
      uid: Date.now().toString(), 
      reqId: selectedReq, 
      itemId: itemData.id, 
      desc: itemData.desc, 
      points: itemData.points * quantity, 
      basePoints: itemData.points, 
      qty: quantity, 
      unit: itemData.unit, 
      userComment: currentComment.trim(),
      comprovanteUrls 
    };
    
    setActivities([...activities, newActivity]);
    setSelectedItem(''); setQuantity(1); setCurrentComment(''); setSelectedFile(null);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!session) { setShowLogin(true); return; }
    if (!userData.nome || !userData.cpf) { alert("Nome e CPF são obrigatórios no Meu Perfil."); setActiveTab('perfil'); return; }
    
    if (!isDraft && !validation.isApproved) {
       alert("Você precisa atingir a pontuação mínima para o nível selecionado antes de enviar para avaliação.");
       return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitRegistration({ ...userData, targetLevel, pontuacaoTotal: validation.totalPoints, activities, memorial, isDraft });
      if (res.success) { 
        alert(isDraft ? "Rascunho salvo com sucesso! Você pode continuar editando depois." : `Protocolo submetido com sucesso! N°: ${res.protocolo}`); 
        setAppStatus(isDraft ? 'Rascunho' : 'Em Análise');
        setProtocolNumber(res.protocolo || protocolNumber);
      }
      else alert(res.error);
    } catch(e) { alert("Erro ao enviar."); } finally { setIsSubmitting(false); }
  };

  if (view === 'home') return <HomePage onStart={() => setView('simulador')} onLogin={() => setShowLogin(true)} session={session} />;

  const pct = Math.min((validation.totalPoints / validation.rules.minPts) * 100, 100);
  const offset = 282.7 - (282.7 * pct / 100);
  const isReadOnly = appStatus !== null && appStatus !== 'Rascunho' && appStatus !== 'Pendente';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fbf9f8]">
      <nav className="hidden md:flex bg-white w-64 shrink-0 border-r border-[#E0E0E0] shadow-sm flex-col py-6 h-screen">
        <div className="px-6 pb-6 mb-2 border-b border-[#e4e2e1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#13315c] flex items-center justify-center text-white font-bold">S</div>
            <div>
              <p className="text-[#13315C] font-bold text-sm leading-tight truncate">{session ? session.nome.split(' ')[0] : 'Modo Simulador'}</p>
              <p className="text-slate-400 text-[10px]">{session ? `SIAPE: ${session.siape}` : 'Apenas visualização'}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 space-y-1 mt-2">
          {appStatus && (
            <div onClick={() => setActiveTab('acompanhamento')} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer ${activeTab === 'acompanhamento' ? 'bg-[#e5ecf6] text-[#2757c5] border-r-4 border-[#2757c5]' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="material-symbols-outlined text-xl">query_stats</span>
              <span className="font-semibold text-sm">Meu Protocolo</span>
            </div>
          )}
          <div onClick={() => setActiveTab('jornada')} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer ${activeTab === 'jornada' ? 'bg-slate-100 text-[#13315C] border-r-4 border-[#13315C]' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined text-xl">timeline</span>
            <span className="font-semibold text-sm">Minha Jornada</span>
          </div>
          <div onClick={() => setActiveTab('memorial')} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer ${activeTab === 'memorial' ? 'bg-slate-100 text-[#13315C] border-r-4 border-[#13315C]' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
            <span className="font-semibold text-sm">Memorial RSC</span>
          </div>
          <div onClick={() => setActiveTab('perfil')} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer ${activeTab === 'perfil' ? 'bg-slate-100 text-[#13315C] border-r-4 border-[#13315C]' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined text-xl">account_circle</span>
            <span className="font-semibold text-sm">Meu Perfil</span>
          </div>
        </div>
        <div className="px-6 mt-4">
          {session ? (
            <button onClick={handleLogout} className="w-full py-2.5 px-4 bg-red-50 text-red-600 border border-red-200 rounded text-sm font-semibold hover:bg-red-100">Sair da Conta</button>
          ) : (
            <button onClick={() => setView('home')} className="w-full py-2.5 px-4 bg-[#001c40] text-white rounded text-sm font-semibold hover:bg-[#13315c]">Voltar ao Início</button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-[#F0F0F0] border-b border-[#E0E0E0] flex justify-between items-center px-6 h-16 shrink-0">
          <span className="text-xl font-bold text-[#13315C]">MEU RSC</span>
          <div className="flex items-center gap-4">
            {isReadOnly && <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">lock</span> Somente Leitura</span>}
            {appStatus === 'Rascunho' && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">Rascunho Ativo</span>}
            {session ? (
              <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase">Sair</button>
            ) : (
              <button onClick={() => setShowLogin(true)} className="text-xs font-bold text-[#2757c5] hover:text-[#001c40] uppercase">Fazer Login</button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto p-6 lg:p-10 flex flex-col gap-8">
            {activeTab === 'acompanhamento' ? (
              <div className="bg-white rounded-xl border border-[#c4c6d0] p-8 shadow-sm space-y-8 max-w-3xl mx-auto">
                 <div className="text-center">
                   <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 border-4 border-slate-100 mb-4">
                      <span className="material-symbols-outlined text-4xl text-[#13315C]">{appStatus === 'Aprovado' ? 'verified' : appStatus === 'Reprovado' ? 'cancel' : 'hourglass_empty'}</span>
                   </div>
                   <h2 className="text-3xl font-bold text-[#001c40]">Protocolo #{protocolNumber}</h2>
                   <p className="text-slate-500 mt-2">Nível Pleiteado: RSC {targetLevel}</p>
                 </div>
                 
                 <div className="p-6 rounded-xl border bg-slate-50 flex justify-between items-center">
                   <div>
                     <p className="text-xs uppercase font-bold text-slate-400">Status Atual</p>
                     <p className={`text-xl font-bold ${appStatus === 'Aprovado' ? 'text-green-600' : appStatus === 'Reprovado' ? 'text-red-600' : 'text-amber-600'}`}>{appStatus}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs uppercase font-bold text-slate-400">Pontuação Mínima</p>
                     <p className="text-xl font-bold text-[#13315C]">{validation.rules.minPts} pts</p>
                   </div>
                 </div>

                 {adminFeedback && (
                   <div className="p-6 border-l-4 border-[#cba72f] bg-amber-50 rounded-r-xl">
                      <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">gavel</span> Parecer da Comissão</h3>
                      <p className="text-amber-800 whitespace-pre-wrap text-sm">{adminFeedback}</p>
                   </div>
                 )}
              </div>
            ) : activeTab === 'jornada' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white rounded-xl border border-[#c4c6d0] p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-[#001c40]">Módulo de Evidências</h2>
                      {!session && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Apenas Simulação</span>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select disabled={isReadOnly} className="p-2 border rounded text-sm disabled:bg-slate-50" value={selectedReq} onChange={e=>{setSelectedReq(e.target.value); setSelectedItem('')}}>
                        {REQUISITOS.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                      </select>
                      <select disabled={isReadOnly} className="p-2 border rounded text-sm disabled:bg-slate-50" value={selectedItem} onChange={e=>setSelectedItem(e.target.value)}>
                        <option value="">Selecione...</option>
                        {REQUISITOS.find(r=>r.id===selectedReq)?.items.map(i => <option key={i.id} value={i.id}>{i.desc}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-4">
                      <input type="number" disabled={isReadOnly} value={quantity} onChange={e=>setQuantity(parseInt(e.target.value)||1)} className="w-20 p-2 border rounded text-center disabled:bg-slate-50" />
                      <textarea disabled={isReadOnly} placeholder="Relato de experiência (Opcional)..." value={currentComment} onChange={e=>setCurrentComment(e.target.value)} className="flex-1 p-2 border rounded text-sm disabled:bg-slate-50" rows={2} />
                    </div>
                    
                    {/* Real Upload UI */}
                    <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isReadOnly ? 'border-slate-200 bg-slate-50' : 'border-[#c4c6d0] hover:border-[#13315c]'}`}>
                       <input 
                         type="file" 
                         disabled={isReadOnly || isUploading}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                         onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                       />
                       <span className="material-symbols-outlined text-[#747780] mb-1">upload_file</span>
                       <p className="text-xs text-[#747780] font-medium">
                          {selectedFile ? <span className="text-[#13315c] font-bold">{selectedFile.name}</span> : 'Clique para anexar comprovantes PDF (Máx 5MB)'}
                       </p>
                    </div>

                    {!isReadOnly && (
                      <button onClick={handleAddActivity} disabled={!selectedItem || isUploading} className="w-full py-3 bg-[#cba72f] text-white rounded font-bold hover:opacity-90 flex justify-center items-center gap-2">
                        {isUploading ? <Loader2 className="animate-spin" size={18}/> : <FileUp size={18}/>}
                        {isUploading ? 'Anexando arquivo...' : 'Adicionar à Jornada'}
                      </button>
                    )}
                    
                    <div className="space-y-2 mt-6">
                      <h3 className="font-bold text-[#13315C] text-sm uppercase tracking-wider border-b pb-2">Itens Adicionados ({activities.length})</h3>
                      {activities.map(a => (
                        <div key={a.uid} className="p-4 border rounded-lg flex justify-between items-center bg-slate-50">
                          <div className="text-sm flex-1 mr-4">
                            <p className="font-bold text-[#1b1c1c]">{a.desc}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <p className="text-xs text-slate-500">{a.qty}x | {a.points.toFixed(1)} pts</p>
                               {a.comprovanteUrls && a.comprovanteUrls.length > 0 && (
                                 <div className="flex gap-1">
                                   {a.comprovanteUrls.map((url: string, idx: number) => (
                                     <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-[#2757c5] hover:underline bg-blue-50 px-2 py-0.5 rounded">
                                       <span className="material-symbols-outlined text-[12px]">description</span>
                                       Doc {a.comprovanteUrls.length > 1 ? idx + 1 : ''}
                                     </a>
                                   ))}
                                 </div>
                               )}
                            </div>
                            {a.userComment && <p className="text-xs italic text-slate-400 mt-1 line-clamp-1">"{a.userComment}"</p>}
                          </div>
                          {!isReadOnly && <button onClick={()=>setActivities(activities.filter(x=>x.uid!==a.uid))} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={18}/></button>}
                        </div>
                      ))}
                      {activities.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Nenhuma evidência adicionada ainda.</p>}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-xl border border-[#c4c6d0] p-6 shadow-sm flex flex-col items-center gap-4">
                    <h3 className="font-bold text-[#001c40]">Termômetro RSC</h3>
                    <select disabled={isReadOnly} className="w-full p-2 border rounded text-sm text-center font-bold disabled:bg-slate-50" value={targetLevel} onChange={e=>setTargetLevel(e.target.value)}>
                      {Object.keys(RSC_LEVELS).map(l => <option key={l} value={l}>Meta: RSC {l}</option>)}
                    </select>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f0eded" strokeWidth="8"/>
                        <circle cx="50" cy="50" r="45" fill="none" stroke={validation.isApproved ? '#16a34a' : '#2757c5'} strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={offset} className="transition-all" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-bold">{validation.totalPoints.toFixed(0)}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Pts</span>
                      </div>
                    </div>

                    {!isReadOnly ? (
                      <div className="w-full flex flex-col gap-2">
                        <button onClick={() => handleSubmit(true)} disabled={isSubmitting} className="w-full py-3 rounded-lg font-bold text-[#13315c] border-2 border-[#13315c] bg-white hover:bg-slate-50 transition-all flex justify-center items-center gap-2">
                          {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                          Salvar Rascunho
                        </button>
                        <button onClick={() => handleSubmit(false)} disabled={!validation.isApproved || isSubmitting} className={`w-full py-3 rounded-lg font-bold text-white transition-all flex justify-center items-center gap-2 ${validation.isApproved ? 'bg-[#001c40] hover:bg-[#13315c] shadow-md' : 'bg-slate-300 cursor-not-allowed'}`}>
                          {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                          {validation.isApproved ? 'Submeter p/ Avaliação' : `Faltam ${(validation.rules.minPts - validation.totalPoints).toFixed(1)} pts`}
                        </button>
                        {!session && <p className="text-[10px] text-amber-600 text-center uppercase font-bold mt-2">Faça login para salvar</p>}
                      </div>
                    ) : (
                      <button disabled className="w-full py-3 rounded-lg font-bold text-white bg-slate-400 flex justify-center items-center gap-2">
                         <span className="material-symbols-outlined text-[18px]">lock</span>
                         Enviado p/ Comissão
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'memorial' ? (
              <div className="bg-white rounded-xl border border-[#c4c6d0] p-8 shadow-sm flex flex-col h-full min-h-[600px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#001c40]">Memorial Descritivo</h2>
                    <p className="text-sm text-slate-500">O documento final que será lido pela comissão avaliadora.</p>
                  </div>
                  <div className="flex gap-2">
                    {!isReadOnly && <button onClick={generateMemorial} className="px-4 py-2 bg-slate-100 text-[#13315C] rounded font-bold text-sm border border-slate-200 hover:bg-slate-200">Gerar Estrutura Automática</button>}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col relative">
                  <textarea 
                    value={memorial} 
                    onChange={e => setMemorial(e.target.value)} 
                    disabled={isReadOnly}
                    placeholder="Escreva ou gere seu memorial descritivo aqui..."
                    className="flex-1 w-full h-full p-6 border-2 border-slate-200 rounded-xl resize-none font-mono text-sm leading-relaxed focus:border-[#2757c5] focus:ring-0 disabled:bg-slate-50 disabled:text-slate-700 transition-colors"
                  />
                  {!isReadOnly && <p className="absolute bottom-4 right-4 text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm">Você pode editar este texto livremente.</p>}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#c4c6d0] p-8 shadow-sm space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-[#001c40]">Meu Perfil</h2>
                  <p className="text-sm text-slate-500">Mantenha seus dados atualizados. Eles são obrigatórios para a submissão.</p>
                </div>
                {!session ? (
                  <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <p className="text-amber-800 font-bold mb-4">Você precisa estar logado para editar seu perfil.</p>
                    <button onClick={() => setShowLogin(true)} className="px-6 py-2 bg-[#0042B1] text-white rounded font-bold text-sm">Fazer Login</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                      <input type="text" value={userData.nome} onChange={e=>setUserData({...userData, nome:e.target.value})} disabled={isReadOnly} className="w-full p-3 border rounded text-sm disabled:bg-slate-50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">CPF</label>
                        <input type="text" value={userData.cpf} onChange={e=>setUserData({...userData, cpf:e.target.value})} disabled={isReadOnly} className="w-full p-3 border rounded text-sm disabled:bg-slate-50" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">SIAPE</label>
                        <input type="text" value={userData.siape} onChange={e=>setUserData({...userData, siape:e.target.value})} disabled={isReadOnly} className="w-full p-3 border rounded text-sm disabled:bg-slate-50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Data de Nascimento</label>
                        <input type="date" value={userData.dataNascimento} onChange={e=>setUserData({...userData, dataNascimento:e.target.value})} disabled={isReadOnly} className="w-full p-3 border rounded text-sm text-slate-700 disabled:bg-slate-50" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">E-mail Institucional</label>
                        <input type="email" value={userData.email} disabled className="w-full p-3 border rounded text-sm bg-slate-100 text-slate-500" />
                      </div>
                    </div>
                    {!isReadOnly && (
                      <button onClick={handleUpdateProfile} disabled={isSubmitting} className="w-full py-3 bg-[#2757c5] hover:bg-[#001c40] text-white rounded font-bold transition-all">
                        {isSubmitting ? 'Salvando...' : 'Salvar Perfil'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#13315c] rounded-xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white">lock</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {authMode === 'login' ? 'Acesso do Servidor' : 'Cadastro do Servidor'}
                    </h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      Domínio @ifam.edu.br
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLogin(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-400">close</span>
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                    <input 
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13315c] focus:border-[#13315c] transition-all outline-none"
                      placeholder="Seu nome completo"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail Institucional</label>
                  <input 
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13315c] focus:border-[#13315c] transition-all outline-none"
                    placeholder="exemplo@ifam.edu.br"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                  <input 
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13315c] focus:border-[#13315c] transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {authError}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#13315c] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-[#001c40] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {authMode === 'login' ? 'Entrando...' : 'Cadastrando...'}
                    </>
                  ) : (
                    authMode === 'login' ? 'Entrar' : 'Criar Conta'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <button 
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError(null);
                  }}
                  className="text-[#13315c] font-semibold hover:underline"
                >
                  {authMode === 'login' 
                    ? 'Não tem conta? Cadastre-se aqui' 
                    : 'Já tem conta? Faça login aqui'}
                </button>
              </div>
            </div>
            
            <form onSubmit={doLogin} className="p-6 flex flex-col gap-4">
              {loginForm.error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {loginForm.error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1 block">E-mail Institucional</label>
                <div className="relative">
                  <input type="email" value={loginForm.email} onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))} placeholder="servidor@ifam.edu.br" className="w-full p-3 rounded border border-[#c4c6d0] bg-white text-sm focus:border-[#2757c5] focus:outline-none focus:ring-1 focus:ring-[#2757c5]" required />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1 block">Senha</label>
                <div className="relative">
                  <input type="password" value={loginForm.password} onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Sua senha de acesso" className="w-full p-3 rounded border border-[#c4c6d0] bg-white text-sm focus:border-[#2757c5] focus:outline-none focus:ring-1 focus:ring-[#2757c5]" required />
                </div>
              </div>
              
              <button type="submit" disabled={loginForm.loading} className="w-full py-3 bg-[#0042B1] text-white rounded-lg font-bold text-sm hover:bg-[#13315C] mt-2 transition-colors">
                {loginForm.loading ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
