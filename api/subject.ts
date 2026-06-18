"use client";

import { ApiResponse } from ".";

const addr = process.env.NEXT_PUBLIC_ADDR;
const api = "/subject";
let token = "";

export interface Subject {
  id: number;
  title: string;
  description: string;
  video: string;
  questions: string[];
}

export function setToken(value: string) {
  token = value;
}
export function getToken() {
  return token;
}
export async function create(param: Omit<Subject, "id">) {
  const response = await fetch(`/api/subject`, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    method: "POST",
    body: JSON.stringify(param),
  });
  const data: ApiResponse = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
export async function update(param: Subject) {
  const response = await fetch(`/api/subject/` + param.id, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    method: "PUT",
    body: JSON.stringify(param),
  });
  const data: ApiResponse = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
export async function remove(param: Pick<Subject, "id">) {
  const response = await fetch(`/api/subject/` + param.id, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    method: "DELETE",
 });
  const data: ApiResponse = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
export async function list() {
  const response = await fetch(`/api/subject`, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    method: "GET"
  });
  const data: ApiResponse = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
export async function get(param: Subject) {
  const response = await fetch(`/api/subject/` + param.id, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    method: "GET"
  });
  const data: ApiResponse = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error.message, { cause: data.error.code });
  }
}
