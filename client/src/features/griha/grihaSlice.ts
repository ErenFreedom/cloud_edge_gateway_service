import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchGrihaSensors,
  fetchGrihaConfig,
  saveGrihaConfig,
  fetchGrihaExport,
  fetchGrihaTypes
} from "../../services/griha.service";

import type { GrihaTypeOption } from "../../services/griha.service";

/* ========================= */
/* STATE */
/* ========================= */

interface GrihaState {
  loading: boolean;
  error: string | null;
  success: boolean;

  sensors: any[];
  selectedSensors: string[];

  config: any;

  exportData: any;

  types: GrihaTypeOption[];

  token: string | null;
}

const initialState: GrihaState = {
  loading: false,
  error: null,
  success: false,

  sensors: [],
  selectedSensors: [],

  config: null,
  exportData: null,
  types: [],

  token: localStorage.getItem("client_token")
};

/* ========================= */
/* THUNKS */
/* ========================= */

export const fetchGrihaSensorsThunk = createAsyncThunk(
  "griha/fetchSensors",
  async (site_id: string, thunkAPI) => {
    try {
      return await fetchGrihaSensors(site_id);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch sensors"
      );
    }
  }
);

export const fetchGrihaConfigThunk = createAsyncThunk(
  "griha/fetchConfig",
  async (site_id: string, thunkAPI) => {
    try {
      return await fetchGrihaConfig(site_id);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch config"
      );
    }
  }
);


export const fetchGrihaTypesThunk = createAsyncThunk(
  "griha/fetchTypes",
  async (_, thunkAPI) => {
    try {
      return await fetchGrihaTypes();
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch types"
      );
    }
  }
);

export const saveGrihaConfigThunk = createAsyncThunk(
  "griha/saveConfig",
  async (payload: any, thunkAPI) => {
    try {
      return await saveGrihaConfig(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to save config"
      );
    }
  }
);

export const fetchGrihaExportThunk = createAsyncThunk(
  "griha/fetchExport",
  async (
    payload: {
      token: string;
      sensorId: string;
      month: number;
      year: number;
    },
    thunkAPI
  ) => {
    try {
      return await fetchGrihaExport(
        payload.token,
        payload.sensorId,
        payload.month,
        payload.year
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Export failed"
      );
    }
  }
);

/* ========================= */
/* SLICE */
/* ========================= */

const grihaSlice = createSlice({
  name: "griha",
  initialState,
  reducers: {

    resetGrihaState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },

    toggleSensor: (state, action) => {
      const id = action.payload;

      if (state.selectedSensors.includes(id)) {
        state.selectedSensors = state.selectedSensors.filter(
          (s) => s !== id
        );
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

      /* FETCH SENSORS */
      .addCase(fetchGrihaSensorsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGrihaSensorsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.sensors = action.payload;
      })
      .addCase(fetchGrihaSensorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* FETCH CONFIG */
      .addCase(fetchGrihaConfigThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGrihaConfigThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;

        // preload sensors
        if (action.payload) {
          state.selectedSensors = Object.values(action.payload);
        }
      })
      .addCase(fetchGrihaConfigThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* FETCH TYPES */
      .addCase(fetchGrihaTypesThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGrihaTypesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.types = action.payload;
      })
      .addCase(fetchGrihaTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* SAVE CONFIG */
      .addCase(saveGrihaConfigThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveGrihaConfigThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(saveGrihaConfigThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* EXPORT */
      .addCase(fetchGrihaExportThunk.pending, (state) => {
        state.loading = true;
        state.exportData = null;
      })
      .addCase(fetchGrihaExportThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.exportData = action.payload;
      })
      .addCase(fetchGrihaExportThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

  }
});

/* ========================= */
/* EXPORTS */
/* ========================= */

export const {
  resetGrihaState,
  toggleSensor,
  clearSelectedSensors,
  setSelectedSensors
} = grihaSlice.actions;

export default grihaSlice.reducer;