import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import {
  inviteSiteMonitor,
  verifySiteMonitorOtp,
  fetchSiteMonitors,
  fetchSiteMonitorById,
  updateSiteMonitor,
  changeSiteMonitorPassword,
  deleteSiteMonitor,
} from "../../services/siteMonitor.service";

import type {
  SiteMonitor,
  InviteSiteMonitorRequest,
  VerifySiteMonitorOtpRequest,
  UpdateSiteMonitorRequest,
  ChangeSiteMonitorPasswordRequest,
} from "../../services/siteMonitor.service";

interface SiteMonitorState {
  loading: boolean;
  inviteLoading: boolean;
  verifyLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  passwordLoading: boolean;
  error: string | null;
  success: boolean;
  monitors: SiteMonitor[];
  selectedMonitor: SiteMonitor | null;
}

const initialState: SiteMonitorState = {
  loading: false,
  inviteLoading: false,
  verifyLoading: false,
  updateLoading: false,
  deleteLoading: false,
  passwordLoading: false,
  error: null,
  success: false,
  monitors: [],
  selectedMonitor: null,
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }

  return fallback;
};

export const inviteSiteMonitorThunk = createAsyncThunk<
  unknown,
  InviteSiteMonitorRequest,
  { rejectValue: string }
>("siteMonitor/invite", async (payload, thunkAPI) => {
  try {
    return await inviteSiteMonitor(payload);
  } catch (err) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(err, "Failed to invite site monitor")
    );
  }
});

export const verifySiteMonitorOtpThunk = createAsyncThunk<
  unknown,
  VerifySiteMonitorOtpRequest,
  { rejectValue: string }
>("siteMonitor/verifyOtp", async (payload, thunkAPI) => {
  try {
    return await verifySiteMonitorOtp(payload);
  } catch (err) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(err, "Failed to verify OTP")
    );
  }
});

export const fetchSiteMonitorsThunk = createAsyncThunk<
  SiteMonitor[],
  void,
  { rejectValue: string }
>("siteMonitor/fetchAll", async (_, thunkAPI) => {
  try {
    return await fetchSiteMonitors();
  } catch (err) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(err, "Failed to fetch site monitors")
    );
  }
});

export const fetchSiteMonitorByIdThunk = createAsyncThunk<
  SiteMonitor,
  string,
  { rejectValue: string }
>("siteMonitor/fetchById", async (id, thunkAPI) => {
  try {
    return await fetchSiteMonitorById(id);
  } catch (err) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(err, "Failed to fetch site monitor")
    );
  }
});

export const updateSiteMonitorThunk = createAsyncThunk<
  unknown,
  UpdateSiteMonitorRequest,
  { rejectValue: string }
>("siteMonitor/update", async (payload, thunkAPI) => {
  try {
    return await updateSiteMonitor(payload);
  } catch (err) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(err, "Failed to update site monitor")
    );
  }
});

export const changeSiteMonitorPasswordThunk = createAsyncThunk<
  unknown,
  ChangeSiteMonitorPasswordRequest,
  { rejectValue: string }
>("siteMonitor/changePassword", async (payload, thunkAPI) => {
  try {
    return await changeSiteMonitorPassword(payload);
  } catch (err) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(err, "Failed to change password")
    );
  }
});

export const deleteSiteMonitorThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("siteMonitor/delete", async (id, thunkAPI) => {
  try {
    await deleteSiteMonitor(id);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(err, "Failed to delete site monitor")
    );
  }
});

const siteMonitorSlice = createSlice({
  name: "siteMonitor",
  initialState,

  reducers: {
    resetSiteMonitorState: (state) => {
      state.loading = false;
      state.inviteLoading = false;
      state.verifyLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;
      state.passwordLoading = false;
      state.error = null;
      state.success = false;
    },

    clearSelectedMonitor: (state) => {
      state.selectedMonitor = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(inviteSiteMonitorThunk.pending, (state) => {
        state.inviteLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(inviteSiteMonitorThunk.fulfilled, (state) => {
        state.inviteLoading = false;
        state.success = true;
      })
      .addCase(inviteSiteMonitorThunk.rejected, (state, action) => {
        state.inviteLoading = false;
        state.error = action.payload || "Failed to invite site monitor";
      })

      .addCase(verifySiteMonitorOtpThunk.pending, (state) => {
        state.verifyLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(verifySiteMonitorOtpThunk.fulfilled, (state) => {
        state.verifyLoading = false;
        state.success = true;
      })
      .addCase(verifySiteMonitorOtpThunk.rejected, (state, action) => {
        state.verifyLoading = false;
        state.error = action.payload || "Failed to verify OTP";
      })

      .addCase(fetchSiteMonitorsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSiteMonitorsThunk.fulfilled,
        (state, action: PayloadAction<SiteMonitor[]>) => {
          state.loading = false;
          state.monitors = action.payload;
        }
      )
      .addCase(fetchSiteMonitorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch site monitors";
      })

      .addCase(fetchSiteMonitorByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSiteMonitorByIdThunk.fulfilled,
        (state, action: PayloadAction<SiteMonitor>) => {
          state.loading = false;
          state.selectedMonitor = action.payload;
        }
      )
      .addCase(fetchSiteMonitorByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch site monitor";
      })

      .addCase(updateSiteMonitorThunk.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateSiteMonitorThunk.fulfilled, (state) => {
        state.updateLoading = false;
        state.success = true;
      })
      .addCase(updateSiteMonitorThunk.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload || "Failed to update site monitor";
      })

      .addCase(changeSiteMonitorPasswordThunk.pending, (state) => {
        state.passwordLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(changeSiteMonitorPasswordThunk.fulfilled, (state) => {
        state.passwordLoading = false;
        state.success = true;
      })
      .addCase(changeSiteMonitorPasswordThunk.rejected, (state, action) => {
        state.passwordLoading = false;
        state.error = action.payload || "Failed to change password";
      })

      .addCase(deleteSiteMonitorThunk.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteSiteMonitorThunk.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.success = true;
        state.monitors = state.monitors.filter(
          (monitor) => monitor.id !== action.payload
        );
      })
      .addCase(deleteSiteMonitorThunk.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload || "Failed to delete site monitor";
      });
  },
});

export const {
  resetSiteMonitorState,
  clearSelectedMonitor,
} = siteMonitorSlice.actions;

export default siteMonitorSlice.reducer;