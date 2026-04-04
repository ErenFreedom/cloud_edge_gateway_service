import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  generateClientToken,
  fetchTimeSeries,
  fetchSensors,
  
} from "../../services/client.service";


/* -------- STATE -------- */

interface ClientState {
  loading: boolean;
  error: string | null;
  success: boolean;

  token: string | null;

  sensors: any[];
  selectedSensors: string[];

  timeSeriesData: any;
}

const initialState: ClientState = {
  loading: false,
  error: null,
  success: false,

  token: localStorage.getItem("client_token"),

  sensors: [],
  selectedSensors: [],

  timeSeriesData: null
};


/* -------- THUNKS -------- */

//  GENERATE TOKEN
export const generateTokenThunk = createAsyncThunk(
  "client/generateToken",
  async (
    payload: {
      site_id: string;
      sensor_ids: string[];
      from: string;
      to: string;
      interval: "10m" | "1h" | "1d" | "1M";
    },
    thunkAPI
  ) => {
    try {
      const res = await generateClientToken(payload);
      return res;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Token generation failed"
      );
    }
  }
);


export const fetchSensorsThunk = createAsyncThunk(
  "client/fetchSensors",
  async (site_id: string, thunkAPI) => {
    try {
      const res = await fetchSensors(site_id);
      return res;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Fetch sensors failed"
      );
    }
  }
);

//  FETCH TIMESERIES
export const fetchTimeSeriesThunk = createAsyncThunk(
  "client/fetchTimeSeries",
  async (token: string, thunkAPI) => {
    try {
      const res = await fetchTimeSeries(token);
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

    clearClientToken: (state) => {
      state.token = null;
      localStorage.removeItem("client_token");
    },


    toggleSensor: (state, action) => {
      const id = action.payload;

      if (state.selectedSensors.includes(id)) {
        state.selectedSensors = state.selectedSensors.filter(s => s !== id);
      } else {
        state.selectedSensors.push(id);
      }
    },


    clearSelectedSensors: (state) => {
      state.selectedSensors = [];
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
      })

      .addCase(fetchSensorsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchSensorsThunk.fulfilled, (state, action) => {
        state.loading = false;

        state.sensors = action.payload.sensors || [];
      })

      .addCase(fetchSensorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

  }
});

/* -------- EXPORTS -------- */

export const {
  resetClientState,
  clearClientToken,
  toggleSensor,
  clearSelectedSensors
} = clientSlice.actions;

export default clientSlice.reducer;