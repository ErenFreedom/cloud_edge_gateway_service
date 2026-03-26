import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchActivationRequests,
  approveActivation,
  rejectActivation
} from "../../services/activation.service";

/* -------- STATE -------- */

interface ActivationState {
  loading: boolean;
  error: string | null;
  success: boolean;

  requests: any[];
}

const initialState: ActivationState = {
  loading: false,
  error: null,
  success: false,
  requests: []
};

/* -------- THUNKS -------- */

// FETCH
export const fetchActivationRequestsThunk = createAsyncThunk(
  "activation/fetchRequests",
  async (_, thunkAPI) => {
    try {
      return await fetchActivationRequests();
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Fetch failed"
      );
    }
  }
);

// APPROVE
export const approveActivationThunk = createAsyncThunk(
  "activation/approve",
  async (request_id: string, thunkAPI) => {
    try {
      return await approveActivation(request_id);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Approve failed"
      );
    }
  }
);

// REJECT
export const rejectActivationThunk = createAsyncThunk(
  "activation/reject",
  async (request_id: string, thunkAPI) => {
    try {
      return await rejectActivation(request_id);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Reject failed"
      );
    }
  }
);

/* -------- SLICE -------- */

const activationSlice = createSlice({
  name: "activation",
  initialState,
  reducers: {
    resetActivationState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {

    builder

      /* FETCH */
      .addCase(fetchActivationRequestsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivationRequestsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchActivationRequestsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* APPROVE */
      .addCase(approveActivationThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveActivationThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(approveActivationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* REJECT */
      .addCase(rejectActivationThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectActivationThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(rejectActivationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetActivationState } = activationSlice.actions;
export default activationSlice.reducer;