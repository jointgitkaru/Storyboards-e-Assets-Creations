import React, { useState } from 'react';
import { 
  BookOpen, 
  Copy, 
  FolderGit2, 
  Search, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { motion } from 'motion/react';
import { PROTOCOL_DOCUMENTS } from '../data/protocolsData';

interface ProtocolDocsViewProps {
  onCopy: (text: string, label: string) => void;
}

export const ProtocolDocsView: React.FC<ProtocolDocsViewProps> = ({ onCopy }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState(PROTOCOL_DOCUMENTS[0].id);

  const filteredDocs = PROTOCOL_DOCUMENTS.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDoc = PROTOCOL_DOCUMENTS.find(d => d.id === selectedDocId) || PROTOCOL_DOCUMENTS[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto py-2"
    >
      {/* Header with Cyber Sky Archival on Dark Gray */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-[#1d222a] to-[#1a1b22] shadow-xl shadow-black/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40">
              Repositório Oficial
            </span>
            <span className="text-xs text-slate-400 font-mono">jointgitkaru/Storyboards-e-Assets-Creations</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-sky-400" />
            Protocolos de Produção & Repositório Original
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Acesso aos arquivos markdown originais com documentação na íntegra, regras invioláveis e blocos de código prontos para uso.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onCopy(activeDoc.content, `${activeDoc.title} copiado!`)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-sky-600/25"
        >
          <Copy className="w-3.5 h-3.5" />
          Copiar Arquivo Selecionado
        </motion.button>
      </div>

      {/* Main split view in Dark Gray */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document List / Search */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-4 space-y-3 shadow-md">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nome, caminho ou tag..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
              />
            </div>

            {/* Document list */}
            <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
              {filteredDocs.map((doc) => {
                const isSelected = doc.id === activeDoc.id;
                return (
                  <motion.button
                    key={doc.id}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/40 text-sky-200 ring-1 ring-sky-500/30'
                        : 'border-[#2c2e3b] bg-[#181920] text-slate-300 hover:border-[#3d4152] hover:bg-[#20222a]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-sky-400 font-bold uppercase">{doc.category}</span>
                      <span className="text-slate-400">{doc.summary}</span>
                    </div>

                    <div className="text-xs font-bold text-white truncate mb-1">
                      {doc.title}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {doc.path}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Document Content Viewer */}
        <div className="lg:col-span-8 rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#2a2c3a] pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {activeDoc.category}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {activeDoc.summary}
                </span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                {activeDoc.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Caminho: {activeDoc.path}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onCopy(activeDoc.content, 'Arquivo copiado!')}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </motion.button>
              <a
                href={`https://github.com/jointgitkaru/Storyboards-e-Assets-Creations/blob/main/${activeDoc.path.replace(/^\//, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#181920] hover:bg-[#22242e] text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-[#2c2e3b] transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                GitHub
              </a>
            </div>
          </div>

          {/* Markdown / Plain Text Viewer */}
          <pre className="p-4 rounded-xl bg-[#14151a] text-slate-200 border border-[#282a35] font-mono text-xs overflow-x-auto max-h-[580px] whitespace-pre-wrap leading-relaxed">
            {activeDoc.content}
          </pre>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-[#2a2c3a]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Documento original intacto do repositório
            </span>
            <span>{activeDoc.content.split('\n').length} linhas</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
