import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  fetchComplianceReportTypes,
  fetchComplianceSensors,
  fetchComplianceConfig,
  saveComplianceConfig,
  fetchComplianceSensorExport,
  fetchComplianceTypeExport,
} from "../../services/compliance.service";

import type {
  ComplianceReportType,
  ComplianceSensor,
  ComplianceConfigPayload,
  ComplianceExportParams,
} from "../../services/compliance.service";

/* ========================= */
/* STATE */
/* ========================= */

interface ComplianceState {
  loading: boolean;
  error: string | null;
  success: boolean;

  reportTypes: ComplianceReportType[];
  selectedReportType: string | null;

  sensors: ComplianceSensor[];
  selectedSensors: string[];

  config: any;
  exportData: any;

  token: string | null;
}

const initialState: ComplianceState = {
  loading: false,
  error: null,
  success: false,

  reportTypes: [],
  selectedReportType: null,

  sensors: [],
  selectedSensors: [],

  config: null,
  exportData: null,

  token: localStorage.getItem("client_token"),
};

/* ========================= */
/* THUNKS */
/* ========================= */

export const fetchComplianceReportTypesThunk = createAsyncThunk(
  "compliance/fetchReportTypes",
  async (_, thunkAPI) => {
    try {
      return await fetchComplianceReportTypes();
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch compliance report types"
      );
    }
  }
);

export const fetchComplianceSensorsThunk = createAsyncThunk(
  "compliance/fetchSensors",
  async (
    payload: {
      site_id: string;
      report_type: string;
    },
    thunkAPI
  ) => {
    try {
      return await fetchComplianceSensors(
        payload.site_id,
        payload.report_type
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch compliance sensors"
      );
    }
  }
);

export const fetchComplianceConfigThunk = createAsyncThunk(
  "compliance/fetchConfig",
  async (
    payload: {
      site_id: string;
      report_type: string;
    },
    thunkAPI
  ) => {
    try {
      return await fetchComplianceConfig(
        payload.site_id,
        payload.report_type
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch compliance config"
      );
    }
  }
);

export const saveComplianceConfigThunk = createAsyncThunk(
  "compliance/saveConfig",
  async (payload: ComplianceConfigPayload, thunkAPI) => {
    try {
      return await saveComplianceConfig(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to save compliance config"
      );
    }
  }
);

export const fetchComplianceSensorExportThunk = createAsyncThunk(
  "compliance/fetchSensorExport",
  async (payload: ComplianceExportParams, thunkAPI) => {
    try {
      return await fetchComplianceSensorExport(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Compliance sensor export failed"
      );
    }
  }
);

export const fetchComplianceTypeExportThunk = createAsyncThunk(
  "compliance/fetchTypeExport",
  async (payload: ComplianceExportParams, thunkAPI) => {
    try {
      return await fetchComplianceTypeExport(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Compliance type export failed"
      );
    }
  }
);

/* ========================= */
/* SLICE */
/* ========================= */

const complianceSlice = createSlice({
  name: "compliance",
  initialState,
  reducers: {
    resetComplianceState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },

    clearComplianceError: (state) => {
      state.error = null;
    },

    setSelectedReportType: (state, action) => {
      state.selectedReportType = action.payload;
      state.sensors = [];
      state.config = null;
      state.exportData = null;
      state.selectedSensors = [];
    },

    toggleComplianceSensor: (state, action) => {
      const sensorId = action.payload;

      if (state.selectedSensors.includes(sensorId)) {
        state.selectedSensors = state.selectedSensors.filter(
          (id) => id !== sensorId
        );
      } else {
        state.selectedSensors.push(sensorId);
      }
    },

    setSelectedComplianceSensors: (state, action) => {
      state.selectedSensors = action.payload;
    },

    clearSelectedComplianceSensors: (state) => {
      state.selectedSensors = [];
    },

    setComplianceToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem("client_token", action.payload);
    },

    clearComplianceExportData: (state) => {
      state.exportData = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* REPORT TYPES */
      .addCase(fetchComplianceReportTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceReportTypesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.reportTypes = action.payload;
      })
      .addCase(fetchComplianceReportTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* SENSORS */
      .addCase(fetchComplianceSensorsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceSensorsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.sensors = action.payload;
      })
      .addCase(fetchComplianceSensorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* CONFIG */
      .addCase(fetchComplianceConfigThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceConfigThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchComplianceConfigThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* SAVE CONFIG */
      .addCase(saveComplianceConfigThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveComplianceConfigThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(saveComplianceConfigThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* SENSOR EXPORT */
      .addCase(fetchComplianceSensorExportThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.exportData = null;
      })
      .addCase(fetchComplianceSensorExportThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.exportData = action.payload;
      })
      .addCase(fetchComplianceSensorExportThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* TYPE EXPORT */
      .addCase(fetchComplianceTypeExportThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.exportData = null;
      })
      .addCase(fetchComplianceTypeExportThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.exportData = action.payload;
      })
      .addCase(fetchComplianceTypeExportThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

/* ========================= */
/* EXPORTS */
/* ========================= */

export const {
  resetComplianceState,
  clearComplianceError,
  setSelectedReportType,
  toggleComplianceSensor,
  setSelectedComplianceSensors,
  clearSelectedComplianceSensors,
  setComplianceToken,
  clearComplianceExportData,
} = complianceSlice.actions;

export default complianceSlice.reducer;