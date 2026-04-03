import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  generateClientToken,
  fetchTimeSeries
} from "../../services/client.service";

/* -------- STATE -------- */

interface ClientState {
  loading: boolean;
  error: string | null;
  success: boolean;

  token: string | null;

  timeSeriesData: any;
}

const initialState: ClientState = {
  loading: false,
  error: null,
  success: false,

  //  Load token from localStorage (persist after refresh)
  token: localStorage.getItem("client_token"),

  timeSeriesData: null
};

/* -------- THUNKS -------- */

//  GENERATE TOKEN
export const generateTokenThunk = createAsyncThunk(
  "client/generateToken",
  async (site_id: string, thunkAPI) => {
    try {
      const res = await generateClientToken({ site_id });
      return res;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Token generation failed"
      );
    }
  }
);

//  FETCH TIMESERIES
export const fetchTimeSeriesThunk = createAsyncThunk(
  "client/fetchTimeSeries",
  async (
    {
      token,
      payload
    }: {
      token: string;
      payload: any;
    },
    thunkAPI
  ) => {
    try {
      const res = await fetchTimeSeries(token, payload);
      return res;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Fetch failed"
      );
    }
  }
);

/* -------- SLICE -------- */

const clientSlice = createSlice({
  name: "client",
  initialState,
  reducers: {
    resetClientState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },

    //  OPTIONAL: Clear token manually
    clearClientToken: (state) => {
      state.token = null;
      localStorage.removeItem("client_token");
    }
  },
  extraReducers: (builder) => {

    builder

      /* ============================= */
      /* GENERATE TOKEN */
      /* ============================= */

      .addCase(generateTokenThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(generateTokenThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.token = action.payload.token;

        //  Persist token
        localStorage.setItem("client_token", action.payload.token);
      })

      .addCase(generateTokenThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      /* ============================= */
      /* FETCH TIMESERIES */
      /* ============================= */

      .addCase(fetchTimeSeriesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;

        //  Clear previous data (important UX)
        state.timeSeriesData = null;
      })

      .addCase(fetchTimeSeriesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.timeSeriesData = action.payload;
      })

      .addCase(fetchTimeSeriesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

  }
});

/* -------- EXPORTS -------- */

export const {
  resetClientState,
  clearClientToken
} = clientSlice.actions;

export default clientSlice.reducer;