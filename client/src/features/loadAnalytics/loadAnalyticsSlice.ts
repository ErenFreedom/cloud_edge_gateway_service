import {
    createSlice,
    createAsyncThunk,
} from "@reduxjs/toolkit";

import {
    fetchCurrentLoadAnalytics,
    exportLoadAnalyticsCsv,
} from "../../services/loadAnalytics.service";

interface LoadAnalyticsState {
    loading: boolean;
    exportLoading: boolean;

    error: string | null;
    success: boolean;

    currentRange: string;

    sensors: any[];

    exportBlob: Blob | null;
}

const initialState: LoadAnalyticsState = {
    loading: false,
    exportLoading: false,

    error: null,
    success: false,

    currentRange: "1h",

    sensors: [],

    exportBlob: null,
};

export const fetchCurrentLoadAnalyticsThunk =
    createAsyncThunk(
        "loadAnalytics/fetchCurrent",
        async (payload: any, thunkAPI) => {
            try {
                return await fetchCurrentLoadAnalytics(
                    payload
                );
            } catch (err: any) {
                return thunkAPI.rejectWithValue(
                    err.response?.data?.message ||
                    "Failed to fetch analytics"
                );
            }
        }
    );

export const exportLoadAnalyticsThunk =
    createAsyncThunk(
        "loadAnalytics/exportCsv",
        async (payload: any, thunkAPI) => {
            try {
                return await exportLoadAnalyticsCsv(
                    payload
                );
            } catch (err: any) {
                return thunkAPI.rejectWithValue(
                    err.response?.data?.message ||
                    "Failed to export CSV"
                );
            }
        }
    );

const loadAnalyticsSlice = createSlice({
    name: "loadAnalytics",

    initialState,

    reducers: {
        resetLoadAnalyticsState: (state) => {
            state.loading = false;
            state.exportLoading = false;
            state.error = null;
            state.success = false;
        },

        setCurrentRange: (state, action) => {
            state.currentRange = action.payload;
        },
    },

    extraReducers: (builder) => {
        builder

            .addCase(
                fetchCurrentLoadAnalyticsThunk.pending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )

            .addCase(
                fetchCurrentLoadAnalyticsThunk.fulfilled,
                (state, action) => {
                    state.loading = false;

                    state.sensors =
                        action.payload?.sensors || [];
                }
            )

            .addCase(
                fetchCurrentLoadAnalyticsThunk.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload as string;
                }
            )

            .addCase(
                exportLoadAnalyticsThunk.pending,
                (state) => {
                    state.exportLoading = true;
                }
            )

            .addCase(
                exportLoadAnalyticsThunk.fulfilled,
                (state, action) => {
                    state.exportLoading = false;

                    state.exportBlob =
                        action.payload;
                }
            )

            .addCase(
                exportLoadAnalyticsThunk.rejected,
                (state, action) => {
                    state.exportLoading = false;

                    state.error =
                        action.payload as string;
                }
            );
    },
});

export const {
    resetLoadAnalyticsState,
    setCurrentRange,
} = loadAnalyticsSlice.actions;

export default loadAnalyticsSlice.reducer;