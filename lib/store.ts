import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/lib/api/authApi";
import { callsApi } from "@/lib/api/callsApi";
import { patientsApi } from "@/lib/api/patientsApi";
import { notificationsApi } from "@/lib/api/notificationsApi";
import { settingsApi } from "@/lib/api/settingsApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [patientsApi.reducerPath]: patientsApi.reducer,
    [callsApi.reducerPath]: callsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      patientsApi.middleware,
      callsApi.middleware,
      settingsApi.middleware,
      notificationsApi.middleware,
    ),
});

export function resetClientStore(): void {
  store.dispatch(authApi.util.resetApiState());
  store.dispatch(patientsApi.util.resetApiState());
  store.dispatch(callsApi.util.resetApiState());
  store.dispatch(settingsApi.util.resetApiState());
  store.dispatch(notificationsApi.util.resetApiState());
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
