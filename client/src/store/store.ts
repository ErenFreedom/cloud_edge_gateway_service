import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import platformReducer from "../features/platform/platformSlice";
import sitesReducer from "../features/sites/sitesSlice";
import orgManagerReducer from "../features/orgManager/orgManagerSlice";


export const store = configureStore({

  reducer: {

    auth: authReducer,
    platform: platformReducer,
    sites: sitesReducer,
    orgManager: orgManagerReducer,
  }

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;