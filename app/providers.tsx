"use client";

import { AuthProvider } from "@/lib/firebase/auth-context";
import { Provider } from "react-redux";
import { getStore } from "@/store/store";
import { useMemo } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => getStore(), []);

  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  );
}
