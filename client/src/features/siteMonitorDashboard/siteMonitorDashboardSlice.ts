import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";


import {
  addDashboardSensor,
  downloadDashboardExportCsv,
  fetchAvailableDashboardSensors,
  fetchDashboardCurrentLoad,
  fetchDashboardExport,
  fetchDashboardLiveLoad,
  fetchSelectedDashboardSensors,
  fetchSiteMonitorDashboardSiteDetails,
  fetchSiteMonitorDashboardSites,
  removeDashboardSensor,
} from "../../services/siteMonitorDashboard.service";

import type {
  AddDashboardSensorPayload,
  CurrentLoadAnalyticsResponse,
  DashboardSensorsResponse,
  DashboardSitesResponse,
  DownloadExportCsvParams,
  ExportAnalyticsResponse,
  FetchAvailableSensorsParams,
  FetchCurrentLoadParams,
  FetchExportParams,
  LiveLoadAnalyticsResponse,
  RemoveDashboardSensorPayload,
  SelectedDashboardSensorsResponse,
  SiteMonitorDashboardSite,
} from "../../services/siteMonitorDashboard.service";

/* ========================= */
/* STATE */
/* ========================= */

interface SiteMonitorDashboardState {
  loading: boolean;
  sitesLoading: boolean;
  siteDetailsLoading: boolean;
  availableSensorsLoading: boolean;
  selectedSensorsLoading: boolean;
  addSensorLoading: boolean;
  removeSensorLoading: boolean;
  currentLoadLoading: boolean;
  liveLoadLoading: boolean;
  exportLoading: boolean;
  csvDownloading: boolean;

  error: string | null;
  success: boolean;
  csvDownloadSuccess: boolean;

  sites: SiteMonitorDashboardSite[];
  selectedSite: SiteMonitorDashboardSite | null;
  selectedSiteId: string | null;

  availableSensors: DashboardSensorsResponse | null;
  selectedSensors: SelectedDashboardSensorsResponse | null;

  currentLoad: CurrentLoadAnalyticsResponse | null;
  liveLoad: LiveLoadAnalyticsResponse | null;
  exportData: ExportAnalyticsResponse | null;
}

const initialState: SiteMonitorDashboardState = {
  loading: false,
  sitesLoading: false,
  siteDetailsLoading: false,
  availableSensorsLoading: false,
  selectedSensorsLoading: false,
  addSensorLoading: false,
  removeSensorLoading: false,
  currentLoadLoading: false,
  liveLoadLoading: false,
  exportLoading: false,
  csvDownloading: false,

  error: null,
  success: false,
  csvDownloadSuccess: false,

  sites: [],
  selectedSite: null,
  selectedSiteId: localStorage.getItem("site_monitor_dashboard_site_id"),

  availableSensors: null,
  selectedSensors: null,

  currentLoad: null,
  liveLoad: null,
  exportData: null,
};

const getErrorMessage = (
  err: any,
  fallback = "Something went wrong"
): string => {
  return err.response?.data?.message || err.message || fallback;
};

/* ========================= */
/* THUNKS */
/* ========================= */

export const fetchSiteMonitorDashboardSitesThunk = createAsyncThunk(
  "siteMonitorDashboard/fetchSites",
  async (_, thunkAPI) => {
    try {
      return await fetchSiteMonitorDashboardSites();
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch dashboard sites")
      );
    }
  }
);

export const fetchSiteMonitorDashboardSiteDetailsThunk = createAsyncThunk(
  "siteMonitorDashboard/fetchSiteDetails",
  async (siteId: string, thunkAPI) => {
    try {
      return await fetchSiteMonitorDashboardSiteDetails(siteId);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch dashboard site details")
      );
    }
  }
);

export const fetchAvailableDashboardSensorsThunk = createAsyncThunk(
  "siteMonitorDashboard/fetchAvailableSensors",
  async (payload: FetchAvailableSensorsParams, thunkAPI) => {
    try {
      return await fetchAvailableDashboardSensors(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch available sensors")
      );
    }
  }
);

export const fetchSelectedDashboardSensorsThunk = createAsyncThunk(
  "siteMonitorDashboard/fetchSelectedSensors",
  async (siteId: string, thunkAPI) => {
    try {
      return await fetchSelectedDashboardSensors(siteId);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch selected sensors")
      );
    }
  }
);

export const addDashboardSensorThunk = createAsyncThunk(
  "siteMonitorDashboard/addSensor",
  async (payload: AddDashboardSensorPayload, thunkAPI) => {
    try {
      return await addDashboardSensor(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to add sensor to dashboard")
      );
    }
  }
);

export const removeDashboardSensorThunk = createAsyncThunk(
  "siteMonitorDashboard/removeSensor",
  async (payload: RemoveDashboardSensorPayload, thunkAPI) => {
    try {
      const result = await removeDashboardSensor(payload);

      return {
        ...result,
        sensorId: payload.sensorId,
        siteId: payload.siteId,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to remove sensor from dashboard")
      );
    }
  }
);

