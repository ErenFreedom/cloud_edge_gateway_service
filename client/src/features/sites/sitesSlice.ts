import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";



import {
  getSites,
  createSite,
  regenerateSiteCredentials,
  verifySiteAdminOtp,
  getSiteDetails,
  updateSite,
  requestEmailChange,
  verifyEmailChange,
  editSiteUser,
} from "../../services/sites.service";

import type {
 SiteInfo,
 // SiteUser,
  SiteDetails,
  CreateSitePayload,
  UpdateSitePayload
} from "../../services/sites.service";


// interface Site {

//   id: string;
//   site_name: string;

//   phone: string | null;

//   address_line1: string;
//   address_line2: string | null;

//   state: string;
//   country: string;

//   gst_number: string | null;


//   latitude: number | null
//   longitude: number | null

//   site_uuid: string | null;
//   machine_fingerprint: string | null;

//   status: string;
//   created_at: string;
//   activated_at: string | null;
// }



// interface SiteUser {
//   id: string;
//   full_name: string;
//   email: string;
//   phone?: string | null;

//   role: "site_admin" | "site_viewer";

//   status?: string;
//   birthdate?: string | null;
//   gender?: string | null;

//   email_verified?: boolean;
//   created_at?: string;
// }


// interface SiteDetails {
//   site: Site;
//   site_admin: SiteUser | null;
//   viewers: SiteUser[];
// }

interface SitesState {

  sites: SiteInfo[];

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

  emailChangeOtpId: string | null;
  emailChangeRequested: boolean;
  emailChangeVerified: boolean;
  siteUserUpdated: boolean;
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

  emailChangeOtpId: null,
  emailChangeRequested: false,
  emailChangeVerified: false,
  siteUserUpdated: false,
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
    payload: { siteId: string; data: UpdateSitePayload },
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


export const requestEmailChangeThunk = createAsyncThunk(
  "sites/requestEmailChange",
  async (
    payload: { userId: string; newEmail: string },
    thunkAPI
  ) => {

    try {

      const data = await requestEmailChange(payload);

      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to request email change"
      );

    }

  }
);


export const verifyEmailChangeThunk = createAsyncThunk(
  "sites/verifyEmailChange",
  async (
    payload: { otpId: string; otp: string },
    thunkAPI
  ) => {

    try {

      const data = await verifyEmailChange(payload);

      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to verify email change"
      );

    }

  }
);


export const editSiteUserThunk = createAsyncThunk(
  "sites/editSiteUser",
  async (payload: any, thunkAPI) => {

    try {

      const result = await editSiteUser(payload)

      return result

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to update site user"
      )

    }

  }
)


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

    },
    resetEmailChangeState: (state) => {

      state.emailChangeRequested = false;
      state.emailChangeVerified = false;
      state.emailChangeOtpId = null;

    },
    resetSiteUserState: (state) => {

      state.siteUserUpdated = false

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

        if (state.selectedSite) {
          state.selectedSite.site = action.payload.site;
        }

      })

      .addCase(updateSiteThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })
      .addCase(requestEmailChangeThunk.pending, (state) => {

        state.loading = true;
        state.error = null;

      })

      .addCase(requestEmailChangeThunk.fulfilled, (state, action) => {

        state.loading = false;

        state.emailChangeRequested = true;
        state.emailChangeOtpId = action.payload.otpId;

      })

      .addCase(requestEmailChangeThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })

      .addCase(verifyEmailChangeThunk.pending, (state) => {

        state.loading = true;
        state.error = null;

      })

      .addCase(verifyEmailChangeThunk.fulfilled, (state) => {

        state.loading = false;

        state.emailChangeVerified = true;
        state.emailChangeOtpId = null;

      })

      .addCase(verifyEmailChangeThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })

      .addCase(editSiteUserThunk.pending, (state) => {

        state.loading = true
        state.error = null
        state.siteUserUpdated = false

      })

      .addCase(editSiteUserThunk.fulfilled, (state) => {

        state.loading = false
        state.siteUserUpdated = true

      })

      .addCase(editSiteUserThunk.rejected, (state, action) => {

        state.loading = false
        state.error = action.payload as string

      });

  }

});

export const { resetSiteState, resetCredentials, resetSiteUpdateState, resetEmailChangeState, resetSiteUserState } = sitesSlice.actions;

export default sitesSlice.reducer;