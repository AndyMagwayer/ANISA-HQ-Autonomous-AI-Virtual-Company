import React, { useState, useEffect } from 'react';
import {
  Brain,
  Building2,
  FolderGit2,
  Shield,
  Sparkles,
  Play,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Search,
  Filter,
  Activity,
  Check,
  X,
  Send,
  MessageSquare,
  Compass,
  Cpu,
  HelpCircle,
  FileText
} from 'lucide-react';
import { AgentDefinition, AgentState, MemoryItem, TaskItem, ApprovalRequest } from './types/index.js';

type Tab = 'director' | 'memory' | 'agents' | 'gather' | 'github' | 'approvals';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('director');
  const [statusData, setStatusData] = useState<any>(null);
  const [agents, setAgents] = useState<Array<{ definition: AgentDefinition; state: AgentState }>>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [gatherStatus, setGatherStatus] = useState<any>(null);

  // Director execution state
  const [directiveInput, setDirectiveInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTaskView, setActiveTaskView] = useState<TaskItem | null>(null);

  // Memory filter states
  const [memorySearch, setMemorySearch] = useState('');
  const [selectedMemoryType, setSelectedMemoryType] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [consolidationResult, setConsolidationResult] = useState<any>(null);

  // New Memory Modal
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [newMemoryForm, setNewMemoryForm] = useState({
    type: 'project',
    project: 'CN Archives',
    content: '',
    importance: 'important',
    confidence: 1.0,
    tags: 'CN Archives, react',
  });

  // Initial Data Fetch
  const refreshAll = async () => {
    try {
      const [statusRes, agentsRes, tasksRes, memRes, apprRes, reposRes, gatherRes] = await Promise.all([
        fetch('/api/status').then((r) => r.json()),
        fetch('/api/agents').then((r) => r.json()),
        fetch('/api/tasks').then((r) => r.json()),
        fetch('/api/memory').then((r) => r.json()),
        fetch('/api/approvals').then((r) => r.json()),
        fetch('/api/github/repos').then((r) => r.json()),
        fetch('/api/gather/office').then((r) => r.json()),
      ]);

      setStatusData(statusRes);
      setAgents(agentsRes);
      setTasks(tasksRes);
      if (tasksRes.length > 0 && !activeTaskView) {
        setActiveTaskView(tasksRes[0]);
      }
      setMemories(memRes);
      setApprovals(apprRes);
      setRepos(reposRes);
      setGatherStatus(gatherRes);
    } catch (err) {
      console.error('Failed to load HQ data:', err);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 6000);
    return () => clearInterval(interval);
  }, []);

  // Submit directive to Anisa Director
  const handleExecuteDirective = async (customPrompt?: string) => {
    const text = customPrompt || directiveInput;
    if (!text.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const res = await fetch('/api/tasks/directive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directive: text,
          priority: 'high',
          project: text.toLowerCase().includes('cn archives') ? 'CN Archives' : undefined,
        }),
      });
      const data: TaskItem = await res.json();
      setActiveTaskView(data);
      setDirectiveInput('');
      await refreshAll();
    } catch (err) {
      console.error('Execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run Memory Consolidation
  const handleConsolidate = async () => {
    setIsConsolidating(true);
    try {
      const res = await fetch('/api/memory/consolidate', { method: 'POST' });
      const report = await res.json();
      setConsolidationResult(report);
      await refreshAll();
    } catch (err) {
      console.error('Consolidation failed:', err);
    } finally {
      setIsConsolidating(false);
    }
  };

  // Add Manual Memory
  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newMemoryForm.type,
          project: newMemoryForm.project,
          content: newMemoryForm.content,
          importance: newMemoryForm.importance,
          confidence: parseFloat(String(newMemoryForm.confidence)),
          tags: newMemoryForm.tags.split(',').map((t) => t.trim()),
          source: 'owner_manual_entry',
        }),
      });
      setShowAddMemoryModal(false);
      setNewMemoryForm({
        type: 'project',
        project: 'CN Archives',
        content: '',
        importance: 'important',
        confidence: 1.0,
        tags: 'CN Archives, react',
      });
      await refreshAll();
    } catch (err) {
      console.error('Save memory failed:', err);
    }
  };

  // Handle Approvals
  const handleResolveApproval = async (id: string, approved: boolean) => {
    try {
      await fetch(`/api/approvals/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      await refreshAll();
    } catch (err) {
      console.error('Approval resolution failed:', err);
    }
  };

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    if (selectedMemoryType !== 'all' && m.type !== selectedMemoryType) return false;
    if (selectedProjectFilter !== 'all' && m.project !== selectedProjectFilter) return false;
    if (memorySearch) {
      const q = memorySearch.toLowerCase();
      return (
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        (m.project && m.project.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Cybernetic Header */}
      <header className="border-b border-cyan-950/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40 px-5 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Brain className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  ANISA HQ
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                  v1.0 Core
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Operational
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Autonomous AI Virtual Company • Lead by Director Anisa</p>
            </div>
          </div>

          {/* Quick Telemetry Indicators */}
          <div className="flex items-center gap-3 text-xs">
            {/* Gather Link */}
            <a
              href="https://app.v2.gather.town/app/b4d5424e-dc10-4219-90cb-b367b14ba97f"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/70 text-indigo-300 transition group"
            >
              <Building2 className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Gather Office</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            {/* GitHub Link */}
            <a
              href="https://github.com/AndyMagwayer"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/70 text-emerald-300 transition group"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>AndyMagwayer</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            {/* Cloud Memory Stat */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>Memories:</span>
              <strong className="text-cyan-300">{statusData?.stats?.totalMemories ?? '...'}</strong>
            </div>

            {/* Approvals Alert */}
            {approvals.length > 0 && (
              <button
                onClick={() => setActiveTab('approvals')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600 text-amber-200 animate-pulse font-mono"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Approvals: {approvals.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 overflow-x-auto border-t border-slate-800/80 pt-2">
          <button
            onClick={() => setActiveTab('director')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'director'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Director Command Center
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'memory'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            ANISA Cloud Memory ({memories.length})
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'agents'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Agents & Task Board ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab('gather')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'gather'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Gather Virtual Office
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'github'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            GitHub Hub (AndyMagwayer)
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'approvals'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Approvals & Security ({approvals.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-5">
        {/* TAB 1: DIRECTOR COMMAND CENTER */}
        {activeTab === 'director' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Directives Input & Presets */}
            <div className="lg:col-span-5 space-y-4">
              {/* Director Persona Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-cyan-950 border border-cyan-500/40 p-1 flex items-center justify-center relative">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                      alt="Anisa"
                      className="rounded-lg object-cover h-full w-full"
                    />
                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base text-cyan-200">Anisa Director</h2>
                    <p className="text-xs text-slate-400">Chief Executive of ANISA HQ • Gather: Director's Suite</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                  "Привет, AndyMagwayer. Я готова принять твои директивы. Я извлекаю контекст из общей Cloud Memory, инспектирую репозитории, делегирую Developer, Designer, Researcher и QA, а после завершения — фиксирую опыт."
                </p>

                {/* Preset Fast Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Быстрые сценарии для теста:</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handleExecuteDirective('Проверь мой проект CN Archives и предложи план архитектурных улучшений')}
                      className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-700/60 text-slate-300 hover:text-cyan-200 transition"
                    >
                      ⚡ "Проверь мой проект CN Archives и предложи план улучшений"
                    </button>
                    <button
                      onClick={() => handleExecuteDirective('В проекте CN Archives добавь обработку истечения токена авторизации и проверку VK Video')}
                      className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-700/60 text-slate-300 hover:text-cyan-200 transition"
                    >
                      ⚡ "В CN Archives добавь обработку истечения токена и проверку VK Video"
                    </button>
                    <button
                      onClick={() => handleExecuteDirective('Разработай киберпанк HUD дизайн-систему для нового сервиса AndyMagwayer')}
                      className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-700/60 text-slate-300 hover:text-cyan-200 transition"
                    >
                      ⚡ "Разработай киберпанк HUD дизайн-систему для нового сервиса"
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Command Box */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    Директива для Anisa:
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">Autonomous Orchestration Pipeline</span>
                </div>
                <textarea
                  value={directiveInput}
                  onChange={(e) => setDirectiveInput(e.target.value)}
                  placeholder="Например: Проанализируй видеоплеер в CN Archives, согласуй интерфейс с Designer и подготовь Pull Request..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-sans"
                />
                <button
                  disabled={isExecuting || !directiveInput.trim()}
                  onClick={() => handleExecuteDirective()}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                      <span>Anisa оркестрирует команду...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Запустить автономный цикл (10 шагов)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Company Team Summary */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">Активные сотрудники в офисе:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {agents.map(({ definition, state }) => (
                    <div key={definition.id} className="p-2 rounded bg-slate-950/70 border border-slate-800/80 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: definition.color }} />
                      <div className="truncate">
                        <div className="font-medium text-slate-200">{definition.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{state.gatherLocation.room}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Execution Live Stepper & Task Results */}
            <div className="lg:col-span-7 space-y-4">
              {activeTaskView ? (
                <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-900/50 space-y-5">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {activeTaskView.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-950 text-purple-300 border border-purple-800">
                          Priority: {activeTaskView.priority}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base text-slate-100 mt-1.5">{activeTaskView.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">Task ID: {activeTaskView.id}</p>
                    </div>

                    <button
                      onClick={refreshAll}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Обновить"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 10-Step Autonomous Pipeline Stepper */}
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" />
                      10-Шаговый автономный цикл оркестрации:
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] font-mono">
                      {[
                        { step: 1, label: 'Понимание задачи', done: true },
                        { step: 2, label: 'Cloud Memory Search', done: true },
                        { step: 3, label: 'GitHub AndyMagwayer', done: true },
                        { step: 4, label: 'План подзадач', done: true },
                        { step: 5, label: 'Делегирование', done: true },
                        { step: 6, label: 'Developer & Tools', done: true },
                        { step: 7, label: 'Designer & HUD', done: true },
                        { step: 8, label: 'QA Проверка', done: true },
                        { step: 9, label: 'Фиксация уроков', done: true },
                        { step: 10, label: 'Финальный рапорт', done: true },
                      ].map((s) => (
                        <div
                          key={s.step}
                          className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="truncate text-slate-300">{s.step}. {s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtasks Delegated */}
                  {activeTaskView.subtasks && activeTaskView.subtasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">
                        Делегированные подзадачи сотрудникам:
                      </h4>
                      <div className="space-y-2">
                        {activeTaskView.subtasks.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] uppercase font-bold text-cyan-400">
                                  @{sub.assignedAgent}
                                </span>
                                <span className="text-xs font-medium text-slate-200">{sub.title}</span>
                              </div>
                              {sub.result && (
                                <p className="mt-1 text-xs text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                                  <strong className="text-emerald-400 font-mono">Результат:</strong> {sub.result}
                                </p>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {sub.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execution Logs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      Журнал выполнения и обращений к Cloud Memory:
                    </h4>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                      {activeTaskView.logs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-300">
                          <span className="text-slate-500 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span
                            className={`px-1 rounded text-[10px] uppercase font-bold ${
                              log.agent === 'anisa'
                                ? 'text-cyan-400 bg-cyan-950'
                                : log.agent === 'developer'
                                ? 'text-emerald-400 bg-emerald-950'
                                : 'text-purple-400 bg-purple-950'
                            }`}
                          >
                            [{log.agent}]
                          </span>
                          <span
                            className={
                              log.level === 'success'
                                ? 'text-emerald-300'
                                : log.level === 'approval'
                                ? 'text-amber-300 font-bold'
                                : 'text-slate-300'
                            }
                          >
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Report Banner */}
                  {activeTaskView.result && (
                    <div className="p-3.5 rounded-lg bg-gradient-to-r from-cyan-950/70 to-emerald-950/70 border border-cyan-800/80">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        Итоговый доклад Anisa:
                      </div>
                      <p className="mt-1 text-xs text-slate-200 leading-relaxed">{activeTaskView.result}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
                  <Compass className="h-10 w-10 text-cyan-500/40 mx-auto" />
                  <p className="text-sm text-slate-400">Выберите задачу из списка или отправьте новую директиву Anisa.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ANISA CLOUD MEMORY */}
        {activeTab === 'memory' && (
          <div className="space-y-5">
            {/* Memory Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-cyan-900/50">
              <div>
                <h2 className="text-base font-bold text-cyan-200 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-cyan-400" />
                  ANISA Cloud Memory — Единая долговременная память
                </h2>
                <p className="text-xs text-slate-400">
                  Интеллектуальное накопление опыта по проектам (CN Archives), агентам и владельцу с поддержкой консолидации.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddMemoryModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить знание
                </button>

                <button
                  onClick={handleConsolidate}
                  disabled={isConsolidating}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isConsolidating ? 'animate-spin' : ''}`} />
                  Запустить консолидацию памяти
                </button>
              </div>
            </div>

            {/* Consolidation Result Notice */}
            {consolidationResult && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-start justify-between">
                <div>
                  <strong>{consolidationResult.summary}</strong>
                </div>
                <button onClick={() => setConsolidationResult(null)}>
                  <X className="h-3.5 w-3.5 text-emerald-400" />
                </button>
              </div>
            )}

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Поиск по памяти (React, VK Video, auth, bugs...)"
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={selectedMemoryType}
                onChange={(e) => setSelectedMemoryType(e.target.value)}
                className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Все типы памяти</option>
                <option value="user">User Memory (О владельце AndyMagwayer)</option>
                <option value="project">Project Memory (CN Archives и др.)</option>
                <option value="agent">Agent Memory (Опыт сотрудников)</option>
                <option value="task">Task Memory (Уроки задач)</option>
                <option value="company">Company Memory (Офис Gather)</option>
              </select>

              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Все проекты</option>
                <option value="CN Archives">CN Archives</option>
              </select>
            </div>

            {/* Memories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-700/60 transition flex flex-col justify-between space-y-3 relative overflow-hidden group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-950 text-cyan-400 border border-slate-800">
                        {mem.type}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                          mem.importance === 'critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : mem.importance === 'important'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-950 text-slate-400'
                        }`}
                      >
                        {mem.importance}
                      </span>
                    </div>

                    {mem.project && (
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <FolderGit2 className="h-3 w-3" />
                        Project: {mem.project}
                      </div>
                    )}

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{mem.content}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Уверенность:</span>
                      <span className="text-cyan-300 font-bold">{(mem.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {mem.tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-slate-500 pt-1">
                      <span>Источник: {mem.source}</span>
                      <span>{new Date(mem.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AGENTS & TASK BOARD */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-400" />
                Специализированные агенты ANISA HQ
              </h2>
              <p className="text-xs text-slate-400">
                Каждый агент имеет свой профиль, роли, инструменты, права доступа и местоположение в Gather.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(({ definition, state }) => (
                <div
                  key={definition.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative">
                      <img src={definition.avatar} alt={definition.name} className="h-full w-full object-cover" />
                      <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900"
                        style={{ backgroundColor: definition.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-200">{definition.name}</h3>
                      <p className="text-[11px] text-cyan-400 font-mono">{definition.title}</p>
                      <p className="text-[10px] text-slate-400">Gather: {definition.gatherRoom}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Навыки:</span>
                    <div className="flex flex-wrap gap-1">
                      {definition.skills.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-slate-300 border border-slate-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Инструменты:</span>
                    <div className="flex flex-wrap gap-1">
                      {definition.allowedTools.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Статус: <strong className="text-emerald-400 uppercase">{state.status}</strong></span>
                    <span>Задач: {state.metrics.tasksCompleted}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Task Board */}
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                История корпоративных задач ({tasks.length}):
              </h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setActiveTaskView(task);
                      setActiveTab('director');
                    }}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-800/60 cursor-pointer transition flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-950 text-cyan-400 border border-slate-800">
                          {task.status}
                        </span>
                        <h4 className="font-semibold text-xs text-slate-200">{task.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-slate-400">
                      <span>Подзадач: {task.subtasks.length}</span>
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GATHER VIRTUAL OFFICE */}
        {activeTab === 'gather' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-indigo-200">Gather Office Space Integration</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    🟢 Live Synced
                  </span>
                </div>
                <p className="text-xs text-indigo-300/80 mt-1">
                  Space ID: <code className="font-mono text-cyan-300">b4d5424e-dc10-4219-90cb-b367b14ba97f</code>. Gather является визуальным офисом компании.
                </p>
              </div>

              <a
                href="https://app.v2.gather.town/app/b4d5424e-dc10-4219-90cb-b367b14ba97f"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
              >
                <span>Войти в виртуальный офис Gather</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Interactive Blueprint Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gatherStatus?.rooms?.map((room: any) => (
                <div
                  key={room.id}
                  className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-700/60 transition space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-100">{room.name}</h3>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      Вместимость: {room.capacity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{room.description}</p>

                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1.5">
                      Сотрудники в комнате:
                    </span>
                    {room.currentOccupants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {room.currentOccupants.map((agentId: string) => {
                          const ag = agents.find((a) => a.definition.id === agentId);
                          return (
                            <span
                              key={agentId}
                              className="px-2 py-1 rounded text-xs bg-slate-950 border border-cyan-800/80 text-cyan-300 font-mono flex items-center gap-1.5"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {ag?.definition.name || agentId}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Свободная зона</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: GITHUB HUB (AndyMagwayer) */}
        {activeTab === 'github' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-900/50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-emerald-200">GitHub Integration — AndyMagwayer</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Developer Agent инспектирует существующие проекты (CN Archives), анализирует код и готовит Pull Requests.
                </p>
              </div>

              <a
                href="https://github.com/AndyMagwayer"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <span>Открыть GitHub AndyMagwayer</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <div
                  key={repo.name}
                  onClick={async () => {
                    const res = await fetch(`/api/github/repo/${repo.name}`).then((r) => r.json());
                    setSelectedRepo(res);
                  }}
                  className={`p-4 rounded-xl bg-slate-900/80 border transition cursor-pointer space-y-3 ${
                    selectedRepo?.repo?.name === repo.name
                      ? 'border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'border-slate-800 hover:border-emerald-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200">{repo.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {repo.defaultBranch}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{repo.description}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {repo.stack?.map((s: string) => (
                      <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-slate-300 border border-slate-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Repo Detailed Inspection */}
            {selectedRepo && (
              <div className="p-5 rounded-xl bg-slate-900/90 border border-emerald-900/60 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-semibold text-base text-emerald-300">
                      Инспекция проекта: {selectedRepo.repo.fullName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Developer Agent синхронизирован со стеком {selectedRepo.repo.stack.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleExecuteDirective(`Developer, проанализируй код репозитория ${selectedRepo.repo.name} и предложи оптимизацию`);
                      setActiveTab('director');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Play className="h-3 w-3" />
                    Назначить Developer Agent
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 uppercase text-[10px] block mb-2 font-bold">
                      Структура ключевых файлов:
                    </span>
                    <div className="space-y-1 text-slate-300">
                      {selectedRepo.structure?.map((file: string) => (
                        <div key={file} className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-cyan-400" />
                          <span>{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 uppercase text-[10px] block mb-2 font-bold">
                      Недавние коммиты AndyMagwayer:
                    </span>
                    <div className="space-y-2 text-slate-300">
                      {selectedRepo.recentCommits?.map((c: any) => (
                        <div key={c.hash} className="border-b border-slate-900 pb-1.5 last:border-none">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-cyan-400 font-bold">{c.hash}</span>
                            <span className="text-slate-500 text-[10px]">{c.date}</span>
                          </div>
                          <div className="text-xs text-slate-200 mt-0.5">{c.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: APPROVALS & SECURITY */}
        {activeTab === 'approvals' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                Центр подтверждения опасных действий (Approvals Center)
              </h2>
              <p className="text-xs text-slate-400">
                Защита от неконтролируемых изменений в GitHub AndyMagwayer и деструктивных операций.
              </p>
            </div>

            {approvals.length > 0 ? (
              <div className="space-y-3">
                {approvals.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-slate-900/90 border border-amber-600/70 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-800">
                            {req.dangerLevel} danger
                          </span>
                          <span className="text-xs font-mono text-cyan-400">Agent: @{req.agentId}</span>
                        </div>
                        <h3 className="font-semibold text-sm text-slate-100 mt-1">{req.actionDescription}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Tool: {req.toolName}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveApproval(req.id, true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1 transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Разрешить
                        </button>
                        <button
                          onClick={() => handleResolveApproval(req.id, false)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold text-xs flex items-center gap-1 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                          Отклонить
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
                      <code>{JSON.stringify(req.details, null, 2)}</code>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-200">Все операции штатные</h3>
                <p className="text-xs text-slate-400">
                  Нет ожидающих подтверждения действий. Developer и другие агенты действуют в рамках разрешённых политик.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Memory Modal */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-800 rounded-xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-semibold text-sm text-cyan-200">Добавить знание в ANISA Cloud Memory</h3>
              <button onClick={() => setShowAddMemoryModal(false)}>
                <X className="h-4 w-4 text-slate-400 hover:text-slate-200" />
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Тип памяти:</label>
                <select
                  value={newMemoryForm.type}
                  onChange={(e) => setNewMemoryForm({ ...newMemoryForm, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200"
                >
                  <option value="project">Project Memory</option>
                  <option value="user">User Memory</option>
                  <option value="agent">Agent Memory</option>
                  <option value="task">Task Memory</option>
                  <option value="company">Company Memory</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Проект (опционально):</label>
                <input
                  type="text"
                  value={newMemoryForm.project}
                  onChange={(e) => setNewMemoryForm({ ...newMemoryForm, project: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Содержание знания:</label>
                <textarea
                  required
                  rows={3}
                  value={newMemoryForm.content}
                  onChange={(e) => setNewMemoryForm({ ...newMemoryForm, content: e.target.value })}
                  placeholder="В проекте CN Archives плеер использует..."
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Важность:</label>
                  <select
                    value={newMemoryForm.importance}
                    onChange={(e) => setNewMemoryForm({ ...newMemoryForm, importance: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200"
                  >
                    <option value="temporary">Temporary</option>
                    <option value="useful">Useful</option>
                    <option value="important">Important</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Теги (через запятую):</label>
                  <input
                    type="text"
                    value={newMemoryForm.tags}
                    onChange={(e) => setNewMemoryForm({ ...newMemoryForm, tags: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMemoryModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold"
                >
                  Зафиксировать в Cloud Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-5 text-center text-xs font-mono text-slate-600">
        ANISA HQ • Autonomous Virtual Company Architecture • Powered by Director Anisa, Cloud Memory, AndyMagwayer GitHub Layer & Gather Space
      </footer>
    </div>
  );
}
