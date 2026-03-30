import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlices";

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

// 🔥 Types (IMPORTANT)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;