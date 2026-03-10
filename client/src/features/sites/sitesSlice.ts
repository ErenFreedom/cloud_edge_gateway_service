import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  getSites,
  createSite
} from "../../services/sites.service";

import type {
  CreateSitePayload
} from "../../services/sites.service";


interface Site {
  id: string;
  site_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  state: string;
  country: string;
  gst_number: string | null;
  status: string;
  created_at: string;
  activated_at: string | null;
}

interface SitesState {
  sites: Site[];
  loading: boolean;
  error: string | null;
  siteCreated: boolean;
}

const initialState: SitesState = {
  sites: [],
  loading: false,
  error: null,
  siteCreated: false
};


export const fetchSitesThunk = createAsyncThunk(
  "sites/fetchSites",
  async (_, thunkAPI) => {
    try {

      const data = await getSites();

      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch sites"
      );

    }
  }
);


export const createSiteThunk = createAsyncThunk(
  "sites/createSite",
  async (payload: CreateSitePayload, thunkAPI) => {

    try {

      const data = await createSite(payload);

      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create site"
      );

    }

  }
);


const sitesSlice = createSlice({

  name: "sites",

  initialState,

  reducers: {

    resetSiteState: (state) => {

      state.error = null;
      state.siteCreated = false;

    }

  },

  extraReducers: (builder) => {

    builder


      .addCase(fetchSitesThunk.pending, (state) => {

        state.loading = true;
        state.error = null;

      })

      .addCase(fetchSitesThunk.fulfilled, (state, action) => {

        state.loading = false;
        state.sites = action.payload;

      })

      .addCase(fetchSitesThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })


      .addCase(createSiteThunk.pending, (state) => {

        state.loading = true;
        state.error = null;

      })

      .addCase(createSiteThunk.fulfilled, (state) => {

        state.loading = false;
        state.siteCreated = true;

      })

      .addCase(createSiteThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      });

  }

});

export const { resetSiteState } = sitesSlice.actions;

export default sitesSlice.reducer;