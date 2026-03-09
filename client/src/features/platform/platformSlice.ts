import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../api/apiClient";
import {
  fetchOrganizationRequests,
  approveOrganization,
  rejectOrganization,
  suspendOrganization,
  reactivateOrganization,
  scheduleDeletion
} from "../../services/platform.service";

/* -------- STATE -------- */

interface PlatformState {
  loading: boolean;
  error: string | null;
  pendingRequests: any[];
  organizations: any[];
}

const initialState: PlatformState = {
  loading: false,
  error: null,
  pendingRequests: [],
  organizations: []
};

/* -------- FETCH REQUESTS -------- */

export const fetchRequestsThunk = createAsyncThunk(
  "platform/fetchRequests",
  async (_, thunkAPI) => {
    try {
      const data = await fetchOrganizationRequests();
      return data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch requests"
      );
    }
  }
);

/* -------- APPROVE -------- */

export const approveRequestThunk = createAsyncThunk(
  "platform/approveRequest",
  async (id: string, thunkAPI) => {
    try {
      await approveOrganization(id);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Approve failed"
      );
    }
  }
);

/* -------- REJECT -------- */

export const rejectRequestThunk = createAsyncThunk(
  "platform/rejectRequest",
  async ({ id, reason }: { id: string; reason: string }, thunkAPI) => {
    try {
      await rejectOrganization(id, reason);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Reject failed"
      );
    }
  }
);

/* -------- SUSPEND -------- */

export const suspendOrganizationThunk = createAsyncThunk(
  "platform/suspendOrganization",
  async (
    payload: { organizationId: string; reason: string },
    thunkAPI
  ) => {
    try {
      await suspendOrganization(
        payload.organizationId,
        payload.reason
      );

      return payload.organizationId;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Suspend failed"
      );
    }
  }
);

/* -------- REACTIVATE -------- */

export const reactivateOrganizationThunk = createAsyncThunk(
  "platform/reactivateOrganization",
  async (
    payload: { organizationId: string; reason: string },
    thunkAPI
  ) => {
    try {
      await reactivateOrganization(
        payload.organizationId,
        payload.reason
      );

      return payload.organizationId;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Reactivate failed"
      );
    }
  }
);

/* -------- SCHEDULE DELETION -------- */

export const scheduleDeletionThunk = createAsyncThunk(
  "platform/scheduleDeletion",
  async (
    payload: { organizationId: string; reason: string },
    thunkAPI
  ) => {
    try {
      await scheduleDeletion(
        payload.organizationId,
        payload.reason
      );

      return payload.organizationId;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Deletion scheduling failed"
      );
    }
  }
);

/* -------- FETCH ORGANIZATIONS -------- */

export const fetchOrganizationsThunk = createAsyncThunk(
  "platform/fetchOrganizations",
  async (_, thunkAPI) => {
    try {
      const res = await apiClient.get("/platform");
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch organizations"
      );
    }
  }
);

/* -------- SLICE -------- */

const platformSlice = createSlice({
  name: "platform",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      /* -------- FETCH REQUESTS -------- */

      .addCase(fetchRequestsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchRequestsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = action.payload;
      })

      .addCase(fetchRequestsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* -------- APPROVE -------- */

      .addCase(approveRequestThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(approveRequestThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = state.pendingRequests.filter(
          (r: any) => r.id !== action.payload
        );
      })

      .addCase(approveRequestThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* -------- REJECT -------- */

      .addCase(rejectRequestThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(rejectRequestThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = state.pendingRequests.filter(
          (r: any) => r.id !== action.payload
        );
      })

      .addCase(rejectRequestThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* -------- SUSPEND -------- */

      .addCase(suspendOrganizationThunk.fulfilled, (state, action) => {
        const org = state.organizations.find(
          (r: any) => r.id === action.payload
        );
        if (org) org.status = "suspended";
      })

      .addCase(suspendOrganizationThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      /* -------- REACTIVATE -------- */

      .addCase(reactivateOrganizationThunk.fulfilled, (state, action) => {
        const org = state.organizations.find(
          (r: any) => r.id === action.payload
        );
        if (org) org.status = "active";
      })

      .addCase(reactivateOrganizationThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      /* -------- SCHEDULE DELETION -------- */

      .addCase(scheduleDeletionThunk.fulfilled, (state, action) => {
        const org = state.organizations.find(
          (r: any) => r.id === action.payload
        );
        if (org) org.status = "deletion_scheduled";
      })

      .addCase(scheduleDeletionThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      /* -------- FETCH ORGANIZATIONS -------- */

      .addCase(fetchOrganizationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchOrganizationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations = action.payload;
      })

      .addCase(fetchOrganizationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export default platformSlice.reducer;