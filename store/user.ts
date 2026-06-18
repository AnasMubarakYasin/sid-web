"use client";

import { create, StateCreator, useStore } from "zustand";
import { persist } from "zustand/middleware";

export interface DefaultUserState {
  name: string | null;
}

export interface UserState {
  id: number | null;
  name: string | null;
  role: string | null;
  token: string | null;
  authenticated: boolean;
  authorized: boolean;
  visit: number;
  login: (param: ParamLogin) => void;
  logout: () => void;
  allow: () => void;
  reject: () => void;
}

interface ParamLogin {
  id: number;
  name: string;
  role: string;
  token: string;
}

export const userSlice: StateCreator<UserState, any, any, UserState> = persist(
  (set, get) => ({
    id: null,
    name: null,
    role: null,
    token: null,
    authenticated: false,
    authorized: false,
    visit: 0,
    login: (param: ParamLogin) => {
      // console.log("login:", param);
      set({
        id: param.id,
        name: param.name,
        role: param.role,
        token: param.token,
        authenticated: true,
        authorized: true,
        visit: get().visit + 1,
      });
    },
    logout: () => {
      set({
        name: null,
        role: null,
        token: null,
        authenticated: false,
        authorized: false,
      });
    },
    allow: () => {
      set({ authorized: true });
    },
    reject: () => {
      set({ authorized: false });
    },
    visited: () => {
      set({ visit: get().visit + 1 });
    },
  }),
  {
    name: "user-storage",
    version: 1,
    partialize: (state) => ({ token: state.token }),
  },
);

export const useUserStore = create<UserState>()(userSlice);

export const defaultUserState: DefaultUserState = {
  name: null,
};

export const useUserState = (
  initState: DefaultUserState = defaultUserState,
) => {
  const store = create<UserState>()((...a) => ({
    ...initState,
    ...userSlice(...a),
  }));
  return useStore(store);
};
