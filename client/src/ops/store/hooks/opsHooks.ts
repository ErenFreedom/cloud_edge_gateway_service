import {
  useDispatch,
  useSelector,
} from "react-redux";

import type {
  TypedUseSelectorHook,
} from "react-redux";

import type {
  OpsAppDispatch,
  OpsRootState,
} from "../opsStore";

export const useOpsDispatch =
  () => useDispatch<OpsAppDispatch>();

export const useOpsSelector:
  TypedUseSelectorHook<OpsRootState> =
  useSelector;