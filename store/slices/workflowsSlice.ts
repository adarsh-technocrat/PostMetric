import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as workflowsRepo from "@/lib/api/repositories/workflowsRepository";
import type { WorkflowItem } from "@/lib/api/repositories/workflowsRepository";

export const fetchWorkflows = createAsyncThunk(
  "workflows/fetchWorkflows",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      return await workflowsRepo.getWorkflows(websiteId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch workflows",
      );
    }
  },
);

export const fetchWorkflow = createAsyncThunk(
  "workflows/fetchWorkflow",
  async (
    { websiteId, workflowId }: { websiteId: string; workflowId: string },
    { rejectWithValue },
  ) => {
    try {
      return await workflowsRepo.getWorkflow(websiteId, workflowId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch workflow",
      );
    }
  },
);

export const createWorkflow = createAsyncThunk(
  "workflows/createWorkflow",
  async (
    payload: {
      websiteId: string;
      name: string;
      nodes?: unknown[];
      edges?: unknown[];
      trigger?: { type: string };
    },
    { rejectWithValue },
  ) => {
    try {
      return await workflowsRepo.createWorkflow(payload.websiteId, {
        name: payload.name,
        nodes: payload.nodes ?? [],
        edges: payload.edges ?? [],
        trigger: payload.trigger ?? { type: "manual" },
        isActive: false,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create workflow",
      );
    }
  },
);

export const updateWorkflow = createAsyncThunk(
  "workflows/updateWorkflow",
  async (
    payload: {
      websiteId: string;
      workflowId: string;
      name?: string;
      nodes?: unknown[];
      edges?: unknown[];
      isActive?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      return await workflowsRepo.updateWorkflow(
        payload.websiteId,
        payload.workflowId,
        {
          name: payload.name,
          nodes: payload.nodes,
          edges: payload.edges,
          isActive: payload.isActive,
        },
      );
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save workflow",
      );
    }
  },
);

export const deleteWorkflow = createAsyncThunk(
  "workflows/deleteWorkflow",
  async (
    { websiteId, workflowId }: { websiteId: string; workflowId: string },
    { rejectWithValue },
  ) => {
    try {
      await workflowsRepo.deleteWorkflow(websiteId, workflowId);
      return workflowId;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete workflow",
      );
    }
  },
);

export const duplicateWorkflow = createAsyncThunk(
  "workflows/duplicateWorkflow",
  async (
    { websiteId, workflowId }: { websiteId: string; workflowId: string },
    { rejectWithValue },
  ) => {
    try {
      const workflow = await workflowsRepo.getWorkflow(websiteId, workflowId);
      return await workflowsRepo.createWorkflow(websiteId, {
        name: `${workflow.name} (copy)`,
        nodes: workflow.nodes ?? [],
        edges: workflow.edges ?? [],
        trigger: workflow.trigger ?? { type: "manual" },
        isActive: false,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to duplicate workflow",
      );
    }
  },
);

interface WorkflowsState {
  workflows: WorkflowItem[];
  currentWorkflow: WorkflowItem | null;
  loading: boolean;
  workflowLoading: boolean;
  error: string | null;
  websiteId: string | null;
}

const initialState: WorkflowsState = {
  workflows: [],
  currentWorkflow: null,
  loading: false,
  workflowLoading: false,
  error: null,
  websiteId: null,
};

const workflowsSlice = createSlice({
  name: "workflows",
  initialState,
  reducers: {
    clearWorkflows: (state) => {
      state.workflows = [];
      state.currentWorkflow = null;
      state.error = null;
      state.websiteId = null;
    },
    setCurrentWorkflow: (state, action) => {
      state.currentWorkflow = action.payload;
    },
    clearCurrentWorkflow: (state) => {
      state.currentWorkflow = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkflows.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.websiteId = action.meta.arg;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows = action.payload;
        state.error = null;
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWorkflow.pending, (state) => {
        state.workflowLoading = true;
      })
      .addCase(fetchWorkflow.fulfilled, (state, action) => {
        state.workflowLoading = false;
        state.currentWorkflow = action.payload;
      })
      .addCase(fetchWorkflow.rejected, (state) => {
        state.workflowLoading = false;
        state.currentWorkflow = null;
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.workflows.push(action.payload);
        state.currentWorkflow = action.payload;
        state.error = null;
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        const index = state.workflows.findIndex(
          (w) => w._id === action.payload._id,
        );
        if (index !== -1) {
          state.workflows[index] = action.payload;
        }
        state.currentWorkflow = action.payload;
        state.error = null;
      })
      .addCase(updateWorkflow.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter(
          (w) => w._id !== action.payload,
        );
        if (state.currentWorkflow?._id === action.payload) {
          state.currentWorkflow = null;
        }
        state.error = null;
      })
      .addCase(deleteWorkflow.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(duplicateWorkflow.fulfilled, (state, action) => {
        state.workflows.push(action.payload);
        state.error = null;
      })
      .addCase(duplicateWorkflow.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearWorkflows, setCurrentWorkflow, clearCurrentWorkflow } =
  workflowsSlice.actions;
export default workflowsSlice.reducer;