export const fetchDashboardCurrentLoadThunk = createAsyncThunk(
  "siteMonitorDashboard/fetchCurrentLoad",
  async (payload: FetchCurrentLoadParams, thunkAPI) => {
    try {
      return await fetchDashboardCurrentLoad(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch current load")
      );
    }
  }
);

export const fetchDashboardLiveLoadThunk = createAsyncThunk(
  "siteMonitorDashboard/fetchLiveLoad",
  async (siteId: string, thunkAPI) => {
    try {
      return await fetchDashboardLiveLoad(siteId);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch live load")
      );
    }
  }
);

export const fetchDashboardExportThunk = createAsyncThunk(
  "siteMonitorDashboard/fetchExport",
  async (payload: FetchExportParams, thunkAPI) => {
    try {
      return await fetchDashboardExport(payload);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch export data")
      );
    }
  }
);

export const downloadDashboardExportCsvThunk = createAsyncThunk(
  "siteMonitorDashboard/downloadExportCsv",
  async (payload: DownloadExportCsvParams, thunkAPI) => {
    try {
      await downloadDashboardExportCsv(payload);

      return {
        siteId: payload.siteId,
        from: payload.from,
        to: payload.to,
        interval: payload.interval,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to download CSV")
      );
    }
  }
);

/* ========================= */
/* SLICE */
/* ========================= */

