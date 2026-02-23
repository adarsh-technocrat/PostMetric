import { configureStore } from "@reduxjs/toolkit";
import analyticsReducer from "./slices/analyticsSlice";
import websitesReducer from "./slices/websitesSlice";
import uiReducer from "./slices/uiSlice";
import foldersReducer from "./slices/foldersSlice";
import workflowsReducer from "./slices/workflowsSlice";
import linkTemplatesReducer from "./slices/linkTemplatesSlice";
import billingReducer from "./slices/billingSlice";

const makeStore = () => {
  return configureStore({
    reducer: {
      analytics: analyticsReducer,
      websites: websitesReducer,
      ui: uiReducer,
      folders: foldersReducer,
      workflows: workflowsReducer,
      linkTemplates: linkTemplatesReducer,
      billing: billingReducer,
    },
  });
};

let storeInstance: ReturnType<typeof makeStore> | undefined;

export const getStore = () => {
  if (!storeInstance) {
    storeInstance = makeStore();
  }
  return storeInstance;
};

export const store = getStore();

export type RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;
export type AppDispatch = ReturnType<typeof makeStore>["dispatch"];
