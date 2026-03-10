import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import platformReducer from "../features/platform/platformSlice";
import sitesReducer from "../features/sites/sitesSlice";

export const store = configureStore({

  reducer: {

    auth: authReducer,
    platform: platformReducer,
    sites: sitesReducer

  }

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;