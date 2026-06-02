import { configureStore } from "@reduxjs/toolkit";
import opsAuthReducer from "./slices/opsAuthSlice";

export const opsStore = configureStore({
  reducer: {
    opsAuth: opsAuthReducer,
  },
});

export type OpsRootState = ReturnType<typeof opsStore.getState>;
export type OpsAppDispatch = typeof opsStore.dispatch;