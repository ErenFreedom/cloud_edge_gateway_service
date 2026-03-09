import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import platformReducer from "../features/platform/platformSlice";

export const store = configureStore({

  reducer: {

    auth: authReducer,
    platform: platformReducer,

  }

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;