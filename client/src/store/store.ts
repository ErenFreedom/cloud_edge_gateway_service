import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import platformReducer from "../features/platform/platformSlice";
import sitesReducer from "../features/sites/sitesSlice";
import orgManagerReducer from "../features/orgManager/orgManagerSlice";
import activationReducer from "../features/activation/activationSlice";
import clientReducer from "../features/client/clientSlice";
import grihaReducer from "../features/griha/grihaSlice";
import complianceReducer from "../features/compliance/complianceSlice";
import loadAnalyticsReducer from "../features/loadAnalytics/loadAnalyticsSlice";
import siteMonitorReducer from "../features/siteMonitor/siteMonitorSlice";
import siteHierarchyReducer from "../features/siteHierarchy/siteHierarchySlice";

export const store = configureStore({

  reducer: {

    auth: authReducer,
    platform: platformReducer,
    sites: sitesReducer,
    orgManager: orgManagerReducer,
    activation: activationReducer,
    client: clientReducer,
    griha: grihaReducer,
    compliance: complianceReducer,
    loadAnalytics: loadAnalyticsReducer,
    siteMonitor: siteMonitorReducer,
    siteHierarchy: siteHierarchyReducer,
  }

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;