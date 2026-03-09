import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  registerOrganization,
  verifyOrganizationOtp
} from "../../services/organization.service";

import type {
  RegisterOrganizationPayload,
  VerifyOrganizationOtpPayload
} from "../../services/organization.service";


import {
  loginUser,
  verifyLoginOtp
} from "../../services/auth.service";

import type {
  LoginPayload,
  VerifyLoginOtpPayload
} from "../../services/auth.service";

/* ---------------- STATE ---------------- */

interface AuthState {

  loading: boolean;
  error: string | null;

  registrationSuccess: boolean;
  otpVerified: boolean;

  loginSuccess: boolean;
  loginOtpVerified: boolean;

  pendingRequestId: string | null;
  pendingLoginEmail: string | null;

}

const initialState: AuthState = {

  loading: false,
  error: null,

  registrationSuccess: false,
  otpVerified: false,

  loginSuccess: false,
  loginOtpVerified: false,

  pendingRequestId: null,
  pendingLoginEmail: null

};


/* ---------------- REGISTER ORG ---------------- */

export const registerOrgThunk = createAsyncThunk(
  "auth/registerOrganization",
  async (payload: RegisterOrganizationPayload, thunkAPI) => {

    try {

      const data = await registerOrganization(payload);

      return {
        requestId: data.requestId
      };

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );

    }

  }
);


/* ---------------- VERIFY OTP ---------------- */

export const verifyOtpThunk = createAsyncThunk(

  "auth/verifyOrganizationOtp",

  async (payload: VerifyOrganizationOtpPayload, thunkAPI) => {

    try {

      const data = await verifyOrganizationOtp(payload);
      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "OTP verification failed"
      );

    }

  }

);

export const loginThunk = createAsyncThunk(

  "auth/login",

  async (payload: LoginPayload, thunkAPI) => {

    try {

      const data = await loginUser(payload);

      return { data, email: payload.email };

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Login failed"
      );

    }

  }

);

export const verifyLoginOtpThunk = createAsyncThunk(

  "auth/verifyLoginOtp",

  async (payload: VerifyLoginOtpPayload, thunkAPI) => {

    try {

      const data = await verifyLoginOtp(payload);
      return data;

    } catch (error: any) {

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "OTP verification failed"
      );

    }

  }

);


/* ---------------- SLICE ---------------- */

const authSlice = createSlice({

  name: "auth",

  initialState,

  reducers: {

    resetAuthState: (state) => {

      state.loading = false;
      state.error = null;

      state.registrationSuccess = false;
      state.otpVerified = false;

      state.loginSuccess = false;
      state.loginOtpVerified = false;

      state.pendingRequestId = null;
      state.pendingLoginEmail = null;

    }

  },

  extraReducers: (builder) => {

    builder

      /* ---------- REGISTER ---------- */

      .addCase(registerOrgThunk.pending, (state) => {

        state.loading = true;
        state.error = null;

      })

      .addCase(registerOrgThunk.fulfilled, (state, action) => {

        state.loading = false;
        state.registrationSuccess = true;

        state.pendingRequestId = action.payload.requestId;

      })

      .addCase(registerOrgThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })


      /* ---------- VERIFY OTP ---------- */

      .addCase(verifyOtpThunk.pending, (state) => {

        state.loading = true;
        state.error = null;

      })

      .addCase(verifyOtpThunk.fulfilled, (state) => {

        state.loading = false;
        state.otpVerified = true;

      })



      .addCase(verifyOtpThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })

      /* ---------- LOGIN ---------- */

      .addCase(loginThunk.fulfilled, (state, action) => {

        state.loading = false;

        const { data, email } = action.payload;

        /* PLATFORM ADMIN → DIRECT LOGIN */

        if (!data.requiresOtp) {

          localStorage.setItem(
            "accessToken",
            data.accessToken
          );

          localStorage.setItem(
            "refreshToken",
            data.refreshToken
          );

          state.loginOtpVerified = true;

        }

        /* NORMAL USER → OTP FLOW */

        else {

          state.loginSuccess = true;
          state.pendingLoginEmail = email;

        }

      })



      .addCase(loginThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      })

      /* ---------- VERIFY LOGIN OTP ---------- */

      .addCase(verifyLoginOtpThunk.pending, (state) => {

        state.loading = true;
        state.error = null;

      })

      .addCase(verifyLoginOtpThunk.fulfilled, (state) => {

        state.loading = false;
        state.loginOtpVerified = true;

      })

      .addCase(verifyLoginOtpThunk.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload as string;

      });



  }

});

export const { resetAuthState } = authSlice.actions;

export default authSlice.reducer;