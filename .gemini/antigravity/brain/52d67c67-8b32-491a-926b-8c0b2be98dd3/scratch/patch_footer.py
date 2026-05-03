
import os

file_path = r'c:\Users\otran\Documents\racao_pet - Copia\src\app\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Target start and end lines (approximate)
# Looking at the previous output:
# Footer inner starts around line 331
# We want to replace from line 331 to 373

new_footer_inner = """        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 pb-12 border-b border-slate-100">
          
          {/* Coluna 1: Desenvolvimento */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Desenvolvido por:</span>
            <div className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-100 hover:shadow-md transition-all relative w-[240px] h-[70px]">
              <Image src="/logos/cmc-horiz-cor.png" alt="IFAM CMC" fill className="object-contain p-2" />
            </div>
            <p className="text-slate-500 text-xs font-medium max-w-[240px] leading-relaxed mt-2 text-center md:text-left">
              Campus Manaus Centro — Excelência em Educação Profissional e Tecnológica.
            </p>
          </div>

          {/* Coluna 2: Links Úteis */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#2f9e41] font-bold">Links Úteis</span>
            <nav className="flex flex-col items-center md:items-start gap-3">
              <button onClick={() => onHome()} className="text-sm text-slate-600 hover:text-[#2f9e41] transition-colors font-medium text-left">Início do Portal</button>
              <a href="#como-funciona" className="text-sm text-slate-600 hover:text-[#2f9e41] transition-colors font-medium">Como Funciona</a>
              <a href="https://www.ifam.edu.br" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 hover:text-[#2f9e41] transition-colors font-medium">Portal IFAM</a>
              <a href="#" className="text-sm text-slate-600 hover:text-[#2f9e41] transition-colors font-medium">Documentos Institucionais</a>
            </nav>
          </div>

          {/* Coluna 3: Suporte e Contato */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#cd191e] font-bold">Atendimento</span>
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Suporte Técnico</span>
              <a href="mailto:suporte.rsc@ifam.edu.br" className="text-sm text-slate-800 font-bold hover:text-[#2f9e41] transition-colors">suporte.rsc@ifam.edu.br</a>
            </div>
            <div className="mt-4 flex flex-col items-center md:items-start gap-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Localização</span>
              <span className="text-sm text-slate-600 text-center md:text-left font-medium">Av. Sete de Setembro, 1975 - Centro<br/>Manaus - AM, 69020-120</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.3em]">
              © {new Date().getFullYear()} Governo Federal | Instituto Federal do Amazonas
            </p>
            <p className="text-slate-400 text-[9px] uppercase tracking-[0.2em]">
              Sistema de Reconhecimento de Saberes e Competências
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end leading-tight">
                <span className="text-[14px] font-black text-[#2f9e41]">MEU RSC</span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-slate-400">Versão 1.0.0</span>
             </div>
          </div>
        </div>
"""

# Reconstruct the file
# Lines are 0-indexed in python list
# Original line 331 is index 330
# Original line 373 is index 372

# We need to find the exact start and end because line numbers might have shifted.
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '{/* Logos Institucionais */}' in line:
        start_idx = i
    if 'IFAM — Campus Manaus Centro (CMC)' in line:
        end_idx = i

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx] + [new_footer_inner + "\n"] + lines[end_idx+2:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully patched the footer.")
else:
    print(f"Failed to find anchors: start={start_idx}, end={end_idx}")
