"use client";

// const addr = process.env.NEXT_PUBLIC_ADDR;
const api = "/user";
let token = "";

export interface User {
  id: number;
  name: string;
  role: string;
}

export function setToken(value: string) {
  token = value;
}
export function getToken() {
  return token;
}
export async function signup(param: {
  username: string;
  role: string;
  password: string;
  confirm: string;
}) {
  const response = await fetch(`/api/user/sign-up`, {
    headers: { "content-type": "application/json", accept: "application/json" },
    method: "POST",
    body: JSON.stringify(param),
  });
  const data = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
export async function signin(param: { username: string; password: string }) {
  const response = await fetch(`/api/user/sign-in`, {
    headers: { "content-type": "application/json", accept: "application/json" },
    method: "POST",
    body: JSON.stringify(param),
  });
  const data = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
export async function signout() {
  const response = await fetch(`/api/user/sign-out`, {
    headers: { "content-type": "application/json", accept: "application/json" },
    method: "POST",
    body: JSON.stringify({}),
  });
  const data = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
export async function auth(token: string) {
  const response = await fetch(`/api/user/auth`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    method: "GET",
  });
  const data = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}

export async function authz(token: string, param: string) {
  const response = await fetch(`/api/user/authz` + param, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    method: "GET",
  });
  const data = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
