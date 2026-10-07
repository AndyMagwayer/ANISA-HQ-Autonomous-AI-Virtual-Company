/**
 * ANISA HQ — Task Orchestrator & Autonomous Execution Pipeline
 * Implements the 10-step Autonomous Director flow:
 * Understand -> Search Memory -> Inspect GitHub -> Plan -> Subtasks -> Assign -> Monitor -> Collect Results -> Store Knowledge -> Final Report
 */

import { TaskItem, TaskPriority, TaskStatus, SubTask } from '../../src/types/index.js';
import { cloudMemory } from '../memory/cloudMemory.js';
import { agentRegistry } from '../agents/definitions.js';
import { gitHubService, gatherAdapter, approvalManager } from '../tools/index.js';
import { defaultAIProvider } from '../ai/provider.js';

export class TaskOrchestrator {
  private tasks: Map<string, TaskItem> = new Map();

  constructor() {
    this.seedRecentTasks();
  }

  private seedRecentTasks() {
    const sampleTask: TaskItem = {
      id: 'task-init-01',
      title: 'Инициализация платформы ANISA HQ и интеграция с Gather',
      description: 'Синхронизация комнат в Gather офисе b4d5424e-dc10-4219-90cb-b367b14ba97f, индексация репозиториев AndyMagwayer и калибровка долговременной памяти.',
      creator: 'user',
      assignedAgent: 'anisa',
      priority: 'critical',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      subtasks: [
        { id: 'sub-1', title: 'Настройка шлюза Gather Office', assignedAgent: 'researcher', status: 'completed', result: 'Подключено пространство Gather b4d5424e-dc10-4219-90cb-b367b14ba97f.' },
        { id: 'sub-2', title: 'Индексация проекта CN Archives', assignedAgent: 'developer', status: 'completed', result: 'Зафиксирован стек React+TypeScript+Vite+VK Video в Cloud Memory.' },
        { id: 'sub-3', title: 'Формирование Dark HUD дизайн-токенов', assignedAgent: 'designer', status: 'completed', result: 'Создана киберпанк / стекло палитра для компонентов.' },
      ],
      result: 'Инфраструктура ANISA HQ приведена в боевую готовность. Агенты заняли рабочие места в Gather.',
      memoryLinks: ['mem-1', 'mem-2'],
      logs: [
        { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), agent: 'anisa', message: 'Получена директива на развертывание виртуальной компании.', level: 'info' },
        { timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString(), agent: 'developer', message: 'Зафиксирован стек проекта CN Archives.', level: 'success' },
        { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), agent: 'anisa', message: 'Миссия успешно завершена.', level: 'success' },
      ],
    };
    this.tasks.set(sampleTask.id, sampleTask);
  }

  public getTasks(): TaskItem[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getTask(id: string): TaskItem | undefined {
    return this.tasks.get(id);
  }

  /**
   * Autonomous Pipeline initiated by Anisa Director
   */
  public async executeAutonomousDirective(directive: string, options?: { priority?: TaskPriority; project?: string }): Promise<TaskItem> {
    const taskId = `task-${Date.now()}`;
    const now = new Date().toISOString();
    const priority = options?.priority || 'high';
    const detectedProject = options?.project || (directive.toLowerCase().includes('cn archives') ? 'CN Archives' : undefined);

    // Initial Task Registration
    const task: TaskItem = {
      id: taskId,
      title: directive.slice(0, 70) + (directive.length > 70 ? '...' : ''),
      description: directive,
      creator: 'user',
      assignedAgent: 'anisa',
      priority,
      status: 'planning',
      createdAt: now,
      updatedAt: now,
      subtasks: [],
      memoryLinks: [],
      logs: [],
    };
    this.tasks.set(taskId, task);

    // Step 1: Anisa Director logs comprehension
    this.addLog(task, 'anisa', `Директива принята: "${directive}". Начинаю автономный цикл оркестрации.`, 'info');
    agentRegistry.updateState('anisa', { status: 'planning', currentActivity: `Оркестрация задачи: ${task.title}` });

    // Step 2: Smart Memory Retrieval
    this.addLog(task, 'anisa', 'Опрашиваю ANISA Cloud Memory на релевантный контекст...', 'info');
    const retrievedMemories = cloudMemory.retrieveContext(directive, {
      project: detectedProject,
      limit: 4,
    });
    retrievedMemories.forEach((mem) => {
      task.memoryLinks.push(mem.id);
      this.addLog(task, 'anisa', `[Cloud Memory Извлечено] [${mem.type.toUpperCase()}] ${mem.content.slice(0, 90)}... (уверенность: ${(mem.confidence * 100).toFixed(0)}%)`, 'info');
    });

    // Step 3: Inspect GitHub AndyMagwayer if project is detected
    if (detectedProject || directive.toLowerCase().includes('github') || directive.toLowerCase().includes('код')) {
      this.addLog(task, 'developer', `Инспектирую репозиторий AndyMagwayer/${detectedProject || 'CN-Archives'}...`, 'info');
      agentRegistry.updateState('developer', { status: 'working', currentActivity: `Анализ репозитория ${detectedProject || 'CN-Archives'}` });
      const repoInfo = await gitHubService.getRepoDetails(detectedProject || 'CN-Archives');
      this.addLog(task, 'developer', `Репозиторий синхронизирован: ветка ${repoInfo.repo.defaultBranch}, файлов обнаружено: ${repoInfo.structure.length}. Стек: ${repoInfo.repo.stack.join(', ')}.`, 'success');
    }

    // Step 4 & 5: AI-driven Task Planning and Subtask Generation
    const memoryContextText = retrievedMemories.map((m) => `[${m.type}] ${m.content}`).join('\n');
    const planningPrompt = `
Директива владельца: "${directive}"
Обнаруженный проект: "${detectedProject || 'Общий стек AndyMagwayer'}"
Контекст из долговременной памяти Cloud Memory:
${memoryContextText || 'Первичное обращение к проекту.'}

Создай структурированный план подзадач для 4 специализированных агентов:
1. researcher (исследование документации/архитектуры)
2. developer (инженерная реализация в проекте AndyMagwayer)
3. designer (проверка/создание UI в HUD стиле)
4. qa (тестирование, аудит безопасности)
А также сформулируй уроки/знания, которые нужно сохранить в долговременную Cloud Memory.`;

    const aiPlan = await defaultAIProvider.generateStructured<{
      understanding: string;
      subtasks: Array<{ id: string; title: string; assignedAgent: string; status: TaskStatus; result: string }>;
      lessonsLearned: Array<{ type: string; content: string; importance: string; confidence: number; tags: string[] }>;
      directorReport: string;
    }>(
      planningPrompt,
      `{
        "understanding": "string",
        "subtasks": [{"id": "string", "title": "string", "assignedAgent": "developer|designer|researcher|qa", "status": "completed", "result": "string"}],
        "lessonsLearned": [{"type": "project|user|agent|task", "content": "string", "importance": "critical|important|useful", "confidence": 0.95, "tags": ["tag1"]}],
        "directorReport": "string"
      }`
    );

    // Step 6 & 7: Assign agents & simulate coordinated autonomous work
    task.status = 'working';
    task.subtasks = aiPlan.subtasks || [];

    for (const sub of task.subtasks) {
      const assigned = sub.assignedAgent;
      agentRegistry.updateState(assigned, {
        status: 'working',
        currentActivity: `Выполнение: ${sub.title}`,
      });
      gatherAdapter.moveAgent(assigned, assigned === 'developer' ? 'engineering_lab' : assigned === 'designer' ? 'design_studio' : assigned === 'researcher' ? 'research_alcove' : 'qa_bench');

      this.addLog(task, assigned, `[${assigned.toUpperCase()} приступил] ${sub.title}`, 'info');
      this.addLog(task, assigned, `[${assigned.toUpperCase()} результат] ${sub.result || 'Успешно реализовано согласно стандартам компании.'}`, 'success');

      agentRegistry.updateState(assigned, {
        status: 'idle',
        currentActivity: 'Задача завершена. Ожидание указаний Anisa.',
      });
    }

    // Step 8: Safety check & potential approval trigger
    if (directive.toLowerCase().includes('delete') || directive.toLowerCase().includes('drop') || directive.toLowerCase().includes('force push') || directive.toLowerCase().includes('удалить')) {
      const appr = approvalManager.createRequest({
        taskId: task.id,
        agentId: 'developer',
        toolName: 'github_write',
        actionDescription: 'Выполнение потенциально деструктивного действия в репозитории AndyMagwayer',
        dangerLevel: 'critical',
        details: { command: directive },
      });
      task.requiresApproval = true;
      this.addLog(task, 'anisa', `ВНИМАНИЕ: Запрошено подтверждение владельца (Approval ID: ${appr.id}). Опасное действие приостановлено до подтверждения.`, 'approval');
    }

    // Step 9: Store learned lessons in Cloud Memory
    if (aiPlan.lessonsLearned && aiPlan.lessonsLearned.length > 0) {
      this.addLog(task, 'anisa', 'Синтезирую новые уроки и сохраняю в долговременную Cloud Memory...', 'info');
      for (const lesson of aiPlan.lessonsLearned) {
        const saved = cloudMemory.saveMemory({
          type: (lesson.type as any) || 'task',
          content: lesson.content,
          project: detectedProject,
          source: 'autonomous_task_extraction',
          importance: (lesson.importance as any) || 'important',
          confidence: lesson.confidence || 0.9,
          tags: lesson.tags || ['autonomous_learned', detectedProject || 'general'],
        });
        task.memoryLinks.push(saved.id);
        this.addLog(task, 'anisa', `[Память дополнена] [${saved.type}] ${saved.content.slice(0, 90)}...`, 'success');
      }
    }

    // Step 10: Executive Final Report
    task.status = task.requiresApproval ? 'waiting' : 'completed';
    task.result = aiPlan.directorReport || `Директива успешно выполнена. Специализированные агенты Developer, Designer, Researcher и QA завершили подзадачи. Новые знания зафиксированы в долговременной памяти компании.`;
    task.updatedAt = new Date().toISOString();

    this.addLog(task, 'anisa', `[Финальный рапорт Anisa] ${task.result}`, 'success');
    agentRegistry.updateState('anisa', { status: 'idle', currentActivity: 'Готова к новым директивам в Director Suite' });

    return task;
  }

  private addLog(task: TaskItem, agent: string, message: string, level: 'info' | 'warn' | 'success' | 'approval' = 'info') {
    task.logs.push({
      timestamp: new Date().toISOString(),
      agent,
      message,
      level,
    });
    task.updatedAt = new Date().toISOString();
  }
}

export const taskOrchestrator = new TaskOrchestrator();
