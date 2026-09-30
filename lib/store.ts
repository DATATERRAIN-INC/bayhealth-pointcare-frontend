import { configureStore } from "@reduxjs/toolkit";
import { callsApi } from "@/lib/api/callsApi";
import { patientsApi } from "@/lib/api/patientsApi";

export const store = configureStore({
  reducer: {
    [patientsApi.reducerPath]: patientsApi.reducer,
    [callsApi.reducerPath]: callsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(patientsApi.middleware, callsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
