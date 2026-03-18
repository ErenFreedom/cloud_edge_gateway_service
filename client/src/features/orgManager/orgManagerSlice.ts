import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrgSiteManager,
  assignSitesToManager,
  removeSitesFromManager,
  fetchManagersAndSites,
  fetchManagerScope,
  verifyManagerOtp
} from "../../services/orgManager.service";

/* -------- STATE -------- */

interface OrgManagerState {
  loading: boolean;
  success: boolean;
  error: string | null;

  managers: any[];
  sites: any[];
  currentScope: any[];
  
}

const initialState: OrgManagerState = {
  loading: false,
  success: false,
  error: null,

  managers: [],
  sites: [],
  currentScope: []
  
};

/* -------- THUNKS -------- */

// CREATE
export const createOrgManagerThunk = createAsyncThunk(
  "orgManager/create",
  async (data: any, thunkAPI) => {
    try {
      return await createOrgSiteManager(data);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Create failed"
      );
    }
  }
);

//VERIFY OTP
export const verifyManagerOtpThunk = createAsyncThunk(
  "orgManager/verifyOtp",
  async (data: { managerId: string; otp: string }, thunkAPI) => {
    try {
      return await verifyManagerOtp(data);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

// ASSIGN
export const assignSitesThunk = createAsyncThunk(
  "orgManager/assign",
  async (data: any, thunkAPI) => {
    try {
      return await assignSitesToManager(data);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Assign failed"
      );
    }
  }
);

// REMOVE
export const removeSitesThunk = createAsyncThunk(
  "orgManager/remove",
  async (data: any, thunkAPI) => {
    try {
      return await removeSitesFromManager(data);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Remove failed"
      );
    }
  }
);

/* INIT DATA */
export const fetchInitDataThunk = createAsyncThunk(
  "orgManager/initData",
  async (_, thunkAPI) => {
    try {
      return await fetchManagersAndSites();
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Fetch failed"
      );
    }
  }
);

/* FETCH SCOPE */
export const fetchScopeThunk = createAsyncThunk(
  "orgManager/scope",
  async (managerId: string, thunkAPI) => {
    try {
      return await fetchManagerScope(managerId);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Scope fetch failed"
      );
    }
  }
);

/* -------- SLICE -------- */

const orgManagerSlice = createSlice({
  name: "orgManager",
  initialState,
  reducers: {
    resetOrgManagerState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {

    builder

      /* CREATE */
      .addCase(createOrgManagerThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOrgManagerThunk.fulfilled, (state) => {
        state.loading = false;
        //  DO NOT set success here
      })
      .addCase(createOrgManagerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* VERIFY OTP */
      .addCase(verifyManagerOtpThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyManagerOtpThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;   // ✅ success ONLY after OTP
      })
      .addCase(verifyManagerOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* ASSIGN */
      .addCase(assignSitesThunk.fulfilled, (state) => {
        state.success = true;
      })

      /* REMOVE */
      .addCase(removeSitesThunk.fulfilled, (state) => {
        state.success = true;
      })

      /* INIT DATA */
      .addCase(fetchInitDataThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInitDataThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.managers = action.payload.managers;
        state.sites = action.payload.sites;
      })
      .addCase(fetchInitDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* FETCH SCOPE */
      .addCase(fetchScopeThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchScopeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentScope = action.payload;
      })
      .addCase(fetchScopeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

  }
});

export const { resetOrgManagerState } = orgManagerSlice.actions;
export default orgManagerSlice.reducer;