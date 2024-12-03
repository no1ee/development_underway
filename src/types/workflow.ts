export interface WorkflowStep {
  id: string;
  type: 'navigation' | 'interaction' | 'input' | 'custom';
  action: string;
  target?: string;
  value?: string;
  timestamp: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  createdAt: number;
  updatedAt: number;
  isAutomated: boolean;
}

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}