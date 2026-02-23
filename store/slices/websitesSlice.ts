import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as websitesRepo from "@/lib/api/repositories/websitesRepository";

export const fetchAllUserWebsites = createAsyncThunk(
  "websites/fetchAllUserWebsites",
  async (_, { rejectWithValue }) => {
    try {
      return await websitesRepo.getAllWebsites();
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch websites",
      );
    }
  },
);

export const fetchWebsiteDetailsById = createAsyncThunk(
  "websites/fetchWebsiteDetailsById",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      return await websitesRepo.getWebsiteById(websiteId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch website",
      );
    }
  },
);

export const updateWebsiteSettingsAndConfiguration = createAsyncThunk(
  "websites/updateWebsiteSettingsAndConfiguration",
  async (
    {
      websiteId,
      updates,
    }: {
      websiteId: string;
      updates: Record<string, unknown>;
    },
    { rejectWithValue },
  ) => {
    try {
      return await websitesRepo.updateWebsite(websiteId, updates);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update website",
      );
    }
  },
);

export const connectStripeRevenue = createAsyncThunk(
  "websites/connectStripeRevenue",
  async (
    { websiteId, apiKey }: { websiteId: string; apiKey: string },
    { rejectWithValue },
  ) => {
    try {
      return await websitesRepo.connectStripeRevenue(websiteId, apiKey);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to connect Stripe",
      );
    }
  },
);

export const disconnectStripeRevenue = createAsyncThunk(
  "websites/disconnectStripeRevenue",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      return await websitesRepo.disconnectStripeRevenue(websiteId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to disconnect Stripe",
      );
    }
  },
);

export const createNewWebsiteWithDomain = createAsyncThunk(
  "websites/createNewWebsiteWithDomain",
  async (
    {
      domain,
      name,
      iconUrl,
      settings,
    }: {
      domain: string;
      name: string;
      iconUrl?: string;
      settings?: { timezone?: string; [key: string]: unknown };
    },
    { rejectWithValue },
  ) => {
    try {
      return await websitesRepo.createWebsite({
        domain,
        name,
        iconUrl,
        settings,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create website",
      );
    }
  },
);

export const deleteWebsiteById = createAsyncThunk(
  "websites/deleteWebsiteById",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      await websitesRepo.deleteWebsite(websiteId);
      return websiteId;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete website",
      );
    }
  },
);

export const fetchAllApiKeysForWebsite = createAsyncThunk(
  "websites/fetchAllApiKeysForWebsite",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      return await websitesRepo.getApiKeys(websiteId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch API keys",
      );
    }
  },
);

export const createNewApiKeyForWebsite = createAsyncThunk(
  "websites/createNewApiKeyForWebsite",
  async (
    { websiteId, name }: { websiteId: string; name: string },
    { rejectWithValue },
  ) => {
    try {
      return await websitesRepo.createApiKey(websiteId, name);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create API key",
      );
    }
  },
);

export const deleteApiKeyByIdFromWebsite = createAsyncThunk(
  "websites/deleteApiKeyByIdFromWebsite",
  async (
    { websiteId, keyId }: { websiteId: string; keyId: string },
    { rejectWithValue },
  ) => {
    try {
      await websitesRepo.deleteApiKey(websiteId, keyId);
      return keyId;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete API key",
      );
    }
  },
);

export const fetchAllTeamMembersForWebsite = createAsyncThunk(
  "websites/fetchAllTeamMembersForWebsite",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      return await websitesRepo.getTeamMembers(websiteId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch team members",
      );
    }
  },
);

export const inviteTeamMemberToWebsite = createAsyncThunk(
  "websites/inviteTeamMemberToWebsite",
  async (
    {
      websiteId,
      email,
      role,
    }: {
      websiteId: string;
      email: string;
      role: "viewer" | "editor" | "admin";
    },
    { rejectWithValue },
  ) => {
    try {
      return await websitesRepo.inviteTeamMember(websiteId, email, role);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to invite team member",
      );
    }
  },
);

export const updateTeamMemberRoleForWebsite = createAsyncThunk(
  "websites/updateTeamMemberRoleForWebsite",
  async (
    {
      websiteId,
      memberId,
      role,
    }: {
      websiteId: string;
      memberId: string;
      role: "viewer" | "editor" | "admin";
    },
    { rejectWithValue },
  ) => {
    try {
      await websitesRepo.updateTeamMemberRole(websiteId, memberId, role);
      return { memberId, role };
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update team member role",
      );
    }
  },
);

export const removeTeamMemberFromWebsite = createAsyncThunk(
  "websites/removeTeamMemberFromWebsite",
  async (
    { websiteId, memberId }: { websiteId: string; memberId: string },
    { rejectWithValue },
  ) => {
    try {
      await websitesRepo.removeTeamMember(websiteId, memberId);
      return memberId;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to remove team member",
      );
    }
  },
);

