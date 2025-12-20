import { configureStore } from "@reduxjs/toolkit";
import analyticsReducer from "./slices/analyticsSlice";
import websitesReducer from "./slices/websitesSlice";
import uiReducer from "./slices/uiSlice";

const makeStore = () => {
  return configureStore({
    reducer: {
      analytics: analyticsReducer,
      websites: websitesReducer,
      ui: uiReducer,
    },
  });
};

// Create a singleton store instance
let storeInstance: ReturnType<typeof makeStore> | undefined;

export const getStore = () => {
  if (!storeInstance) {
    storeInstance = makeStore();
  }
  return storeInstance;
};

// Export store getter for backward compatibility
// Use getStore() in Providers component instead
export const store = getStore();

export type RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;
export type AppDispatch = ReturnType<typeof makeStore>["dispatch"];
