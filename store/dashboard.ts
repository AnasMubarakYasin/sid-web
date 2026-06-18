"use client";

import { create, StateCreator, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { UserState } from "./user";

export interface DefaultDashboardState {
  path: string;
  title: string;
  isSmallSize: boolean;
  openSideBar: boolean;
  loading: boolean;
}

export interface DashboardState {
  path: string;
  title: string;
  isSmallSize: boolean;
  openSideBar: boolean;
  loading: boolean;
  toasting: boolean;
  toast: {
    level: "success" | "info" | "warning" | "error" | "";
    message: string;
  };
  setPath(value: string): void;
  setTitle(value: string): void;
  setIsSmallSize(value: boolean): void;
  setOpenSideBar(value: boolean): void;
  setLoading(value: boolean): void;
  setToasting(value: boolean): void;
  setToast(
    value: {
      level: "success" | "info" | "warning" | "error" | "";
      message: string;
    },
    toasting?: boolean,
  ): void;
  initPage(title: string, loading: boolean): void;
}

let timeoutid1: any;
let timeoutid2: any;
export const dashboardSlice: StateCreator<
  DashboardState,
  any,
  any,
  DashboardState
> = persist<DashboardState, [], [], DashboardState>(
  (set) => ({
    path: "",
    title: "",
    isSmallSize: false,
    openSideBar: true,
    loading: true,
    toasting: false,
    toast: { level: "", message: "" },
    setPath(value) {
      set((state) => ({ ...state, path: value }));
    },
    setTitle(value) {
      set((state) => ({ ...state, title: value }));
    },
    setIsSmallSize(value) {
      set({ isSmallSize: value });
    },
    setOpenSideBar(value) {
      set({ openSideBar: value });
    },
    setLoading(value) {
      clearTimeout(timeoutid1);
      if (value) {
        set({ loading: value });
      } else {
        timeoutid1 = setTimeout(() => {
          set({ loading: value });
        }, 1000);
      }
    },
    setToasting(value) {
      set({ toasting: value });
      // clearTimeout(timeoutid2);
      // if (value) {
      //   set({ toasting: value });
      // } else {
      //   timeoutid2 = setTimeout(() => {
      //     set({ toasting: value });
      //     // set({ toasting: value, toast: { level: null, message: "" } });
      //   }, 1000);
      // }
    },
    setToast(value, toasting = true) {
      set({ toast: value, toasting: toasting });
    },
    initPage(title, loading) {
      set((state) => ({ ...state, title, loading }));
    },
  }),
  {
    name: "dashboard-storage",
    version: 1,
    partialize: (state) => ({
      ...state,
      toasting: false,
      toast: { level: "", message: "" },
    }),
  },
);

// export const useDashboardStore = create<DashboardState>()(
//   persist(
//     (set) => ({
//       path: "",
//       title: "",
//       loading: true,
//       setPath(value) {
//         set({ path: value });
//       },
//       setTitle(value) {
//         set({ title: value });
//       },
//       setLoading(value) {
//         set({ loading: value });
//       },
//     }),
//     { name: "dashboard-storage", version: 1, skipHydration: true },
//   ),
// );
// ((set) => ({
//   path: "",
//   title: "",
//   loading: true,
//   setPath(value) {
//     set({ path: value });
//   },
//   setTitle(value) {
//     set({ title: value });
//   },
//   setLoading(value) {
//     set({ loading: value });
//   },
// }));

// export const useDashboardBound = create<DashboardState & UserState>()(
//   (...a) => ({
//     ...useDashboardStore(...a),
//     ...useUserStore(...a),
//   }),
// );

export const useDashboardStore = create<DashboardState>()(dashboardSlice);

export const defaultDashboardState: DefaultDashboardState = {
  path: "",
  title: "",
  isSmallSize: true,
  openSideBar: true,
  loading: true,
};

let dashboardStateGlobal: (DashboardState & UserState) | undefined;
export const useDashboardState = (
  initState: DefaultDashboardState = defaultDashboardState,
) => {
  // @ts-expect-error ___
  const api = create<DashboardState & UserState>()((...a) => ({
    ...initState,
    ...dashboardSlice(...a),
  }));
  const store = useStore(api);
  dashboardStateGlobal ??= store;
  // globalThis["dashboardStateGlobal"] ??= store;
  return store;
};

export const useDashboardStateGlobal = () => {
  if (!dashboardStateGlobal) {
    throw new Error("global state not initialized");
  }
  return dashboardStateGlobal;
};