export const fetchNotificationSettingsForWebsite = createAsyncThunk(
  "websites/fetchNotificationSettingsForWebsite",
  async (websiteId: string, { rejectWithValue }) => {
    try {
      return await websitesRepo.getNotificationSettings(websiteId);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch notifications",
      );
    }
  },
);

export const updateNotificationSettingsForWebsite = createAsyncThunk(
  "websites/updateNotificationSettingsForWebsite",
  async (
    {
      websiteId,
      weeklySummary,
      trafficSpike,
    }: {
      websiteId: string;
      weeklySummary: boolean;
      trafficSpike: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      return await websitesRepo.updateNotificationSettings(websiteId, {
        weeklySummary,
        trafficSpike,
      });
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update notification settings",
      );
    }
  },
);

export const importPlausibleDataForWebsite = createAsyncThunk(
  "websites/importPlausibleDataForWebsite",
  async (
    { websiteId, file }: { websiteId: string; file: File },
    { rejectWithValue },
  ) => {
    try {
      return await websitesRepo.importPlausibleData(websiteId, file);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to import data",
      );
    }
  },
);

export interface Website {
  _id: string;
  domain: string;
  name: string;
  iconUrl?: string;
  userId: string;
  trackingCode?: string;
  settings?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiKey {
  _id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface TeamMember {
  _id: string;
  userId: {
    _id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  invitedBy: {
    email: string;
    name?: string;
  };
  role: "viewer" | "editor" | "admin";
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  acceptedAt?: string;
}

interface WebsitesState {
  websites: Website[];
  currentWebsite: Website | null;
  loading: boolean;
  error: string | null;
  apiKeys: ApiKey[];
  apiKeysLoading: boolean;
  apiKeysError: string | null;
  teamMembers: TeamMember[];
  teamOwner: any | null;
  teamLoading: boolean;
  teamError: string | null;
  notifications: {
    weeklySummary: boolean;
    trafficSpike: boolean;
  } | null;
  notificationsLoading: boolean;
  notificationsError: string | null;
  updating: boolean;
  creating: boolean;
}

const initialState: WebsitesState = {
  websites: [],
  currentWebsite: null,
  loading: false,
  error: null,
  apiKeys: [],
  apiKeysLoading: false,
  apiKeysError: null,
  teamMembers: [],
  teamOwner: null,
  teamLoading: false,
  teamError: null,
  notifications: null,
  notificationsLoading: false,
  notificationsError: null,
  updating: false,
  creating: false,
};

const websitesSlice = createSlice({
  name: "websites",
  initialState,
  reducers: {
    setCurrentWebsite: (state, action) => {
      state.currentWebsite = action.payload;
    },
    clearWebsites: (state) => {
      state.websites = [];
      state.currentWebsite = null;
      state.error = null;
    },
    clearApiKeys: (state) => {
      state.apiKeys = [];
      state.apiKeysError = null;
    },
    clearTeam: (state) => {
      state.teamMembers = [];
      state.teamOwner = null;
      state.teamError = null;
    },
    clearNotifications: (state) => {
      state.notifications = null;
      state.notificationsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUserWebsites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUserWebsites.fulfilled, (state, action) => {
        state.loading = false;
        state.websites = action.payload;
        state.error = null;
      })
      .addCase(fetchAllUserWebsites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWebsiteDetailsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebsiteDetailsById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWebsite = action.payload;
        state.error = null;
      })
      .addCase(fetchWebsiteDetailsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateWebsiteSettingsAndConfiguration.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(
        updateWebsiteSettingsAndConfiguration.fulfilled,
        (state, action) => {
          state.updating = false;
          state.currentWebsite = action.payload;
          const index = state.websites.findIndex(
            (w) => w._id === action.payload._id,
          );
          if (index !== -1) {
            state.websites[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(
        updateWebsiteSettingsAndConfiguration.rejected,
        (state, action) => {
          state.updating = false;
          state.error = action.payload as string;
        },
      )
      .addCase(connectStripeRevenue.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(connectStripeRevenue.fulfilled, (state, action) => {
        state.updating = false;
        state.currentWebsite = action.payload;
        const index = state.websites.findIndex(
          (w) => w._id === action.payload._id,
        );
        if (index !== -1) {
          state.websites[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(connectStripeRevenue.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(disconnectStripeRevenue.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(disconnectStripeRevenue.fulfilled, (state, action) => {
        state.updating = false;
        state.currentWebsite = action.payload;
        const index = state.websites.findIndex(
          (w) => w._id === action.payload._id,
        );
        if (index !== -1) {
          state.websites[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(disconnectStripeRevenue.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(createNewWebsiteWithDomain.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createNewWebsiteWithDomain.fulfilled, (state, action) => {
        state.creating = false;
        state.websites.push(action.payload);
        state.currentWebsite = action.payload;
        state.error = null;
      })
      .addCase(createNewWebsiteWithDomain.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })
      .addCase(deleteWebsiteById.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(deleteWebsiteById.fulfilled, (state, action) => {
        state.updating = false;
        state.websites = state.websites.filter((w) => w._id !== action.payload);
        if (state.currentWebsite?._id === action.payload) {
          state.currentWebsite = null;
        }
        state.error = null;
      })
      .addCase(deleteWebsiteById.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAllApiKeysForWebsite.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(fetchAllApiKeysForWebsite.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeys = action.payload;
        state.apiKeysError = null;
      })
      .addCase(fetchAllApiKeysForWebsite.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload as string;
      })
      .addCase(createNewApiKeyForWebsite.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(createNewApiKeyForWebsite.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = null;
      })
      .addCase(createNewApiKeyForWebsite.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload as string;
      })
      .addCase(deleteApiKeyByIdFromWebsite.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(deleteApiKeyByIdFromWebsite.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeys = state.apiKeys.filter(
          (key) => key._id !== action.payload,
        );
        state.apiKeysError = null;
      })
      .addCase(deleteApiKeyByIdFromWebsite.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload as string;
      })
      .addCase(fetchAllTeamMembersForWebsite.pending, (state) => {
        state.teamLoading = true;
        state.teamError = null;
      })
      .addCase(fetchAllTeamMembersForWebsite.fulfilled, (state, action) => {
        state.teamLoading = false;
        state.teamMembers = action.payload.teamMembers;
        state.teamOwner = action.payload.owner;
        state.teamError = null;
      })
      .addCase(fetchAllTeamMembersForWebsite.rejected, (state, action) => {
        state.teamLoading = false;
        state.teamError = action.payload as string;
      })
      .addCase(inviteTeamMemberToWebsite.pending, (state) => {
        state.teamLoading = true;
        state.teamError = null;
      })
      .addCase(inviteTeamMemberToWebsite.fulfilled, (state) => {
        state.teamLoading = false;
        state.teamError = null;
      })
      .addCase(inviteTeamMemberToWebsite.rejected, (state, action) => {
        state.teamLoading = false;
        state.teamError = action.payload as string;
      })
      .addCase(updateTeamMemberRoleForWebsite.pending, (state) => {
        state.teamLoading = true;
        state.teamError = null;
      })
      .addCase(updateTeamMemberRoleForWebsite.fulfilled, (state, action) => {
        state.teamLoading = false;
        const member = state.teamMembers.find(
          (m) => m._id === action.payload.memberId,
        );
        if (member) {
          member.role = action.payload.role;
        }
        state.teamError = null;
      })
      .addCase(updateTeamMemberRoleForWebsite.rejected, (state, action) => {
        state.teamLoading = false;
        state.teamError = action.payload as string;
      })
      .addCase(removeTeamMemberFromWebsite.pending, (state) => {
        state.teamLoading = true;
        state.teamError = null;
      })
      .addCase(removeTeamMemberFromWebsite.fulfilled, (state, action) => {
        state.teamLoading = false;
        state.teamMembers = state.teamMembers.filter(
          (m) => m._id !== action.payload,
        );
        state.teamError = null;
      })
      .addCase(removeTeamMemberFromWebsite.rejected, (state, action) => {
        state.teamLoading = false;
        state.teamError = action.payload as string;
      })
      .addCase(fetchNotificationSettingsForWebsite.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(
        fetchNotificationSettingsForWebsite.fulfilled,
        (state, action) => {
          state.notificationsLoading = false;
          state.notifications = action.payload;
          state.notificationsError = null;
        },
      )
      .addCase(
        fetchNotificationSettingsForWebsite.rejected,
        (state, action) => {
          state.notificationsLoading = false;
          state.notificationsError = action.payload as string;
        },
      )
      .addCase(updateNotificationSettingsForWebsite.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(
        updateNotificationSettingsForWebsite.fulfilled,
        (state, action) => {
          state.notificationsLoading = false;
          state.notifications = action.payload;
          state.notificationsError = null;
        },
      )
      .addCase(
        updateNotificationSettingsForWebsite.rejected,
        (state, action) => {
          state.notificationsLoading = false;
          state.notificationsError = action.payload as string;
        },
      )
      .addCase(importPlausibleDataForWebsite.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(importPlausibleDataForWebsite.fulfilled, (state) => {
        state.updating = false;
        state.error = null;
      })
      .addCase(importPlausibleDataForWebsite.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentWebsite,
  clearWebsites,
  clearApiKeys,
  clearTeam,
  clearNotifications,
} = websitesSlice.actions;
export default websitesSlice.reducer;