const siteMonitorDashboardSlice = createSlice({
  name: "siteMonitorDashboard",
  initialState,
  reducers: {
    resetSiteMonitorDashboardState: (state) => {
      state.loading = false;
      state.sitesLoading = false;
      state.siteDetailsLoading = false;
      state.availableSensorsLoading = false;
      state.selectedSensorsLoading = false;
      state.addSensorLoading = false;
      state.removeSensorLoading = false;
      state.currentLoadLoading = false;
      state.liveLoadLoading = false;
      state.exportLoading = false;
      state.csvDownloading = false;

      state.error = null;
      state.success = false;
      state.csvDownloadSuccess = false;
    },

    clearSiteMonitorDashboardError: (state) => {
      state.error = null;
    },

    clearSiteMonitorDashboardSuccess: (state) => {
      state.success = false;
      state.csvDownloadSuccess = false;
    },

    setSelectedDashboardSiteId: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.selectedSiteId = action.payload;

      if (action.payload) {
        localStorage.setItem("site_monitor_dashboard_site_id", action.payload);
      } else {
        localStorage.removeItem("site_monitor_dashboard_site_id");
      }
    },

    clearSelectedDashboardSite: (state) => {
      state.selectedSite = null;
      state.selectedSiteId = null;
      localStorage.removeItem("site_monitor_dashboard_site_id");
    },

    clearDashboardAnalyticsData: (state) => {
      state.currentLoad = null;
      state.liveLoad = null;
      state.exportData = null;
    },

    clearDashboardSensorsData: (state) => {
      state.availableSensors = null;
      state.selectedSensors = null;
    },

    clearDashboardExportData: (state) => {
      state.exportData = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* FETCH SITES */
      .addCase(fetchSiteMonitorDashboardSitesThunk.pending, (state) => {
        state.loading = true;
        state.sitesLoading = true;
        state.error = null;
      })
      .addCase(
        fetchSiteMonitorDashboardSitesThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.sitesLoading = false;

          const payload = action.payload as DashboardSitesResponse;
          state.sites = payload.sites || [];

          if (!state.selectedSiteId && state.sites.length > 0) {
            state.selectedSiteId = state.sites[0].id;
            localStorage.setItem(
              "site_monitor_dashboard_site_id",
              state.sites[0].id
            );
          }

          if (state.selectedSiteId) {
            state.selectedSite =
              state.sites.find((site) => site.id === state.selectedSiteId) ||
              state.selectedSite ||
              null;
          }
        }
      )
      .addCase(fetchSiteMonitorDashboardSitesThunk.rejected, (state, action) => {
        state.loading = false;
        state.sitesLoading = false;
        state.error = action.payload as string;
      })

      /* FETCH SITE DETAILS */
      .addCase(fetchSiteMonitorDashboardSiteDetailsThunk.pending, (state) => {
        state.loading = true;
        state.siteDetailsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchSiteMonitorDashboardSiteDetailsThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.siteDetailsLoading = false;
          state.selectedSite = action.payload.site;
          state.selectedSiteId = action.payload.site.id;

          localStorage.setItem(
            "site_monitor_dashboard_site_id",
            action.payload.site.id
          );
        }
      )
      .addCase(
        fetchSiteMonitorDashboardSiteDetailsThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.siteDetailsLoading = false;
          state.error = action.payload as string;
        }
      )

      /* FETCH AVAILABLE SENSORS */
      .addCase(fetchAvailableDashboardSensorsThunk.pending, (state) => {
        state.availableSensorsLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableDashboardSensorsThunk.fulfilled, (state, action) => {
        state.availableSensorsLoading = false;
        state.availableSensors = action.payload;
      })
      .addCase(fetchAvailableDashboardSensorsThunk.rejected, (state, action) => {
        state.availableSensorsLoading = false;
        state.error = action.payload as string;
      })

      /* FETCH SELECTED SENSORS */
      .addCase(fetchSelectedDashboardSensorsThunk.pending, (state) => {
        state.selectedSensorsLoading = true;
        state.error = null;
      })
      .addCase(fetchSelectedDashboardSensorsThunk.fulfilled, (state, action) => {
        state.selectedSensorsLoading = false;
        state.selectedSensors = action.payload;
      })
      .addCase(fetchSelectedDashboardSensorsThunk.rejected, (state, action) => {
        state.selectedSensorsLoading = false;
        state.error = action.payload as string;
      })

      /* ADD SENSOR */
      .addCase(addDashboardSensorThunk.pending, (state) => {
        state.addSensorLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addDashboardSensorThunk.fulfilled, (state, action) => {
        state.addSensorLoading = false;
        state.success = true;

        const addedSensor = action.payload.sensor;

        if (state.selectedSensors) {
          const alreadyExists = state.selectedSensors.sensors.some(
            (sensor) => sensor.sensor_id === addedSensor.sensor_id
          );

          if (!alreadyExists) {
            state.selectedSensors.sensors.push(addedSensor);
            state.selectedSensors.total_sensors += 1;
          }
        }

        if (state.availableSensors) {
          state.availableSensors.sensors = state.availableSensors.sensors.map(
            (sensor) =>
              sensor.id === addedSensor.sensor_id
                ? {
                    ...sensor,
                    added_to_dashboard: true,
                    dashboard_sensor_id: addedSensor.id,
                    added_at: addedSensor.created_at,
                    added_by: addedSensor.added_by,
                  }
                : sensor
          );
        }
      })
      .addCase(addDashboardSensorThunk.rejected, (state, action) => {
        state.addSensorLoading = false;
        state.error = action.payload as string;
      })

      /* REMOVE SENSOR */
      .addCase(removeDashboardSensorThunk.pending, (state) => {
        state.removeSensorLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(removeDashboardSensorThunk.fulfilled, (state, action) => {
        state.removeSensorLoading = false;
        state.success = true;

        const removedSensorId = action.payload.sensorId;

        if (state.selectedSensors) {
          state.selectedSensors.sensors = state.selectedSensors.sensors.filter(
            (sensor) => sensor.sensor_id !== removedSensorId
          );

          state.selectedSensors.total_sensors =
            state.selectedSensors.sensors.length;
        }

        if (state.availableSensors) {
          state.availableSensors.sensors = state.availableSensors.sensors.map(
            (sensor) =>
              sensor.id === removedSensorId
                ? {
                    ...sensor,
                    added_to_dashboard: false,
                    dashboard_sensor_id: null,
                    added_at: null,
                    added_by: null,
                  }
                : sensor
          );
        }
      })
      .addCase(removeDashboardSensorThunk.rejected, (state, action) => {
        state.removeSensorLoading = false;
        state.error = action.payload as string;
      })

      /* CURRENT LOAD */
      .addCase(fetchDashboardCurrentLoadThunk.pending, (state) => {
        state.currentLoadLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardCurrentLoadThunk.fulfilled, (state, action) => {
        state.currentLoadLoading = false;
        state.currentLoad = action.payload;
      })
      .addCase(fetchDashboardCurrentLoadThunk.rejected, (state, action) => {
        state.currentLoadLoading = false;
        state.error = action.payload as string;
      })

      /* LIVE LOAD */
      .addCase(fetchDashboardLiveLoadThunk.pending, (state) => {
        state.liveLoadLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardLiveLoadThunk.fulfilled, (state, action) => {
        state.liveLoadLoading = false;
        state.liveLoad = action.payload;
      })
      .addCase(fetchDashboardLiveLoadThunk.rejected, (state, action) => {
        state.liveLoadLoading = false;
        state.error = action.payload as string;
      })

      /* EXPORT JSON */
      .addCase(fetchDashboardExportThunk.pending, (state) => {
        state.exportLoading = true;
        state.error = null;
        state.exportData = null;
      })
      .addCase(fetchDashboardExportThunk.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.exportData = action.payload;
      })
      .addCase(fetchDashboardExportThunk.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload as string;
      })

      /* EXPORT CSV */
      .addCase(downloadDashboardExportCsvThunk.pending, (state) => {
        state.csvDownloading = true;
        state.csvDownloadSuccess = false;
        state.error = null;
      })
      .addCase(downloadDashboardExportCsvThunk.fulfilled, (state) => {
        state.csvDownloading = false;
        state.csvDownloadSuccess = true;
      })
      .addCase(downloadDashboardExportCsvThunk.rejected, (state, action) => {
        state.csvDownloading = false;
        state.error = action.payload as string;
      });
  },
});

/* ========================= */
/* EXPORTS */
/* ========================= */

export const {
  resetSiteMonitorDashboardState,
  clearSiteMonitorDashboardError,
  clearSiteMonitorDashboardSuccess,
  setSelectedDashboardSiteId,
  clearSelectedDashboardSite,
  clearDashboardAnalyticsData,
  clearDashboardSensorsData,
  clearDashboardExportData,
} = siteMonitorDashboardSlice.actions;

export default siteMonitorDashboardSlice.reducer;