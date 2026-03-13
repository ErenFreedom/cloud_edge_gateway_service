import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  getSites,
  createSite,
  regenerateSiteCredentials,
  verifySiteAdminOtp,
  getSiteDetails,
  updateSite
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

  site_uuid: string | null;
  machine_fingerprint: string | null;

  status: string;
  created_at: string;
  activated_at: string | null;
}


interface SiteUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  site_role: "site_admin" | "site_viewer";
}

interface SiteDetails {
  site: Site;
  users: SiteUser[];
}

interface SitesState {
  sites: Site[];

  loading: boolean;
  error: string | null;

  siteCreated: boolean;

  otpId: string | null;
  requiresOtp: boolean;

  credentials: {
    site_uuid: string;
    site_secret: string;
  } | null;

  credentialsGenerated: boolean;

  selectedSite: SiteDetails | null;
  siteDetailsLoading: boolean;

  siteUpdated: boolean;
}


const initialState: SitesState = {
  sites: [],
  loading: false,
  error: null,
  siteCreated: false,

  otpId: null,
  requiresOtp: false,

  credentials: null,
  credentialsGenerated: false,

  selectedSite: null,
  siteDetailsLoading: false,
  siteUpdated: false,
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


export const verifySiteAdminOtpThunk = createAsyncThunk(
  "sites/verifySiteAdminOtp",
  async (
    payload: { otpId: string; otp: string },
    thunkAPI
  ) => {

    try {

      const data = await verifySiteAdminOtp(
        payload.otpId,
        payload.otp
      );

      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to verify OTP"
      );

    }

  }
);


export const regenerateCredentialsThunk = createAsyncThunk(
  "sites/regenerateCredentials",
  async (
    payload: { siteId: string; password: string },
    thunkAPI
  ) => {

    try {

      const data = await regenerateSiteCredentials(
        payload.siteId,
        payload.password
      );

      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to regenerate credentials"
      );

    }

  }
);


export const fetchSiteDetailsThunk = createAsyncThunk(
  "sites/fetchSiteDetails",
  async (siteId: string, thunkAPI) => {

    try {

      const data = await getSiteDetails(siteId);

      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch site details"
      );

    }

  }
);

export const updateSiteThunk = createAsyncThunk(
  "sites/updateSite",
  async (
    payload: { siteId: string; data: any },
    thunkAPI
  ) => {

    try {

      const result = await updateSite(
        payload.siteId,
        payload.data
      );

      return result;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update site"
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
      state.otpId = null;
      state.requiresOtp = false;

    },

    resetCredentials: (state) => {

      state.credentials = null;
      state.credentialsGenerated = false;

    },

    resetSiteUpdateState: (state) => {

      state.siteUpdated = false;

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

      .addCase(createSiteThunk.fulfilled, (state, action) => {

        state.loading = false;
        state.siteCreated = true;

        state.otpId = action.payload.otpId || null;
        state.requiresOtp = !!action.payload.otpId;

      })

      .addCase(createSiteThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })

      .addCase(regenerateCredentialsThunk.pending, (state) => {

        state.loading = true;
        state.error = null;

      })

      .addCase(regenerateCredentialsThunk.fulfilled, (state, action) => {

        state.loading = false;

        state.credentials = action.payload.credentials;

        state.credentialsGenerated = true;

      })

      .addCase(regenerateCredentialsThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })

      .addCase(verifySiteAdminOtpThunk.pending, (state) => {

        state.loading = true; 
        state.error = null;

      })

      .addCase(verifySiteAdminOtpThunk.fulfilled, (state) => {

        state.loading = false;

        state.requiresOtp = false;
        state.otpId = null;

        state.siteCreated = true;

      })

      .addCase(verifySiteAdminOtpThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })

      .addCase(fetchSiteDetailsThunk.pending, (state) => {

        state.siteDetailsLoading = true;
        state.error = null;

      })

      .addCase(fetchSiteDetailsThunk.fulfilled, (state, action) => {

        state.siteDetailsLoading = false;
        state.selectedSite = action.payload;

      })

      .addCase(fetchSiteDetailsThunk.rejected, (state, action) => {

        state.siteDetailsLoading = false;
        state.error = action.payload as string;

      })

      .addCase(updateSiteThunk.pending, (state) => {

        state.loading = true;
        state.error = null;
        state.siteUpdated = false;

      })

      .addCase(updateSiteThunk.fulfilled, (state, action) => {

        state.loading = false;
        state.siteUpdated = true;

        state.selectedSite = action.payload;

      })

      .addCase(updateSiteThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      });

  }

});

export const { resetSiteState, resetCredentials,  resetSiteUpdateState } = sitesSlice.actions;

export default sitesSlice.reducer;