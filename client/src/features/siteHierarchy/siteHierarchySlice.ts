import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

import {
  fetchSiteHierarchy,

  createBuilding,
  createFloor,
  createRoom,
  createComponent,

  updateBuilding,
  updateFloor,
  updateRoom,
  updateComponent,

  deleteBuilding,
  deleteFloor,
  deleteRoom,
  deleteComponent,

  fetchSensorAssignments,
  bulkAssignSensorLocation,
  clearSensorLocation,

  addSensorTag,
  removeSensorTag,
} from "../../services/siteHierarchy.service";

import type {
  HierarchyBuilding,
  SensorAssignment,

  CreateBuildingPayload,
  CreateFloorPayload,
  CreateRoomPayload,
  CreateComponentPayload,

  UpdateBuildingPayload,
  UpdateFloorPayload,
  UpdateRoomPayload,
  UpdateComponentPayload,

  BulkAssignSensorLocationPayload,
  ClearSensorLocationPayload,

  AddSensorTagPayload,
} from "../../services/siteHierarchy.service";

/* ---------------- STATE ---------------- */

interface SiteHierarchyState {
  loading: boolean;
  sensorLoading: boolean;
  actionLoading: boolean;

  error: string | null;
  success: boolean;

  hierarchy: HierarchyBuilding[];

  sensorAssignments: SensorAssignment[];
}

const initialState: SiteHierarchyState = {
  loading: false,
  sensorLoading: false,
  actionLoading: false,

  error: null,
  success: false,

  hierarchy: [],

  sensorAssignments: [],
};

/* ---------------- ERROR HELPER ---------------- */

const getErrorMessage = (
  err: any,
  fallback: string
): string => {
  return err.response?.data?.message || fallback;
};

/* ---------------- HIERARCHY TREE ---------------- */

export const fetchSiteHierarchyThunk = createAsyncThunk(
  "siteHierarchy/fetchHierarchy",
  async (siteId: string, thunkAPI) => {
    try {
      return await fetchSiteHierarchy(siteId);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch site hierarchy")
      );
    }
  }
);

/* ---------------- CREATE NODES ---------------- */

export const createBuildingThunk = createAsyncThunk(
  "siteHierarchy/createBuilding",
  async (
    payload: {
      siteId: string;
      data: CreateBuildingPayload;
    },
    thunkAPI
  ) => {
    try {
      return await createBuilding(
        payload.siteId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to create building")
      );
    }
  }
);

export const createFloorThunk = createAsyncThunk(
  "siteHierarchy/createFloor",
  async (
    payload: {
      siteId: string;
      buildingId: string;
      data: CreateFloorPayload;
    },
    thunkAPI
  ) => {
    try {
      return await createFloor(
        payload.siteId,
        payload.buildingId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to create floor")
      );
    }
  }
);

export const createRoomThunk = createAsyncThunk(
  "siteHierarchy/createRoom",
  async (
    payload: {
      siteId: string;
      floorId: string;
      data: CreateRoomPayload;
    },
    thunkAPI
  ) => {
    try {
      return await createRoom(
        payload.siteId,
        payload.floorId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to create room")
      );
    }
  }
);

export const createComponentThunk = createAsyncThunk(
  "siteHierarchy/createComponent",
  async (
    payload: {
      siteId: string;
      roomId: string;
      data: CreateComponentPayload;
    },
    thunkAPI
  ) => {
    try {
      return await createComponent(
        payload.siteId,
        payload.roomId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to create component")
      );
    }
  }
);

/* ---------------- UPDATE NODES ---------------- */

export const updateBuildingThunk = createAsyncThunk(
  "siteHierarchy/updateBuilding",
  async (
    payload: {
      siteId: string;
      buildingId: string;
      data: UpdateBuildingPayload;
    },
    thunkAPI
  ) => {
    try {
      return await updateBuilding(
        payload.siteId,
        payload.buildingId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to update building")
      );
    }
  }
);

