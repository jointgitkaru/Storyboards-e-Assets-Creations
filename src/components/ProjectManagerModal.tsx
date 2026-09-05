import React, { useState, useRef } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  X, 
  Check, 
  Calendar, 
  Tv, 
  Film,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjects } from '../context/ProjectContext';
import { soundFx } from '../utils/audio';
import { downloadFile } from '../utils/exportHelpers';
import { ScriptEpisodeImporterModal } from './ScriptEpisodeImporterModal';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    projects, 
    activeProjectId, 
    switchProject, 
    createProject, 
    duplicateProject, 
    deleteProject, 
    exportProjectJson,
    importProjectJson 
  } = useProjects();

  const [isCreating, setIsCreating] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newCategory, setNewCategory] = useState<'ads' | 'non-ads'>('ads');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;


  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    soundFx.playActionConfirm();
    createProject(newProjectName.trim(), newCategory);
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleSwitch = (id: string) => {
    soundFx.playTabSwitch();
    switchProject(id);
    onClose();
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playActionConfirm();
    duplicateProject(id);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Deseja excluir o projeto "${name}"?`)) {
      soundFx.playWarning();
      deleteProject(id);
    }
  };

  const handleExportJson = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playActionConfirm();
    const jsonStr = exportProjectJson(id);
    const filename = `project-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    downloadFile(jsonStr, filename, 'application/json');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importProjectJson(content);
        if (success) {
          soundFx.playActionConfirm();
          alert('Projeto importado com sucesso!');
        } else {
          soundFx.playWarning();
          alert('Falha ao importar: arquivo JSON inválido ou incompatível.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-3xl rounded-2xl border border-[#373a4b] bg-[#181922] shadow-2xl shadow-black overflow-hidden font-sans flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#2a2c3a] bg-[#1d1f2b] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Gerenciador de Produções & Projetos
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Multi-projeto persistido no LocalStorage · Dados sincronizados entre etapas
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252834] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-6 py-3 border-b border-[#252835] bg-[#14151e] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playMicroClick();
                  setIsCreating(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Projeto</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playMicroClick();
                  setIsScriptModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold font-mono text-xs flex items-center gap-1.5 transition-all"
                title="Importar episódio da série AMC ou colar texto em Markdown"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Importar Roteiro (.md)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={handleImportClick}
                className="px-3 py-1.5 rounded-lg bg-[#222430] hover:bg-[#2c2e3d] text-slate-300 hover:text-white border border-[#353849] font-mono text-xs flex items-center gap-1.5 transition-all"
                title="Importar projeto a partir de arquivo JSON"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar JSON</span>
              </button>
            </div>
          </div>


          {/* Create New Project Form Accordion */}
          {isCreating && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreate}
              className="p-5 border-b border-[#2e3142] bg-[#1c1e2a] space-y-4"
            >
              <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Criar Novo Espaço de Produção</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-mono text-slate-400">Nome da Produção</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Campanha Tênis Neon (15s)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#14151e] border border-[#333647] text-white text-xs font-sans focus:outline-hidden focus:border-amber-500/80"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-slate-400">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'ads' | 'non-ads')}
                    className="w-full px-3 py-2 rounded-lg bg-[#14151e] border border-[#333647] text-white text-xs font-mono focus:outline-hidden focus:border-amber-500/80"
                  >
                    <option value="ads">Comercial / Ads (16:9)</option>
                    <option value="non-ads">Ficção / Cinema (2.39:1)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition-all"
                >
                  Confirmar e Abrir
                </button>
              </div>
            </motion.form>
          )}

          {/* Projects List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-thin">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const dateFormatted = new Date(proj.updatedAt).toLocaleDateString();

              return (
                <div
                  key={proj.id}
                  onClick={() => handleSwitch(proj.id)}
                  className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'border-amber-500/60 bg-gradient-to-r from-amber-500/10 via-[#222430] to-[#1c1e28] shadow-md shadow-amber-500/10'
                      : 'border-[#2d3040] bg-[#1b1d27] hover:border-slate-500 hover:bg-[#202330]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isActive 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-[#252836] text-slate-400 border-[#383c50]'
                    }`}>
                      {proj.category === 'ads' ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold tracking-tight ${isActive ? 'text-amber-300' : 'text-white'}`}>
                          {proj.name}
                        </h4>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                            Ativo
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-[#151620] text-slate-300 text-[10px] border border-[#2b2e3e]">
                          {proj.category.toUpperCase()}
                        </span>
                        <span>·</span>
                        <span>{proj.aspectRatio}</span>
                        <span>·</span>
                        <span>15 Quadros</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {dateFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={(e) => handleDuplicate(proj.id, e)}
                      title="Duplicar projeto"
                      className="p-2 rounded-lg bg-[#252837] hover:bg-[#2f3346] text-slate-300 hover:text-white border border-[#393d52] transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleExportJson(proj.id, proj.name, e)}
                      title="Exportar backup em JSON"
                      className="p-2 rounded-lg bg-[#252837] hover:bg-[#2f3346] text-slate-300 hover:text-white border border-[#393d52] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {projects.length > 1 && (
                      <button
                        onClick={(e) => handleDelete(proj.id, proj.name, e)}
                        title="Excluir projeto"
                        className="p-2 rounded-lg bg-[#252837] hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-[#393d52] hover:border-red-500/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer status */}
          <div className="px-6 py-3 border-t border-[#252835] bg-[#14151e] flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Armazenamento local ativo ({projects.length} produções)</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#222430] hover:bg-[#2b2e3d] text-slate-200 text-xs font-medium"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>

      <ScriptEpisodeImporterModal
        isOpen={isScriptModalOpen}
        onClose={() => {
          setIsScriptModalOpen(false);
          onClose();
        }}
      />
    </AnimatePresence>
  );
};

