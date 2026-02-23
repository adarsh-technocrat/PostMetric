import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as linkTemplatesRepo from "@/lib/api/repositories/linkTemplatesRepository";
import * as foldersRepo from "@/lib/api/repositories/foldersRepository";
import type { LinkTemplate } from "@/lib/api/repositories/linkTemplatesRepository";
import type { FolderItem } from "@/lib/api/repositories/foldersRepository";

export const fetchTemplates = createAsyncThunk(
  "linkTemplates/fetchTemplates",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      return await linkTemplatesRepo.getLinkTemplates(websiteId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load templates",
      );
    }
  },
);

export const fetchFolders = createAsyncThunk(
  "linkTemplates/fetchFolders",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      return await foldersRepo.getFolders(websiteId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load folders",
      );
    }
  },
);

export const createTemplate = createAsyncThunk(
  "linkTemplates/createTemplate",
  async (
    {
      websiteId,
      payload,
    }: {
      websiteId: string;
      payload: {
        name: string;
        baseUrl?: string;
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
        utmTerm?: string;
        utmContent?: string;
        tags?: string[];
        comments?: string;
        folder?: string;
        conversionTracking?: boolean;
        customPreview?: {
          title?: string;
          description?: string;
          imageUrl?: string;
        };
        password?: string;
        expiresAt?: Date;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      return await linkTemplatesRepo.createLinkTemplate(websiteId, {
        name: payload.name,
        baseUrl: payload.baseUrl,
        utmSource: payload.utmSource,
        utmMedium: payload.utmMedium,
        utmCampaign: payload.utmCampaign,
        utmTerm: payload.utmTerm,
        utmContent: payload.utmContent,
        tags: payload.tags,
        comments: payload.comments,
        folder: payload.folder,
        conversionTracking: payload.conversionTracking,
        customPreview: payload.customPreview,
        password: payload.password,
        expiresAt: payload.expiresAt,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create template",
      );
    }
  },
);

export const deleteTemplate = createAsyncThunk(
  "linkTemplates/deleteTemplate",
  async (
    { websiteId, templateId }: { websiteId: string; templateId: string },
    { rejectWithValue },
  ) => {
    try {
      await linkTemplatesRepo.deleteLinkTemplate(websiteId, templateId);
      return templateId;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete template",
      );
    }
  },
);

interface LinkTemplatesState {
  templates: LinkTemplate[];
  folders: FolderItem[];
  loading: boolean;
  foldersLoading: boolean;
  deleting: boolean;
  error: string | null;
  websiteId: string | null;
}

const initialState: LinkTemplatesState = {
  templates: [],
  folders: [],
  loading: false,
  foldersLoading: false,
  deleting: false,
  error: null,
  websiteId: null,
};

const linkTemplatesSlice = createSlice({
  name: "linkTemplates",
  initialState,
  reducers: {
    clearLinkTemplates: (state) => {
      state.templates = [];
      state.folders = [];
      state.error = null;
      state.websiteId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.websiteId = action.meta.arg;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
        state.error = null;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFolders.pending, (state) => {
        state.foldersLoading = true;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.foldersLoading = false;
        state.folders = action.payload;
      })
      .addCase(fetchFolders.rejected, (state) => {
        state.foldersLoading = false;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.push(action.payload);
        state.error = null;
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteTemplate.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.deleting = false;
        state.templates = state.templates.filter(
          (t) => t._id !== action.payload,
        );
        state.error = null;
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLinkTemplates } = linkTemplatesSlice.actions;
export default linkTemplatesSlice.reducer;