export const updateFloorThunk = createAsyncThunk(
  "siteHierarchy/updateFloor",
  async (
    payload: {
      siteId: string;
      floorId: string;
      data: UpdateFloorPayload;
    },
    thunkAPI
  ) => {
    try {
      return await updateFloor(
        payload.siteId,
        payload.floorId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to update floor")
      );
    }
  }
);

export const updateRoomThunk = createAsyncThunk(
  "siteHierarchy/updateRoom",
  async (
    payload: {
      siteId: string;
      roomId: string;
      data: UpdateRoomPayload;
    },
    thunkAPI
  ) => {
    try {
      return await updateRoom(
        payload.siteId,
        payload.roomId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to update room")
      );
    }
  }
);

export const updateComponentThunk = createAsyncThunk(
  "siteHierarchy/updateComponent",
  async (
    payload: {
      siteId: string;
      componentId: string;
      data: UpdateComponentPayload;
    },
    thunkAPI
  ) => {
    try {
      return await updateComponent(
        payload.siteId,
        payload.componentId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to update component")
      );
    }
  }
);

/* ---------------- DELETE NODES ---------------- */

export const deleteBuildingThunk = createAsyncThunk(
  "siteHierarchy/deleteBuilding",
  async (
    payload: {
      siteId: string;
      buildingId: string;
    },
    thunkAPI
  ) => {
    try {
      return await deleteBuilding(
        payload.siteId,
        payload.buildingId
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to delete building")
      );
    }
  }
);

export const deleteFloorThunk = createAsyncThunk(
  "siteHierarchy/deleteFloor",
  async (
    payload: {
      siteId: string;
      floorId: string;
    },
    thunkAPI
  ) => {
    try {
      return await deleteFloor(
        payload.siteId,
        payload.floorId
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to delete floor")
      );
    }
  }
);

export const deleteRoomThunk = createAsyncThunk(
  "siteHierarchy/deleteRoom",
  async (
    payload: {
      siteId: string;
      roomId: string;
    },
    thunkAPI
  ) => {
    try {
      return await deleteRoom(
        payload.siteId,
        payload.roomId
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to delete room")
      );
    }
  }
);

export const deleteComponentThunk = createAsyncThunk(
  "siteHierarchy/deleteComponent",
  async (
    payload: {
      siteId: string;
      componentId: string;
    },
    thunkAPI
  ) => {
    try {
      return await deleteComponent(
        payload.siteId,
        payload.componentId
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to delete component")
      );
    }
  }
);



/* ---------------- SENSOR ASSIGNMENTS ---------------- */

export const fetchSensorAssignmentsThunk = createAsyncThunk(
  "siteHierarchy/fetchSensorAssignments",
  async (siteId: string, thunkAPI) => {
    try {
      return await fetchSensorAssignments(siteId);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to fetch sensor assignments")
      );
    }
  }
);

export const bulkAssignSensorLocationThunk = createAsyncThunk(
  "siteHierarchy/bulkAssignSensorLocation",
  async (
    payload: {
      siteId: string;
      data: BulkAssignSensorLocationPayload;
    },
    thunkAPI
  ) => {
    try {
      return await bulkAssignSensorLocation(
        payload.siteId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to assign sensor location")
      );
    }
  }
);

export const clearSensorLocationThunk = createAsyncThunk(
  "siteHierarchy/clearSensorLocation",
  async (
    payload: {
      siteId: string;
      data: ClearSensorLocationPayload;
    },
    thunkAPI
  ) => {
    try {
      return await clearSensorLocation(
        payload.siteId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to clear sensor location")
      );
    }
  }
);


/* ---------------- SENSOR TAGS ---------------- */

export const addSensorTagThunk = createAsyncThunk(
  "siteHierarchy/addSensorTag",
  async (
    payload: {
      siteId: string;
      sensorId: string;
      data: AddSensorTagPayload;
    },
    thunkAPI
  ) => {
    try {
      return await addSensorTag(
        payload.siteId,
        payload.sensorId,
        payload.data
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to add sensor tag")
      );
    }
  }
);

