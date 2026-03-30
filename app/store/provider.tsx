"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "./index";

export default function ReduxProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Provider store={store}>
      {children}
      <Toaster position="bottom-center" richColors />
    </Provider>
  );
}