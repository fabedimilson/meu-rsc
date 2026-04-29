"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  CheckCircle2, XCircle, FileText, Upload, Trash2, 
  AlertCircle, Users, Award, ShieldCheck, ArrowRight,
  History, Heart, Calculator, BookOpen, Sparkles, MessageSquare, X, ChevronDown, ChevronUp, Loader2, Save, FileUp, Printer, FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
// html2canvas removed - PDF now generated programmatically via jsPDF
import { submitRegistration, getUserApplication } from './actions';
import { loginUser, logoutUser, getUserSession, updateUserProfile, registerUser } from './user-actions';
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

const BannerCarousel = () => {
  const [current, setCurrent] = useState(0);
  const images = ["/banners/banner0.png", "/banners/Banner1.png", "/banners/Banner2.png", "/banners/Banner3.png", "/banners/Banner4.png"];

  useEffect(() => {
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-white border border-[#dcd9d9] group">
      {images.map((src, idx) => (
        <div key={src} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === current ? 'opacity-100 scale-100' : 'opacity-0 scale-100'}`} style={{ transitionProperty: 'opacity, transform' }}>
          <Image 
            src={src} 
            alt={`Banner ${idx + 1}`} 
            fill
            priority={idx === 0}
            className="object-contain" 
          />
          {/* Camuflagem: Selo de Identidade Institucional Definitivo (COLADO NO CANTO) */}
          <div className="absolute bottom-0 right-0 backdrop-blur-md bg-black/70 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-tl-2xl md:rounded-tl-3xl flex items-center gap-2 md:gap-3 shadow-2xl animate-in fade-in duration-700">
             <div className="w-4 h-4 md:w-6 md:h-6 bg-[#13315C] rounded-full flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[10px] md:text-[14px] text-white icon-fill">workspace_premium</span>
             </div>
             <div className="flex flex-col leading-tight">
                <span className="text-[9px] md:text-[11px] font-bold tracking-wide">MEU RSC - IFAM</span>
             </div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-10">
        {images.map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => setCurrent(idx)}
            className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${idx === current ? 'bg-white w-6 md:w-8 shadow-lg' : 'bg-white/40 w-1.5 md:w-2 hover:bg-white/60'}`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
};

const HomePage = ({ onStart, onLogin, onHome, session, visitCount }: { onStart: () => void, onLogin: () => void, onHome: () => void, session: any, visitCount: number }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f8] text-[#1b1c1c]">
      <header className="bg-white sticky top-0 z-[100] border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-center w-full px-6 md:px-10 max-w-[1200px] mx-auto h-20">
          <div className="flex items-center gap-4">
          <div key="brand-logo" onClick={() => onHome()} className="flex flex-col items-center leading-[1.2] font-black text-[#13315C] uppercase py-2 border-y-2 border-[#13315C] cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-[20px] tracking-[0.15em] ml-[0.15em]">MEU</span>
            <span className="text-[20px] tracking-[0.22em] ml-[0.22em]">RSC</span>
          </div>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <div className="hidden md:flex flex-col text-base text-slate-500 font-medium">
              <span className="font-bold text-[#13315C]">Governo Federal</span>
              <span className="text-sm">Instituto Federal do Amazonas</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            <span className="text-[#1351B4] font-bold border-b-2 border-[#1351B4] pb-1 text-lg cursor-pointer">Início</span>
            <a href="#como-funciona" className="text-slate-600 font-medium hover:text-[#1351B4] transition-colors text-lg">Como Funciona</a>
          </nav>

          {/* Desktop Login Options - RECONSTRUÍDOS */}
          <div key="desktop-login-group" className="hidden md:flex items-center gap-3 relative z-[200]">
            <button 
              id="final-login-comissao"
              onClick={() => window.location.href = '/admin'}
              className="bg-[#C5A059] text-white px-5 py-2.5 rounded-full font-bold text-xs tracking-widest shadow-lg hover:bg-[#a6864a] transition-all cursor-pointer"
            >
              Login Comissão
            </button>
            {session ? (
              <button id="final-btn-painel" onClick={(e) => { e.stopPropagation(); onStart(); }} className="bg-[#13315C] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#001c40] transition-all flex items-center gap-2 shadow-lg cursor-pointer">
                Meu Painel
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <button id="final-btn-login-servidor" onClick={(e) => { e.stopPropagation(); onLogin(); }} className="bg-[#0042B1] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#13315C] transition-all flex items-center gap-2 shadow-xl cursor-pointer">
                Login Servidor
                <span className="material-symbols-outlined text-[18px]">login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-12 h-12 flex items-center justify-center text-[#13315C] hover:bg-slate-50 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-4xl">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Dropdown Menu - RECONSTRUÍDO */}
        {menuOpen && (
          <div key="mobile-login-group" className="md:hidden bg-white border-b border-slate-200 py-6 px-6 animate-in slide-in-from-top duration-300 shadow-xl">
            <div className="flex flex-col gap-4">
              <button 
                id="mobile-login-comissao"
                onClick={() => window.location.href = '/admin'}
                className="w-full bg-[#C5A059] text-white py-3.5 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-3 shadow-md"
              >
                <span className="material-symbols-outlined">admin_panel_settings</span>
                Login Comissão
              </button>
              {session ? (
                <button onClick={() => { onStart(); setMenuOpen(false); }} className="w-full bg-[#13315C] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md">
                  Acessar Meu Painel
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              ) : (
                <button onClick={() => { onLogin(); setMenuOpen(false); }} className="w-full bg-[#0042B1] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md">
                  Login Servidor
                  <span className="material-symbols-outlined">login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

    <section className="w-full max-w-[1200px] mx-auto px-6 md:px-10 py-16 md:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
      <div className="flex-1 flex flex-col items-start gap-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C5A059]/10 text-[#422e00] rounded-full text-xs font-bold">
          <span className="material-symbols-outlined text-[16px] icon-fill" style={{color:'#C5A059'}}>workspace_premium</span>
          Reconhecimento de Saberes e Competências
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-[48px] font-bold text-[#13315C] leading-tight tracking-tight">
          Sua história construiu a nossa.<br />
          <span className="text-[#0042B1]">Chegou a hora de valorizar sua carreira.</span>
        </h1>
        <p className="text-base md:text-lg text-[#44474f] leading-relaxed max-w-2xl mt-2 text-justify">
          O RSC certifica os conhecimentos acumulados pela experiência e dedicação ao ensino profissional e tecnológico. Um processo transparente, humano e digital para valorizar sua trajetória no IFAM.
        </p>
        <div className="flex flex-wrap gap-4 mt-6 w-full md:w-auto relative z-[100]">
          <button 
            id="recreated-btn-simular-hero" 
            onClick={(e) => { e.stopPropagation(); onStart(); }} 
            className="w-full md:w-auto bg-[#0042B1] text-white px-10 py-4 rounded-full font-bold text-sm hover:bg-[#13315C] transition-all flex justify-center items-center gap-3 shadow-[0_10px_20px_-5px_rgba(0,66,177,0.4)] cursor-pointer active:scale-95"
          >
            Solicitar RSC agora
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          </button>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <BannerCarousel />
      </div>
    </section>

    <section id="como-funciona" className="w-full py-24 bg-[#fbf9f8]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-[#13315C] mb-4">Fluxo do Processo</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg italic">Um caminho transparente do protocolo ao benefício financeiro.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {[
            { i: 'person_add', t: 'Cadastro Institucional', d: 'Acesse com seu e-mail @ifam.edu.br, complete seu perfil e leia atentamente o regulamento do RSC.' },
            { i: 'account_tree', t: 'Envio de Evidências', d: 'Inicie o levantamento de documentos e anexe as evidências em PDF para validar sua pontuação.' },
            { i: 'history_edu', t: 'Elaboração do Memorial', d: 'Utilize nossa ferramenta gratuita para estruturar sua trajetória profissional de forma automática.' },
            { i: 'verified', t: 'Avaliação pela Comissão', d: 'Membros avaliadores revisam seu protocolo e emitem o parecer técnico.' },
            { i: 'description', t: 'Emissão de Portaria', d: 'Após a aprovação, o IFAM emite a Portaria oficial do reconhecimento.' },
            { i: 'payments', t: 'Atualização de Pagamento', d: 'Inclusão automática do benefício em folha e progressão na carreira.' },
          ].map((step, idx) => (
            <div key={idx} className="relative p-8 bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-15px_rgba(0,66,177,0.15)] transition-all duration-500 group overflow-hidden hover:-translate-y-2">
              <div className="absolute -right-4 -top-4 text-8xl font-black text-slate-50 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity cursor-default uppercase italic">
                {idx + 1}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#13315C] to-[#0042B1] flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[28px] icon-fill">{step.i}</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.2em]">Passo 0{idx + 1}</span>
                </div>
                <h3 className="font-bold text-xl text-[#13315C] leading-tight">{step.t}</h3>
                <p className="text-sm text-slate-500 leading-relaxed text-justify">{step.d}</p>
              </div>
              <div className="mt-6 w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-[#C5A059] w-0 group-hover:w-full transition-all duration-700 delay-100"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Contador de Acessos */}
    <section className="w-full py-12 bg-gradient-to-br from-[#0e2647] to-[#13315C]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-[#C5A059]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-[#C5A059] icon-fill">visibility</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white tabular-nums">{visitCount.toLocaleString('pt-BR')}</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/60">Acessos ao Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-[#C5A059]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-[#C5A059] icon-fill">groups</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white">IFAM</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/60">19 Campi no Amazonas</span>
          </div>
        </div>
      </div>
    </section>

    <footer className="bg-[#13315C] text-white py-16">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 text-center md:text-left">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-12 mb-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div onClick={() => onHome()} className="flex flex-col items-center leading-[1.2] font-black text-white uppercase py-2 border-y-2 border-white cursor-pointer hover:opacity-80 transition-opacity w-fit">
              <span className="text-[20px] tracking-[0.15em] ml-[0.15em]">MEU</span>
              <span className="text-[20px] tracking-[0.22em] ml-[0.22em]">RSC</span>
            </div>
            <p className="text-white/60 text-sm max-w-xs text-center md:text-left">Plataforma oficial para valorização da carreira técnica e reconhecimento de saberes do IFAM.</p>
          </div>
          <div className="flex gap-8">
             <div className="flex flex-col gap-2">
               <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#C5A059]">Suporte Técnico</span>
               <span className="text-sm text-white/80">suporte.rsc@ifam.edu.br</span>
             </div>
          </div>
        </div>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em]">
          © {new Date().getFullYear()} Governo Federal | Instituto Federal do Amazonas
        </p>
      </div>
    </footer>
  </div>
);
};

const CAMPUS_LIST = [
  "Avançado de Iranduba", "Boca do Acre", "Coari", "Eirunepé", "Humaitá", 
  "Itacoatiara", "Lábrea", "Manacapuru", "Manaus - Centro", "Manaus - Distrito Industrial", 
  "Manaus - Zona Leste", "Maués", "Parintins", "Polo de Inovação", "Presidente Figueiredo", 
  "Reitoria", "São Gabriel da Cachoeira", "Tabatinga", "Tefé"
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authCampus, setAuthCampus] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [view, setView] = useState('home');
  const [activeTab, setActiveTab] = useState('jornada');
  const [userData, setUserData] = useState({ nome: '', cpf: '', siape: '', cargo: '', campus: '', email: '', telefone: '', dataNascimento: '' });
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    getUserSession().then(setSession);
    // Increment and fetch visit counter
    fetch('/api/visits', { method: 'POST' })
      .then(r => r.json())
      .then(d => setVisitCount(d.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session) {
      setUserData(prev => ({ 
        ...prev, 
        nome: session.nome || '', 
        cpf: session.cpf || '', 
        email: session.email || '', 
        siape: session.siape || '',
        campus: session.campus || '',
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

  const handleDownloadPDF = async () => {
    setIsSubmitting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Border
      pdf.setDrawColor(19, 49, 92); // #13315C
      pdf.setLineWidth(1.5);
      pdf.rect(10, 10, pageWidth - 20, pdf.internal.pageSize.getHeight() - 20);

      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(19, 49, 92);
      pdf.text('INSTITUTO FEDERAL DO AMAZONAS', pageWidth / 2, y + 8, { align: 'center' });
      y += 14;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Comissão de Reconhecimento de Saberes e Competências - RSC', pageWidth / 2, y, { align: 'center' });
      y += 6;

      // Gold line
      pdf.setDrawColor(203, 167, 47); // #cba72f
      pdf.setLineWidth(0.8);
      pdf.line(pageWidth / 2 - 15, y, pageWidth / 2 + 15, y);
      y += 10;

      // Protocol info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Certificado de Protocolo: #${protocolNumber}`, margin, y);
      y += 7;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Servidor: ${userData.nome}`, margin, y); y += 6;
      pdf.text(`CPF: ${userData.cpf}`, margin, y); y += 6;
      pdf.text(`Campus: ${userData.campus}`, margin, y); y += 6;
      pdf.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, margin, y);
      y += 12;

      // Results box
      pdf.setFillColor(248, 248, 248);
      pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, 'S');

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(19, 49, 92);
      pdf.text('RESULTADO PRELIMINAR', pageWidth / 2, y + 8, { align: 'center' });

      pdf.setFontSize(18);
      pdf.text(`${validation.totalPoints.toFixed(1)} pts`, pageWidth / 2 - 25, y + 22, { align: 'center' });
      pdf.text(`RSC ${targetLevel}`, pageWidth / 2 + 25, y + 22, { align: 'center' });

      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text('Pontuação Alcançada', pageWidth / 2 - 25, y + 28, { align: 'center' });
      pdf.text('Nível Pleiteado', pageWidth / 2 + 25, y + 28, { align: 'center' });

      y += 42;

      // Status
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(120, 120, 120);
      pdf.text('Status do Processo:', margin, y);
      pdf.setTextColor(appStatus === 'Aprovado' ? 22 : 180, appStatus === 'Aprovado' ? 163 : 130, appStatus === 'Aprovado' ? 74 : 0);
      pdf.setFontSize(12);
      pdf.text(appStatus || 'Em Análise', margin + 40, y);
      y += 12;

      // Table header
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(120, 120, 120);
      pdf.text('EVIDÊNCIAS APRESENTADAS', margin, y);
      y += 2;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 80, 80);
      pdf.text('Descrição', margin, y);
      pdf.text('Qtd', pageWidth - margin - 25, y, { align: 'right' });
      pdf.text('Pontos', pageWidth - margin, y, { align: 'right' });
      y += 2;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      for (const a of activities) {
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }
        const descLines = pdf.splitTextToSize(a.desc, contentWidth - 40);
        pdf.text(descLines, margin, y);
        pdf.text(String(a.qty), pageWidth - margin - 25, y, { align: 'right' });
        pdf.setFont('helvetica', 'bold');
        pdf.text(a.points.toFixed(1), pageWidth - margin, y, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        y += descLines.length * 4 + 3;
        pdf.setDrawColor(240, 240, 240);
        pdf.line(margin, y - 1.5, pageWidth - margin, y - 1.5);
      }

      y += 8;

      // Footer
      if (y > 240) { pdf.addPage(); y = 20; }
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Documento Validado Digitalmente', margin, y);
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(`Validação: https://meu-rsc.vercel.app/validar?protocolo=${protocolNumber}`, margin, y);
      y += 4;
      pdf.text(`ID: ${protocolNumber}-${userData.cpf.replace(/\D/g, '')}`, margin, y);

      // Signature
      y += 16;
      pdf.setDrawColor(150, 150, 150);
      pdf.line(pageWidth - margin - 60, y, pageWidth - margin, y);
      y += 4;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(19, 49, 92);
      pdf.text(userData.nome, pageWidth - margin - 30, y, { align: 'center' });

      pdf.save(`Protocolo_RSC_${protocolNumber}.pdf`);
    } catch (e) {
      console.error("Erro PDF:", e);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const formData = new FormData();
    formData.append('email', authEmail);
    formData.append('password', authPassword);
    if (authMode === 'register') {
      formData.append('name', authName);
      formData.append('campus', authCampus);
    }

    try {
      const result = authMode === 'login' 
        ? await loginUser(formData) 
        : await registerUser(formData);

      if (result.success) {
        if (authMode === 'register') {
          const res = await getUserSession();
          if (res) {
            setSession(res);
            setShowLogin(false);
            setView('simulador');
          } else {
            setAuthMode('login');
            alert("Cadastro realizado! Por favor, faça login.");
          }
        } else {
          const res = await getUserSession();
          if (res) {
            setSession(res);
            setShowLogin(false);
            setView('simulador');
          }
        }
      } else {
        setAuthError(result.error || "Ocorreu um erro inesperado.");
      }
    } catch (e) {
      setAuthError("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setAuthLoading(false);
    }
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
    if (!selectedItem) return;
    
    const reqGroup = REQUISITOS.find(r => r.id === selectedReq);
    const itemData = reqGroup?.items.find(i => i.id === selectedItem);
    if (!itemData) return;

    let comprovanteUrls: string[] = [];
    if (selectedFile && session) {
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

  const renderMain = () => {
    if (view === 'home') return <HomePage onStart={() => { setShowLogin(false); setView('simulador'); }} onLogin={() => setShowLogin(true)} onHome={() => { setView('home'); window.location.hash = ''; }} session={session} visitCount={visitCount} />;

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
          <header className="bg-[#F0F0F0] border-b border-[#E0E0E0] flex justify-between items-center px-6 h-20 shrink-0">
            <div onClick={() => setView('home')} className="flex flex-col items-center leading-[0.75] font-black text-[#13315C] uppercase py-1 border-y-2 border-[#13315C] scale-75 origin-left cursor-pointer hover:opacity-80">
              <span className="text-[20px] tracking-[0.15em] ml-[0.15em]">MEU</span>
              <span className="text-[20px] tracking-[0.22em] ml-[0.22em]">RSC</span>
            </div>
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

          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="max-w-[1200px] mx-auto p-4 md:p-6 lg:p-10 flex flex-col gap-8">
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

                   <button 
                     onClick={handleDownloadPDF}
                     disabled={isSubmitting}
                     className="w-full py-4 bg-[#13315C] text-white rounded-xl font-bold hover:bg-[#001c40] transition-all flex justify-center items-center gap-3 shadow-lg mb-8"
                   >
                     <Printer size={20} />
                     Baixar Certificado de Pontuação (PDF)
                   </button>

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
                          {REQUISITOS.find(r=>r.id===selectedReq)?.items.map(i => <option key={i.id} value={i.id}>{i.desc} ({i.points} pts / {i.unit})</option>)}
                        </select>
                      </div>
                      <div className="flex gap-4">
                        <input type="number" disabled={isReadOnly} value={quantity} onChange={e=>setQuantity(parseInt(e.target.value)||1)} className="w-20 p-2 border rounded text-center disabled:bg-slate-50" />
                        <textarea disabled={isReadOnly} placeholder="Relato de experiência (Opcional)..." value={currentComment} onChange={e=>setCurrentComment(e.target.value)} className="flex-1 p-2 border rounded text-sm disabled:bg-slate-50" rows={2} />
                      </div>
                      
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
                    <div className="bg-white rounded-xl border border-[#c4c6d0] p-6 shadow-sm flex flex-col items-center gap-5">
                      {/* Header com instrução clara */}
                      <div className="w-full text-center">
                        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-3">
                          <span className="material-symbols-outlined text-[16px] text-amber-600 icon-fill">arrow_downward</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Escolha seu nível</span>
                        </div>
                        <h3 className="font-bold text-[#001c40] text-lg">Nível RSC Pretendido</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Selecione o nível que deseja pleitear para calcular a meta</p>
                      </div>

                      {/* Seletor visual de nível - cards */}
                      <div className="w-full grid grid-cols-3 gap-2">
                        {Object.keys(RSC_LEVELS).map(l => (
                          <button
                            key={l}
                            disabled={isReadOnly}
                            onClick={() => setTargetLevel(l)}
                            className={`relative flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all duration-200 font-bold text-sm cursor-pointer disabled:cursor-not-allowed ${
                              targetLevel === l
                                ? 'border-[#2757c5] bg-[#e5ecf6] text-[#2757c5] shadow-md scale-[1.02]'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {targetLevel === l && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2757c5] rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[12px] text-white icon-fill">check</span>
                              </span>
                            )}
                            <span className="text-base">RSC {l}</span>
                            <span className="text-[9px] font-medium text-slate-400 mt-0.5">{RSC_LEVELS[l].minPts} pts</span>
                          </button>
                        ))}
                      </div>

                      {/* Regras do nível selecionado */}
                      <div className="w-full bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-[16px] text-[#13315C]">info</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#13315C]">Requisitos RSC {targetLevel}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                          <span>• Mínimo de <strong>{validation.rules.minPts} pontos</strong></span>
                          <span>• Mínimo de <strong>{validation.rules.minCrit} critérios</strong> diferentes</span>
                          {validation.rules.reqRules.length > 0 && (
                            <span>• {validation.rules.ruleMsg}</span>
                          )}
                        </div>
                      </div>

                      {/* Termômetro circular */}
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#f0eded" strokeWidth="8"/>
                          <circle cx="50" cy="50" r="45" fill="none" stroke={validation.isApproved ? '#16a34a' : '#2757c5'} strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={offset} className="transition-all" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-bold">{validation.totalPoints.toFixed(0)}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">de {validation.rules.minPts} pts</span>
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
                <div className="bg-white rounded-xl border border-[#c4c6d0] p-4 md:p-8 shadow-sm flex flex-col h-full min-h-[400px] md:min-h-[600px]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
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
                <div className="bg-white rounded-xl border border-[#c4c6d0] p-4 md:p-8 shadow-sm space-y-6 max-w-2xl">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <label className="text-xs font-bold text-slate-500 uppercase">Campus de Lotação</label>
                          <select value={userData.campus} onChange={e=>setUserData({...userData, campus:e.target.value})} disabled={isReadOnly} className="w-full p-3 border rounded text-sm disabled:bg-slate-50">
                            <option value="">Selecione...</option>
                            {CAMPUS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">E-mail Institucional</label>
                        <input type="email" value={userData.email} disabled className="w-full p-3 border rounded text-sm bg-slate-100 text-slate-500" />
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

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[200] flex items-center justify-around px-2 py-1.5 safe-area-bottom">
            {appStatus && (
              <button onClick={() => setActiveTab('acompanhamento')} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] ${activeTab === 'acompanhamento' ? 'text-[#2757c5] bg-blue-50' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined text-[22px]">query_stats</span>
                <span className="text-[9px] font-bold">Protocolo</span>
              </button>
            )}
            <button onClick={() => setActiveTab('jornada')} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] ${activeTab === 'jornada' ? 'text-[#13315C] bg-slate-100' : 'text-slate-400'}`}>
              <span className="material-symbols-outlined text-[22px]">timeline</span>
              <span className="text-[9px] font-bold">Jornada</span>
            </button>
            <button onClick={() => setActiveTab('memorial')} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] ${activeTab === 'memorial' ? 'text-[#13315C] bg-slate-100' : 'text-slate-400'}`}>
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              <span className="text-[9px] font-bold">Memorial</span>
            </button>
            <button onClick={() => setActiveTab('perfil')} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] ${activeTab === 'perfil' ? 'text-[#13315C] bg-slate-100' : 'text-slate-400'}`}>
              <span className="material-symbols-outlined text-[22px]">account_circle</span>
              <span className="text-[9px] font-bold">Perfil</span>
            </button>
            <button onClick={() => setView('home')} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] text-slate-400">
              <span className="material-symbols-outlined text-[22px]">home</span>
              <span className="text-[9px] font-bold">Início</span>
            </button>
          </nav>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderMain()}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
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
                <button onClick={() => setShowLogin(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {authError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-start gap-3">
                  <AlertCircle className="shrink-0" size={18} />
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Nome Completo</label>
                      <input 
                        type="text" 
                        required 
                        value={authName} 
                        onChange={e => setAuthName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#13315c] focus:ring-2 focus:ring-[#13315c]/10 transition-all outline-none" 
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Campus</label>
                      <select 
                        required 
                        value={authCampus} 
                        onChange={e => setAuthCampus(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#13315c] focus:ring-2 focus:ring-[#13315c]/10 transition-all outline-none bg-white"
                      >
                        <option value="">Selecione seu campus</option>
                        {CAMPUS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">E-mail @ifam.edu.br</label>
                  <input 
                    type="email" 
                    required 
                    value={authEmail} 
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#13315c] focus:ring-2 focus:ring-[#13315c]/10 transition-all outline-none" 
                    placeholder="usuario@ifam.edu.br"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Senha</label>
                  <input 
                    type="password" 
                    required 
                    value={authPassword} 
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#13315c] focus:ring-2 focus:ring-[#13315c]/10 transition-all outline-none" 
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full py-4 bg-[#13315c] text-white rounded-xl font-bold hover:bg-[#001c40] shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {authLoading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro')}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                  {authMode === 'login' ? 'Ainda não tem acesso?' : 'Já possui cadastro?'}
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="ml-2 font-bold text-[#13315c] hover:underline"
                  >
                    {authMode === 'login' ? 'Cadastre-se aqui' : 'Faça login'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