export const removeSensorTagThunk = createAsyncThunk(
  "siteHierarchy/removeSensorTag",
  async (
    payload: {
      siteId: string;
      sensorId: string;
      tagId: string;
    },
    thunkAPI
  ) => {
    try {
      return await removeSensorTag(
        payload.siteId,
        payload.sensorId,
        payload.tagId
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(err, "Failed to remove sensor tag")
      );
    }
  }
);

/* ---------------- SLICE BASE ---------------- */

const siteHierarchySlice = createSlice({
  name: "siteHierarchy",

  initialState,

  reducers: {
    resetSiteHierarchyState: (state) => {
      state.loading = false;
      state.sensorLoading = false;
      state.actionLoading = false;
      state.error = null;
      state.success = false;
    },

    clearSiteHierarchyError: (state) => {
      state.error = null;
    },

    clearSiteHierarchyData: (state) => {
      state.hierarchy = [];
      state.sensorAssignments = [];
      state.error = null;
      state.success = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------------- FETCH HIERARCHY ---------------- */

      .addCase(fetchSiteHierarchyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSiteHierarchyThunk.fulfilled,
        (
          state,
          action: PayloadAction<HierarchyBuilding[]>
        ) => {
          state.loading = false;
          state.hierarchy = action.payload || [];
        }
      )
      .addCase(fetchSiteHierarchyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* ---------------- CREATE ---------------- */

      .addCase(createBuildingThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBuildingThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(createBuildingThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(createFloorThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createFloorThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(createFloorThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(createRoomThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createRoomThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(createRoomThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(createComponentThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createComponentThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(createComponentThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      /* ---------------- UPDATE ---------------- */

      .addCase(updateBuildingThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBuildingThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(updateBuildingThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(updateFloorThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateFloorThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(updateFloorThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(updateRoomThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateRoomThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(updateRoomThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(updateComponentThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateComponentThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(updateComponentThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      /* ---------------- DELETE ---------------- */

      .addCase(deleteBuildingThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteBuildingThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(deleteBuildingThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteFloorThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteFloorThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(deleteFloorThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteRoomThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteRoomThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(deleteRoomThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteComponentThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteComponentThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(deleteComponentThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
            /* ---------------- FETCH SENSOR ASSIGNMENTS ---------------- */

      .addCase(fetchSensorAssignmentsThunk.pending, (state) => {
        state.sensorLoading = true;
        state.error = null;
      })
      .addCase(
        fetchSensorAssignmentsThunk.fulfilled,
        (
          state,
          action: PayloadAction<SensorAssignment[]>
        ) => {
          state.sensorLoading = false;
          state.sensorAssignments = action.payload || [];
        }
      )
      .addCase(fetchSensorAssignmentsThunk.rejected, (state, action) => {
        state.sensorLoading = false;
        state.error = action.payload as string;
      })

      /* ---------------- BULK ASSIGN SENSOR LOCATION ---------------- */

      .addCase(bulkAssignSensorLocationThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(bulkAssignSensorLocationThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(bulkAssignSensorLocationThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      /* ---------------- CLEAR SENSOR LOCATION ---------------- */

      .addCase(clearSensorLocationThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(clearSensorLocationThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(clearSensorLocationThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
            /* ---------------- ADD SENSOR TAG ---------------- */

      .addCase(addSensorTagThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addSensorTagThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(addSensorTagThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      /* ---------------- REMOVE SENSOR TAG ---------------- */

      .addCase(removeSensorTagThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(removeSensorTagThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.success = true;
      })
      .addCase(removeSensorTagThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});


export const {
  resetSiteHierarchyState,
  clearSiteHierarchyError,
  clearSiteHierarchyData,
} = siteHierarchySlice.actions;

export default siteHierarchySlice.reducer;