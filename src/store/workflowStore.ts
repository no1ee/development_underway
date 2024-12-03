import { create } from 'zustand';
import { Workflow } from '../types/workflow';

interface WorkflowState {
  workflows: Workflow[];
  activeWorkflow: Workflow | null;
  isRecording: boolean;
  setRecording: (isRecording: boolean) => void;
  addWorkflow: (workflow: Workflow) => void;
  setActiveWorkflow: (workflow: Workflow | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  activeWorkflow: null,
  isRecording: false,
  setRecording: (isRecording) => set({ isRecording }),
  addWorkflow: (workflow) =>
    set((state) => ({ workflows: [...state.workflows, workflow] })),
  setActiveWorkflow: (workflow) => set({ activeWorkflow: workflow }),
}));