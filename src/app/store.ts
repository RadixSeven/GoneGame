import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import goneGameDisplayReducer from "../features/goneGameDisplay/goneGameDisplaySlice";

export const store = configureStore({
  reducer: {
    goneGameDisplay: goneGameDisplayReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
