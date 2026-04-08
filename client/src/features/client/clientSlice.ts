import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  generateClientToken,
  fetchTimeSeries,
  fetchSensors,
  fetchConfig,
  saveConfig
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
  config: any;
}

const initialState: ClientState = {
  loading: false,
  error: null,
  success: false,

  token: localStorage.getItem("client_token"),

  sensors: [],
  selectedSensors: [],

  timeSeriesData: null,
  config: null
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
      interval:
      | "10m"
      | "1h"
      | "1d"
      | "1w"
      | "1M"
      | "3M"
      | "6M"
      | "1Y";
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


/* ============================= */
/* FETCH CONFIG */
/* ============================= */

export const fetchConfigThunk = createAsyncThunk(
  "client/fetchConfig",
  async (site_id: string, thunkAPI) => {
    try {
      const res = await fetchConfig(site_id);
      return res;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Fetch config failed"
      );
    }
  }
);


/* ============================= */
/* SAVE CONFIG */
/* ============================= */

export const saveConfigThunk = createAsyncThunk(
  "client/saveConfig",
  async (payload: any, thunkAPI) => {
    try {
      const res = await saveConfig(payload);
      return res;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Save config failed"
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
    },
    setSelectedSensors: (state, action) => {
      state.selectedSensors = action.payload;
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
      /* FETCH CONFIG */
      /* ============================= */

      .addCase(fetchConfigThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchConfigThunk.fulfilled, (state, action) => {
        state.loading = false;

        state.config = action.payload.config;

        // 🔥 preload selected sensors
        if (action.payload.config?.sensor_ids) {
          state.selectedSensors = action.payload.config.sensor_ids;
        }
      })

      .addCase(fetchConfigThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      /* ============================= */
      /* SAVE CONFIG */
      /* ============================= */

      .addCase(saveConfigThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(saveConfigThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.config = action.payload.config;
      })

      .addCase(saveConfigThunk.rejected, (state, action) => {
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
      })


  }
});

/* -------- EXPORTS -------- */

export const {
  resetClientState,
  clearClientToken,
  toggleSensor,
  clearSelectedSensors,
  setSelectedSensors
} = clientSlice.actions;

export default clientSlice.reducer;