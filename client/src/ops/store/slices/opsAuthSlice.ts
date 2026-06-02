import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  loginOps,
  verifyOpsOtp,
  resendOpsOtp,
} from "../../services/opsAuth.service";

import type {
  OpsAuthState,
  OpsLoginRequest,
  OpsVerifyOtpRequest,
} from "../../types/opsAuth.types";

const initialState: OpsAuthState = {
  user: null,
  accessToken: localStorage.getItem("opsAccessToken"),
  refreshToken: localStorage.getItem("opsRefreshToken"),
  tempLoginId: localStorage.getItem("opsTempLoginId"),
  loading: false,
  error: null,
  isAuthenticated: Boolean(localStorage.getItem("opsAccessToken")),
};

export const opsLoginThunk = createAsyncThunk(
  "opsAuth/login",
  async (data: OpsLoginRequest, { rejectWithValue }) => {
    try {
      return await loginOps(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

export const opsVerifyOtpThunk = createAsyncThunk(
  "opsAuth/verifyOtp",
  async (data: OpsVerifyOtpRequest, { rejectWithValue }) => {
    try {
      return await verifyOpsOtp(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

export const opsResendOtpThunk = createAsyncThunk(
  "opsAuth/resendOtp",
  async (tempLoginId: string, { rejectWithValue }) => {
    try {
      return await resendOpsOtp(tempLoginId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to resend OTP"
      );
    }
  }
);

const opsAuthSlice = createSlice({
  name: "opsAuth",
  initialState,
  reducers: {
    opsLogout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tempLoginId = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("opsAccessToken");
      localStorage.removeItem("opsRefreshToken");
      localStorage.removeItem("opsTempLoginId");
      localStorage.removeItem("opsUser");
    },

    clearOpsAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(opsLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(opsLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.tempLoginId = action.payload.tempLoginId;

        localStorage.setItem(
          "opsTempLoginId",
          action.payload.tempLoginId
        );
      })
      .addCase(opsLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(opsVerifyOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(opsVerifyOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.tempLoginId = null;

        localStorage.setItem(
          "opsAccessToken",
          action.payload.accessToken
        );
        localStorage.setItem(
          "opsRefreshToken",
          action.payload.refreshToken
        );
        localStorage.setItem(
          "opsUser",
          JSON.stringify(action.payload.user)
        );
        localStorage.removeItem("opsTempLoginId");
      })
      .addCase(opsVerifyOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(opsResendOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(opsResendOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.tempLoginId = action.payload.tempLoginId;

        localStorage.setItem(
          "opsTempLoginId",
          action.payload.tempLoginId
        );
      })
      .addCase(opsResendOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  opsLogout,
  clearOpsAuthError,
} = opsAuthSlice.actions;

export default opsAuthSlice.reducer;