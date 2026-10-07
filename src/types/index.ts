/**
 * ANISA HQ — Core Type Definitions
 * Shared types for Agents, Memory, Tasks, Tools, Gather Office, and Integrations
 */

export type MemoryType = 
  | 'user' 
  | 'project' 
  | 'agent' 
  | 'task' 
  | 'company';

export type MemoryImportance = 
  | 'temporary' 
  | 'useful' 
  | 'important' 
  | 'critical';

export interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  source: string;              // e.g. "user_dialogue", "developer_agent", "github_sync", "task_lesson"
  project?: string;             // e.g. "CN Archives"
  agent?: string;               // e.g. "anisa", "developer", "designer", "researcher", "qa"
  importance: MemoryImportance;
  confidence: number;           // 0.0 to 1.0
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export type AgentRole = 
  | 'director' 
  | 'developer' 
  | 'designer' 
  | 'researcher' 
  | 'qa'
  | 'devops'
  | 'marketing';

export type AgentStatus = 
  | 'idle' 
  | 'planning' 
  | 'working' 
  | 'waiting' 
  | 'in_meeting' 
  | 'offline';

export interface AgentDefinition {
  id: string;
  name: string;
  role: AgentRole;
  title: string;
  avatar: string;
  color: string;
  gatherRoom: string;
  goals: string[];
  skills: string[];
  allowedTools: string[];
  systemPrompt: string;
  permissions: {
    canDirectAgents: boolean;
    canWriteFiles: boolean;
    canRunTerminal: boolean;
    canAccessGitHubWrite: boolean;
    requiresApprovalForDangerousActions: boolean;
  };
}

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  currentTaskId?: string;
  currentActivity: string;
  gatherLocation: {
    room: string;
    coordinates?: { x: number; y: number };
  };
  metrics: {
    tasksCompleted: number;
    memoriesContributed: number;
    successRate: number;
  };
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 
  | 'pending' 
  | 'planning' 
  | 'assigned' 
  | 'working' 
  | 'waiting' 
  | 'review' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface SubTask {
  id: string;
  title: string;
  assignedAgent: string;
  status: TaskStatus;
  result?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  creator: 'user' | string;
  assignedAgent: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  parentTaskId?: string;
  subtasks: SubTask[];
  dependencies?: string[];
  result?: string;
  memoryLinks: string[];       // memory item IDs used or generated
  logs: Array<{
    timestamp: string;
    agent: string;
    message: string;
    level?: 'info' | 'warn' | 'success' | 'approval';
  }>;
  requiresApproval?: boolean;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  agentId: string;
  toolName: string;
  actionDescription: string;
  dangerLevel: 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface GatherOfficeZone {
  id: string;
  name: string;
  description: string;
  type: 'director' | 'engineering' | 'design' | 'research' | 'qa' | 'lounge';
  occupants: string[]; // agent IDs
}

export interface ConsolidationReport {
  timestamp: string;
  beforeCount: number;
  afterCount: number;
  mergedCount: number;
  archivedTemporaryCount: number;
  summary: string;
}
