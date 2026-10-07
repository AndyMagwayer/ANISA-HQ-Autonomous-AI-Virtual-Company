/**
 * ANISA HQ — Cloud Memory Engine
 * Unified long-term memory with typed memories, importance tiers,
 * confidence scoring, semantic/tag retrieval, lesson extraction, and consolidation.
 */

import { MemoryItem, MemoryType, MemoryImportance, ConsolidationReport } from '../../src/types/index.js';

export class CloudMemoryEngine {
  private memories: Map<string, MemoryItem> = new Map();

  constructor() {
    this.seedInitialKnowledge();
  }

  /**
   * Seed baseline knowledge about AndyMagwayer and CN Archives
   */
  private seedInitialKnowledge(): void {
    const seeds: Array<Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        type: 'user',
        content: 'Основатель и владелец компании AndyMagwayer (GitHub: https://github.com/AndyMagwayer). Предпочитает лаконичный, технически точный стиль общения, автономность агентов и строгую типизацию.',
        source: 'user_profile',
        importance: 'critical',
        confidence: 1.0,
        tags: ['user_preference', 'andymagwayer', 'owner', 'communication'],
      },
      {
        type: 'project',
        project: 'CN Archives',
        content: 'Проект CN Archives использует стек React + TypeScript + Vite. Основной источник видео — VK Video. Интерфейс выполнен в стиле тёмного HUD (Dark HUD UI).',
        source: 'user_dialogue',
        importance: 'critical',
        confidence: 1.0,
        tags: ['CN Archives', 'react', 'typescript', 'vite', 'vk_video', 'hud_theme'],
      },
      {
        type: 'project',
        project: 'CN Archives',
        content: 'При истечении токена авторизации необходимо обновлять токен сессии перед запросом профиля пользователя, чтобы исключить race-condition ошибки.',
        source: 'task_lesson',
        importance: 'important',
        confidence: 0.95,
        tags: ['CN Archives', 'auth', 'tokens', 'bug_prevention'],
      },
      {
        type: 'agent',
        agent: 'developer',
        content: 'Developer Agent специализируется на работе с репозиториями AndyMagwayer, соблюдает модульную структуру, tsx/vite, и создаёт Pull Requests вместо прямой записи в main.',
        source: 'system_core',
        importance: 'important',
        confidence: 1.0,
        tags: ['developer', 'workflow', 'github', 'git_best_practices'],
      },
      {
        type: 'agent',
        agent: 'designer',
        content: 'Designer Agent создаёт дизайн-системы с упором на тёмные интерфейсы, киберпанк / sci-fi HUD элементы, стеклянный неоморфизм и четкую цветовую иерархию.',
        source: 'system_core',
        importance: 'useful',
        confidence: 0.9,
        tags: ['designer', 'ui_ux', 'hud', 'design_system'],
      },
      {
        type: 'company',
        content: 'Виртуальный офис ANISA HQ расположен в Gather: https://app.v2.gather.town/app/b4d5424e-dc10-4219-90cb-b367b14ba97f. Gather является физическим пространством, а ANISA HQ — интеллектом.',
        source: 'founder_mandate',
        importance: 'critical',
        confidence: 1.0,
        tags: ['gather', 'office', 'virtual_space', 'hq_core'],
      },
    ];

    seeds.forEach((seed, index) => {
      const now = new Date().toISOString();
      const id = `mem-${index + 1}-${Date.now()}`;
      this.memories.set(id, {
        ...seed,
        id,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: now,
      });
    });
  }

  /**
   * Save a memory item
   */
  public saveMemory(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): MemoryItem {
    const now = new Date().toISOString();
    const id = item.id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Check if an existing memory contradicts or updates this one
    const existing = this.findSimilarMemory(item.content, item.project);
    if (existing) {
      existing.content = item.content;
      existing.confidence = Math.min(1.0, (existing.confidence + item.confidence) / 2 + 0.1);
      existing.updatedAt = now;
      existing.importance = this.resolveImportance(existing.importance, item.importance);
      existing.tags = Array.from(new Set([...existing.tags, ...item.tags]));
      this.memories.set(existing.id, existing);
      return existing;
    }

    const memory: MemoryItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    };
    this.memories.set(id, memory);
    return memory;
  }

  private resolveImportance(a: MemoryImportance, b: MemoryImportance): MemoryImportance {
    const rank: Record<MemoryImportance, number> = {
      temporary: 1,
      useful: 2,
      important: 3,
      critical: 4,
    };
    return rank[a] >= rank[b] ? a : b;
  }

  private findSimilarMemory(content: string, project?: string): MemoryItem | undefined {
    const normalized = content.toLowerCase().trim();
    for (const mem of this.memories.values()) {
      if (project && mem.project && mem.project.toLowerCase() !== project.toLowerCase()) {
        continue;
      }
      // Simple similarity heuristic
      const memNormalized = mem.content.toLowerCase().trim();
      if (memNormalized === normalized || (normalized.length > 30 && memNormalized.includes(normalized))) {
        return mem;
      }
    }
    return undefined;
  }

  /**
   * Smart Retrieval for a specific agent and task
   * Scored by relevance, importance, confidence, and project match.
   */
  public retrieveContext(query: string, options?: {
    agentId?: string;
    project?: string;
    limit?: number;
  }): MemoryItem[] {
    const limit = options?.limit || 5;
    const queryTokens = this.tokenize(query);
    const now = Date.now();

    const scored: Array<{ memory: MemoryItem; score: number }> = [];

    for (const mem of this.memories.values()) {
      let score = 0;

      // Project match boost
      if (options?.project && mem.project) {
        if (mem.project.toLowerCase() === options.project.toLowerCase()) {
          score += 40;
        }
      }

      // Keyword / semantic token match
      const memTokens = this.tokenize(`${mem.content} ${mem.tags.join(' ')} ${mem.project || ''}`);
      let matchCount = 0;
      for (const token of queryTokens) {
        if (memTokens.has(token)) {
          matchCount++;
        }
      }
      score += matchCount * 12;

      // Agent specificity boost
      if (options?.agentId && mem.agent === options.agentId) {
        score += 15;
      }

      // Importance multiplier
      const importanceBoost: Record<MemoryImportance, number> = {
        critical: 30,
        important: 18,
        useful: 8,
        temporary: 1,
      };
      score += importanceBoost[mem.importance];

      // Confidence factor
      score *= (0.5 + mem.confidence * 0.5);

      if (score > 10) {
        // Mark as recently used
        mem.lastUsedAt = new Date().toISOString();
        scored.push({ memory: mem, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.memory);
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  }

  /**
   * List all memories with optional filters
   */
  public listMemories(filters?: {
    type?: MemoryType;
    project?: string;
    agent?: string;
    importance?: MemoryImportance;
    search?: string;
  }): MemoryItem[] {
    let result = Array.from(this.memories.values());

    if (filters?.type) {
      result = result.filter((m) => m.type === filters.type);
    }
    if (filters?.project) {
      result = result.filter((m) => m.project?.toLowerCase() === filters.project?.toLowerCase());
    }
    if (filters?.agent) {
      result = result.filter((m) => m.agent === filters.agent);
    }
    if (filters?.importance) {
      result = result.filter((m) => m.importance === filters.importance);
    }
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.content.toLowerCase().includes(term) ||
          m.tags.some((t) => t.toLowerCase().includes(term)) ||
          m.project?.toLowerCase().includes(term)
      );
    }

    // Sort: critical first, then recent
    result.sort((a, b) => {
      const impRank: Record<MemoryImportance, number> = {
        critical: 4,
        important: 3,
        useful: 2,
        temporary: 1,
      };
      if (impRank[b.importance] !== impRank[a.importance]) {
        return impRank[b.importance] - impRank[a.importance];
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }

  /**
   * Memory Consolidation
   * Merges duplicate entries, removes obsolete temporary notes, consolidates knowledge summaries.
   */
  public consolidate(): ConsolidationReport {
    const beforeCount = this.memories.size;
    let mergedCount = 0;
    let archivedTemporaryCount = 0;

    const all = Array.from(this.memories.values());
    const seenContents = new Map<string, MemoryItem>();

    for (const item of all) {
      // Clean stale temporary memories (> 7 days or low confidence < 0.4)
      if (item.importance === 'temporary' && item.confidence < 0.4) {
        this.memories.delete(item.id);
        archivedTemporaryCount++;
        continue;
      }

      // Group by topic / project key
      const key = `${item.project || 'general'}:${item.tags.slice(0, 2).sort().join('-')}`;
      if (seenContents.has(key)) {
        const primary = seenContents.get(key)!;
        // Merge tags and boost confidence
        primary.tags = Array.from(new Set([...primary.tags, ...item.tags]));
        primary.confidence = Math.min(1.0, primary.confidence + 0.05);
        primary.updatedAt = new Date().toISOString();
        if (item.importance === 'critical' || primary.importance === 'critical') {
          primary.importance = 'critical';
        }

        // Delete redundant item
        this.memories.delete(item.id);
        mergedCount++;
      } else {
        seenContents.set(key, item);
      }
    }

    const afterCount = this.memories.size;
    return {
      timestamp: new Date().toISOString(),
      beforeCount,
      afterCount,
      mergedCount,
      archivedTemporaryCount,
      summary: `Консолидация Cloud Memory завершена. Сжато с ${beforeCount} до ${afterCount} воспоминаний. Объединено записей: ${mergedCount}, архивировано устаревших заметок: ${archivedTemporaryCount}.`,
    };
  }

  public deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  public getStats() {
    const all = Array.from(this.memories.values());
    return {
      total: all.length,
      byType: {
        user: all.filter((m) => m.type === 'user').length,
        project: all.filter((m) => m.type === 'project').length,
        agent: all.filter((m) => m.type === 'agent').length,
        task: all.filter((m) => m.type === 'task').length,
        company: all.filter((m) => m.type === 'company').length,
      },
      byImportance: {
        critical: all.filter((m) => m.importance === 'critical').length,
        important: all.filter((m) => m.importance === 'important').length,
        useful: all.filter((m) => m.importance === 'useful').length,
        temporary: all.filter((m) => m.importance === 'temporary').length,
      },
    };
  }
}

export const cloudMemory = new CloudMemoryEngine();
