import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as foldersRepo from "@/lib/api/repositories/foldersRepository";
import type { FolderItem } from "@/lib/api/repositories/foldersRepository";

export const fetchFolders = createAsyncThunk(
  "folders/fetchFolders",
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

export const createFolder = createAsyncThunk(
  "folders/createFolder",
  async (
    { websiteId, name }: { websiteId: string; name: string },
    { rejectWithValue },
  ) => {
    try {
      await foldersRepo.createFolder(websiteId, name);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create folder",
      );
    }
  },
);

export const renameFolder = createAsyncThunk(
  "folders/renameFolder",
  async (
    {
      websiteId,
      oldName,
      newName,
    }: { websiteId: string; oldName: string; newName: string },
    { rejectWithValue },
  ) => {
    try {
      await foldersRepo.renameFolder(websiteId, oldName, newName);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to rename",
      );
    }
  },
);

export const deleteFolder = createAsyncThunk(
  "folders/deleteFolder",
  async (
    { websiteId, name }: { websiteId: string; name: string },
    { rejectWithValue },
  ) => {
    try {
      await foldersRepo.deleteFolder(websiteId, name);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to remove folder",
      );
    }
  },
);

interface FoldersState {
  folders: FolderItem[];
  loading: boolean;
  creating: boolean;
  renaming: boolean;
  deleting: boolean;
  error: string | null;
  websiteId: string | null;
}

const initialState: FoldersState = {
  folders: [],
  loading: false,
  creating: false,
  renaming: false,
  deleting: false,
  error: null,
  websiteId: null,
};

const foldersSlice = createSlice({
  name: "folders",
  initialState,
  reducers: {
    clearFolders: (state) => {
      state.folders = [];
      state.error = null;
      state.websiteId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolders.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.websiteId = action.meta.arg;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = action.payload;
        state.error = null;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createFolder.pending, (state) => {
        state.creating = true;
      })
      .addCase(createFolder.fulfilled, (state) => {
        state.creating = false;
        state.error = null;
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })
      .addCase(renameFolder.pending, (state) => {
        state.renaming = true;
      })
      .addCase(renameFolder.fulfilled, (state) => {
        state.renaming = false;
        state.error = null;
      })
      .addCase(renameFolder.rejected, (state, action) => {
        state.renaming = false;
        state.error = action.payload as string;
      })
      .addCase(deleteFolder.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteFolder.fulfilled, (state) => {
        state.deleting = false;
        state.error = null;
      })
      .addCase(deleteFolder.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearFolders } = foldersSlice.actions;
export default foldersSlice.reducer;
