/**
 * ANISA HQ — Tools & Permissions Layer
 * Integrations for GitHub (AndyMagwayer), Gather Office, Filesystem, Web, Terminal.
 */

import { ApprovalRequest } from '../../src/types/index.js';

export interface ToolExecutionContext {
  agentId: string;
  taskId?: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  requiresApproval?: boolean;
  approvalRequest?: ApprovalRequest;
}

export class ApprovalManager {
  private requests: Map<string, ApprovalRequest> = new Map();

  createRequest(req: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>): ApprovalRequest {
    const id = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const full: ApprovalRequest = {
      ...req,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.requests.set(id, full);
    return full;
  }

  getPending(): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.status === 'pending');
  }

  resolve(id: string, approved: boolean): ApprovalRequest | undefined {
    const req = this.requests.get(id);
    if (!req) return undefined;
    req.status = approved ? 'approved' : 'rejected';
    this.requests.set(id, req);
    return req;
  }
}

export const approvalManager = new ApprovalManager();

// --- GitHub Integration Layer (AndyMagwayer) ---
export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  stack: string[];
  isPrivate: boolean;
  openIssues: number;
}

export class GitHubService {
  private owner = 'AndyMagwayer';
  private repos: GitHubRepo[] = [
    {
      name: 'CN-Archives',
      fullName: 'AndyMagwayer/CN-Archives',
      description: 'Central media archive and high-performance video streaming platform with VK Video integration and Dark HUD UI.',
      url: 'https://github.com/AndyMagwayer/CN-Archives',
      defaultBranch: 'main',
      stack: ['React', 'TypeScript', 'Vite', 'VK Video API', 'Tailwind CSS'],
      isPrivate: false,
      openIssues: 2,
    },
    {
      name: 'anisa-hq',
      fullName: 'AndyMagwayer/anisa-hq',
      description: 'Autonomous AI-Agent Virtual Company with Cloud Memory, specialized agents and Gather Office space.',
      url: 'https://github.com/AndyMagwayer/anisa-hq',
      defaultBranch: 'main',
      stack: ['TypeScript', 'Node.js', 'Express', 'React', 'Gemini API'],
      isPrivate: false,
      openIssues: 0,
    },
    {
      name: 'core-design-system',
      fullName: 'AndyMagwayer/core-design-system',
      description: 'Shared design tokens, Cyberpunk HUD components, and glassmorphic UI kit for AndyMagwayer projects.',
      url: 'https://github.com/AndyMagwayer/core-design-system',
      defaultBranch: 'main',
      stack: ['TypeScript', 'Tailwind CSS', 'Figma Tokens'],
      isPrivate: false,
      openIssues: 1,
    },
  ];

  async listRepositories(): Promise<GitHubRepo[]> {
    // If GITHUB_TOKEN is available, we can fetch live AndyMagwayer public repos
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      try {
        const res = await fetch(`https://api.github.com/users/${this.owner}/repos?per_page=10&sort=updated`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'ANISA-HQ-Agent',
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((r: any) => ({
              name: r.name,
              fullName: r.full_name,
              description: r.description || 'Repository by AndyMagwayer',
              url: r.html_url,
              defaultBranch: r.default_branch || 'main',
              stack: r.language ? [r.language] : ['TypeScript'],
              isPrivate: r.private || false,
              openIssues: r.open_issues_count || 0,
            }));
          }
        }
      } catch (err) {
        console.warn('[GitHubService] Live API fetch fallback to indexed repository cache:', err);
      }
    }
    return this.repos;
  }

  async getRepoDetails(repoName: string) {
    const cleanName = repoName.replace('AndyMagwayer/', '');
    const repos = await this.listRepositories();
    const repo = repos.find((r) => r.name.toLowerCase() === cleanName.toLowerCase());
    
    return {
      repo: repo || {
        name: cleanName,
        fullName: `AndyMagwayer/${cleanName}`,
        description: 'AndyMagwayer ecosystem repository',
        url: `https://github.com/AndyMagwayer/${cleanName}`,
        defaultBranch: 'main',
        stack: ['React', 'TypeScript', 'Vite'],
        isPrivate: false,
        openIssues: 1,
      },
      branches: ['main', 'feature/video-player-enhancement', 'fix/auth-token-refresh'],
      recentCommits: [
        { hash: '7f8c21a', message: 'feat: add VK Video source fallback and player controls', author: 'AndyMagwayer', date: '2 days ago' },
        { hash: '3e41b99', message: 'fix: prevent token refresh race condition on profile request', author: 'Developer Agent', date: '4 days ago' },
        { hash: '1a2b3c4', message: 'refactor: enforce strict TypeScript types in shared components', author: 'AndyMagwayer', date: '1 week ago' },
      ],
      structure: [
        'src/components/VideoPlayer.tsx',
        'src/hooks/useVKVideo.ts',
        'src/services/auth.ts',
        'src/theme/hud.ts',
        'package.json',
        'vite.config.ts',
      ],
    };
  }

  async createPullRequest(repoName: string, title: string, branch: string, changesSummary: string): Promise<any> {
    return {
      prNumber: 42,
      url: `https://github.com/AndyMagwayer/${repoName}/pull/42`,
      title,
      branch,
      base: 'main',
      status: 'open',
      summary: changesSummary,
    };
  }
}

export const gitHubService = new GitHubService();

// --- Gather Virtual Office Adapter ---
export class GatherAdapter {
  readonly spaceUrl = 'https://app.v2.gather.town/app/b4d5424e-dc10-4219-90cb-b367b14ba97f';
  readonly spaceId = 'b4d5424e-dc10-4219-90cb-b367b14ba97f';

  private rooms = [
    {
      id: 'director_suite',
      name: "Director's Suite",
      description: 'Executive command room where Anisa formulates strategies, oversees tasks, and syncs Cloud Memory.',
      capacity: 4,
      currentOccupants: ['anisa'],
    },
    {
      id: 'engineering_lab',
      name: 'Engineering Lab',
      description: 'Developer workspace with dual-monitor terminal pods for inspecting AndyMagwayer repos and coding.',
      capacity: 8,
      currentOccupants: ['developer'],
    },
    {
      id: 'design_studio',
      name: 'Design Studio',
      description: 'Creative suite for HUD styling, Figma assets, and interface prototypes.',
      capacity: 6,
      currentOccupants: ['designer'],
    },
    {
      id: 'research_alcove',
      name: 'Research Alcove',
      description: 'Library and intelligence terminal for documentation parsing and API reverse-engineering.',
      capacity: 4,
      currentOccupants: ['researcher'],
    },
    {
      id: 'qa_bench',
      name: 'QA Bench',
      description: 'Testing station and security audit bay with automated diagnostics rigs.',
      capacity: 4,
      currentOccupants: ['qa'],
    },
    {
      id: 'break_room',
      name: 'HQ Central Lounge',
      description: 'Relaxation area where agents sync shared company memory and communicate informally.',
      capacity: 12,
      currentOccupants: [],
    },
  ];

  getOfficeStatus() {
    return {
      connected: true,
      spaceId: this.spaceId,
      spaceUrl: this.spaceUrl,
      lastSync: new Date().toISOString(),
      rooms: this.rooms,
    };
  }

  moveAgent(agentId: string, targetRoomId: string) {
    this.rooms.forEach((r) => {
      r.currentOccupants = r.currentOccupants.filter((id) => id !== agentId);
      if (r.id === targetRoomId) {
        r.currentOccupants.push(agentId);
      }
    });
    return this.getOfficeStatus();
  }
}

export const gatherAdapter = new GatherAdapter();
