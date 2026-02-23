import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as billingRepo from "@/lib/api/repositories/billingRepository";
import type { PlanId } from "@/lib/billing/plans";
import type { VolumeKey } from "@/lib/billing/pricing-tiers";

export const createCheckout = createAsyncThunk(
  "billing/createCheckout",
  async (
    payload: {
      planId: PlanId;
      billingPeriod: "monthly" | "yearly";
      volume?: VolumeKey;
    },
    { rejectWithValue },
  ) => {
    try {
      return await billingRepo.createCheckout(payload);
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Checkout failed",
      );
    }
  },
);

export const getBillingStatus = createAsyncThunk(
  "billing/getBillingStatus",
  async (_, { rejectWithValue }) => {
    try {
      return await billingRepo.getBillingStatus();
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch status",
      );
    }
  },
);

export const openPortal = createAsyncThunk(
  "billing/openPortal",
  async (_, { rejectWithValue }) => {
    try {
      return await billingRepo.openPortal();
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to open portal",
      );
    }
  },
);

interface BillingState {
  checkoutLoading: boolean;
  portalLoading: boolean;
  canManageBilling: boolean;
  status: Record<string, unknown> | null;
  error: string | null;
}

const initialState: BillingState = {
  checkoutLoading: false,
  portalLoading: false,
  canManageBilling: false,
  status: null,
  error: null,
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    clearBillingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCheckout.pending, (state) => {
        state.checkoutLoading = true;
        state.error = null;
      })
      .addCase(createCheckout.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.error = null;
        if (action.payload?.url && typeof window !== "undefined") {
          window.location.href = action.payload.url;
        }
      })
      .addCase(createCheckout.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getBillingStatus.fulfilled, (state, action) => {
        state.status = action.payload;
        state.canManageBilling = action.payload?.canManageBilling ?? false;
      })
      .addCase(openPortal.pending, (state) => {
        state.portalLoading = true;
        state.error = null;
      })
      .addCase(openPortal.fulfilled, (state, action) => {
        state.portalLoading = false;
        state.error = null;
        if (action.payload?.url && typeof window !== "undefined") {
          window.location.href = action.payload.url;
        }
      })
      .addCase(openPortal.rejected, (state, action) => {
        state.portalLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBillingError } = billingSlice.actions;
export default billingSlice.reducer;
