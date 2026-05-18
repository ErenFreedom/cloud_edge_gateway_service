import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  fetchComplianceReportTypes,
  createComplianceReportType,
  saveMultiComplianceConfig,
  fetchComplianceConfigByReportType,
  fetchComplianceConfigForSite,
  fetchComplianceCategoryExport,
  fetchComplianceMonthlyReport,
} from "../../services/compliance.service";


import type {
  ComplianceReportType,
  MultiComplianceConfigPayload,
  CreateComplianceReportTypePayload,
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

  config: any;
  exportData: any;

  token: string | null;
}

const initialState: ComplianceState = {
  loading: false,
  error: null,
  success: false,

  reportTypes: [],

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

export const createComplianceReportTypeThunk = createAsyncThunk(
  "compliance/createReportType",
  async (payload: CreateComplianceReportTypePayload, thunkAPI) => {
    try {
      return await createComplianceReportType(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to create compliance report type"
      );
    }
  }
);

export const saveMultiComplianceConfigThunk = createAsyncThunk(
  "compliance/saveMultiConfig",
  async (payload: MultiComplianceConfigPayload, thunkAPI) => {
    try {
      return await saveMultiComplianceConfig(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to save compliance config"
      );
    }
  }
);


export const fetchComplianceConfigForSiteThunk = createAsyncThunk(
  "compliance/fetchConfigForSite",
  async (siteId: string, thunkAPI) => {
    try {
      return await fetchComplianceConfigForSite(siteId);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch site compliance config"
      );
    }
  }
);


export const fetchComplianceConfigByReportTypeThunk = createAsyncThunk(
  "compliance/fetchConfigByReportType",
  async (
    payload: {
      site_id: string;
      report_type: string;
    },
    thunkAPI
  ) => {
    try {
      return await fetchComplianceConfigByReportType(
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

export const fetchComplianceCategoryExportThunk = createAsyncThunk(
  "compliance/fetchCategoryExport",
  async (payload: ComplianceExportParams, thunkAPI) => {
    try {
      return await fetchComplianceCategoryExport(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Compliance category export failed"
      );
    }
  }
);

export const fetchComplianceMonthlyReportThunk = createAsyncThunk(
  "compliance/fetchMonthlyReport",
  async (
    payload: {
      token: string;
      reportType: string;
      month: number;
      year: number;
    },
    thunkAPI
  ) => {
    try {
      return await fetchComplianceMonthlyReport(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Compliance monthly report failed"
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

    clearComplianceSuccess: (state) => {
      state.success = false;
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

      /* CREATE REPORT TYPE */
      .addCase(createComplianceReportTypeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createComplianceReportTypeThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createComplianceReportTypeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* SAVE MULTI CONFIG */
      .addCase(saveMultiComplianceConfigThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveMultiComplianceConfigThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(saveMultiComplianceConfigThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* FETCH CONFIG BY REPORT TYPE */
      .addCase(fetchComplianceConfigByReportTypeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceConfigByReportTypeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchComplianceConfigByReportTypeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* CATEGORY EXPORT */
      .addCase(fetchComplianceCategoryExportThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.exportData = null;
      })
      .addCase(fetchComplianceCategoryExportThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.exportData = action.payload;
      })
      .addCase(fetchComplianceCategoryExportThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* FETCH SITE CONFIG */
      .addCase(fetchComplianceConfigForSiteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceConfigForSiteThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchComplianceConfigForSiteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* MONTHLY REPORT */
      .addCase(fetchComplianceMonthlyReportThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.exportData = null;
      })
      .addCase(fetchComplianceMonthlyReportThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.exportData = action.payload;
      })
      .addCase(fetchComplianceMonthlyReportThunk.rejected, (state, action) => {
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
  clearComplianceSuccess,
  setComplianceToken,
  clearComplianceExportData,
} = complianceSlice.actions;

export default complianceSlice.reducer;