/**
 * ANISA HQ — Express API Router
 */

import { Router, Request, Response } from 'express';
import { agentRegistry } from '../agents/definitions.js';
import { cloudMemory } from '../memory/cloudMemory.js';
import { taskOrchestrator } from '../tasks/orchestrator.js';
import { gitHubService, gatherAdapter, approvalManager } from '../tools/index.js';

export const apiRouter = Router();

// System Status
apiRouter.get('/status', (req: Request, res: Response) => {
  const memStats = cloudMemory.getStats();
  const agents = agentRegistry.getAllAgents();
  const tasks = taskOrchestrator.getTasks();
  const pendingApprovals = approvalManager.getPending();

  res.json({
    company: 'ANISA HQ',
    version: '1.0.0-alpha',
    uptime: process.uptime(),
    status: 'operational',
    gatherOffice: {
      spaceId: gatherAdapter.spaceId,
      spaceUrl: gatherAdapter.spaceUrl,
      connected: true,
    },
    githubOwner: 'AndyMagwayer',
    stats: {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.state.status === 'working' || a.state.status === 'planning').length,
      totalMemories: memStats.total,
      memoriesByType: memStats.byType,
      memoriesByImportance: memStats.byImportance,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      pendingApprovals: pendingApprovals.length,
    },
  });
});

// Agents
apiRouter.get('/agents', (req: Request, res: Response) => {
  res.json(agentRegistry.getAllAgents());
});

// Tasks & Autonomous Director Directives
apiRouter.get('/tasks', (req: Request, res: Response) => {
  res.json(taskOrchestrator.getTasks());
});

apiRouter.post('/tasks/directive', async (req: Request, res: Response) => {
  try {
    const { directive, priority, project } = req.body;
    if (!directive || typeof directive !== 'string') {
      return res.status(400).json({ error: 'Field "directive" is required.' });
    }
    const executedTask = await taskOrchestrator.executeAutonomousDirective(directive, {
      priority,
      project,
    });
    res.json(executedTask);
  } catch (err: any) {
    console.error('[API Directive Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to execute autonomous directive' });
  }
});

// Cloud Memory
apiRouter.get('/memory', (req: Request, res: Response) => {
  const { type, project, agent, importance, search } = req.query;
  const memories = cloudMemory.listMemories({
    type: type as any,
    project: project as string,
    agent: agent as string,
    importance: importance as any,
    search: search as string,
  });
  res.json(memories);
});

apiRouter.post('/memory', (req: Request, res: Response) => {
  try {
    const { type, content, source, project, agent, importance, confidence, tags } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: 'Fields "type" and "content" are required.' });
    }
    const saved = cloudMemory.saveMemory({
      type,
      content,
      source: source || 'manual_entry',
      project,
      agent,
      importance: importance || 'useful',
      confidence: confidence ?? 0.9,
      tags: tags || ['user_note'],
    });
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/memory/consolidate', (req: Request, res: Response) => {
  const report = cloudMemory.consolidate();
  res.json(report);
});

apiRouter.delete('/memory/:id', (req: Request, res: Response) => {
  const success = cloudMemory.deleteMemory(req.params.id);
  res.json({ success });
});

// GitHub (AndyMagwayer)
apiRouter.get('/github/repos', async (req: Request, res: Response) => {
  const repos = await gitHubService.listRepositories();
  res.json(repos);
});

apiRouter.get('/github/repo/:name', async (req: Request, res: Response) => {
  const details = await gitHubService.getRepoDetails(req.params.name);
  res.json(details);
});

// Gather Office
apiRouter.get('/gather/office', (req: Request, res: Response) => {
  res.json(gatherAdapter.getOfficeStatus());
});

// Approvals
apiRouter.get('/approvals', (req: Request, res: Response) => {
  res.json(approvalManager.getPending());
});

apiRouter.post('/approvals/:id/resolve', (req: Request, res: Response) => {
  const { approved } = req.body;
  const resolved = approvalManager.resolve(req.params.id, Boolean(approved));
  if (!resolved) {
    return res.status(404).json({ error: 'Approval request not found.' });
  }
  res.json(resolved);
});
