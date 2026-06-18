"use client";

import { ApiResponse } from ".";
import { Subject } from "./subject";
import { User } from "./user";

const PORT = process.env.NEXT_PUBLIC_PORT;
const ADDR = process.env.NEXT_PUBLIC_ADDR;
const WS_ADDR = process.env.NEXT_PUBLIC_WS_ADDR;
const LOCAL = process.env.NEXT_PUBLIC_LOCAL;
const api = "/experiment";
let token = "";

export interface Experiment {
  id: number;

  image: string;
  title: string;
  description: string;

  questions: string[];
}

export interface Group {
  id: number;
  name: string;
  students: User[];
}

export function setToken(value: string) {
  token = value;
}
export function getToken() {
  return token;
}

export async function createLab(param: { admin_id?: number }) {
  const response = await fetch(`/api/experiment/lab`, {
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
    throw new Error(data.error!.message, { cause: data.error!.code });
  }
}

export async function removeLab(param: { id?: number }) {
  const response = await fetch(`/api/experiment/lab/` + param.id, {
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
    throw new Error(data.error!.message, { cause: data.error!.code });
  }
}

export async function create(param: Omit<Experiment, "id">) {
  const response = await fetch(`/api/experiment`, {
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
    throw new Error(data.error!.message, { cause: data.error!.code });
  }
}
export async function update(param: Experiment) {
  const response = await fetch(`/api/experiment/` + param.id, {
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
    throw new Error(data.error!.message, { cause: data.error!.code });
  }
}
export async function remove(param: Pick<Experiment, "id">) {
  const response = await fetch(`/api/experiment/` + param.id, {
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
    throw new Error(data.error!.message, { cause: data.error!.code });
  }
}
export async function list() {
  const response = await fetch(`/api/experiment`, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    method: "GET",
  });
  const data: ApiResponse = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error!.message, { cause: data.error!.code });
  }
}
export async function get(param: Pick<Experiment, "id">) {
  const response = await fetch(`/api/experiment/` + param.id, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    method: "GET",
  });
  const data: ApiResponse = await response.json();
  if (data?.success) {
    return data;
  } else {
    throw new Error(data.error!.message, { cause: data.error!.code });
  }
}

export class EventStream {
  url: string = "/api/event/experiment";
  // url: string = ADDR + "/event/experiment";
  connection?: Response;
  intervalid?: any;
  event: EventTarget = new EventTarget();
  aborter = new AbortController();
  constructor(param: {}) {}
  async connect() {
    if (this.connection) {
      console.warn("call connect while connection active");
      return;
    }
    try {
      this.connection = await fetch(this.url, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          accept: "text/event-stream",
          connection: "keep-alive",
          "cache-control": "no-cache",
        },
        mode: "cors",
        signal: this.aborter.signal,
      });
      // console.log(response);
      if (!this.connection.body) {
        throw new Error("response body undefined");
      }
      const decoder = new TextDecoderStream();
      this.event.addEventListener("open", this.onOpen);
      this.event.addEventListener("error", this.onError);
      this.event.addEventListener("message", this.onMessage);
      for await (const chunk of this.connection.body.pipeThrough(decoder)) {
        try {
          const eol = chunk.search("\n");
          const type = chunk.substring(6, eol);
          const data = chunk.substring(eol + 6, chunk.length - 2);
          // console.dir(type);
          // console.dir(data);
          console.log("[event stream]", type, data);
          switch (type) {
            case "create":
              this.onCreate(JSON.parse(data));
              break;
            case "delete":
              this.onDelete(JSON.parse(data));
              break;
            case "sync":
              this.onStart(JSON.parse(data));
              break;
            case "error":
              this.event.dispatchEvent(
                new ErrorEvent("error", { error: JSON.parse(data) }),
              );
              break;
            default:
              this.event.dispatchEvent(
                new MessageEvent("message", { data: JSON.parse(data) }),
              );
              break;
          }
        } catch (error) {
          this.event.dispatchEvent(new ErrorEvent("error", { error }));
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "disconnect":
          case "BodyStreamBuffer was aborted":
            return;
          case "network error":
            this.disconnect();
            this.reconnect();
            return;
        }
      }
      throw error;
      // this.event.dispatchEvent(new ErrorEvent("error", { error }));
    }
  }
  disconnect() {
    this.aborter.abort(new Error("disconnect"));
    this.aborter = new AbortController();
    if (!this.connection) {
      console.warn("call disconnect while connection unactive");
      return;
    }
    // if (!this.connection.body) {
    //   throw new Error("response body undefined");
    // }
    // this.connection.body.cancel();
    this.event.removeEventListener("open", this.onOpen);
    this.event.removeEventListener("error", this.onError);
    this.event.removeEventListener("message", this.onMessage);
    delete this.connection;
  }
  reconnect() {
    if (this.connection) {
      console.warn("call reconnect while connection active");
      return;
    }
    if (this.intervalid) {
      console.warn("call reconnect while reconnection");
      return;
    }
    let count = 0;
    this.intervalid = setInterval(() => {
      if (this.connection) {
        clearInterval(this.intervalid);
        delete this.intervalid;
        return;
      }
      count++;
      if (count > 1) {
        clearInterval(this.intervalid);
        delete this.intervalid;
        setTimeout(() => {
          this.reconnect();
        }, 1e3 * 60);
      } else {
        console.warn("reconnecting", count);
        this.connect();
      }
    }, 1e3 * 5);
  }
  onOpen = (event: Event) => {
    console.log("onOpen:", event);
  };
  onMessage = (event: Event) => {
    console.log("onMessage:", event);
  };
  onError = (event: Event) => {
    console.log("onError:", event);
  };
  onClose = (event: CloseEvent) => {
    console.log("onClose:", event);
  };

  onCreate = (experiment: Experiment) => {};
  onDelete = (experiment: Experiment) => {};
  onStart = (data: { count: number }) => {};
}

export interface ExperimentSync {
  attr: string;
  teachers?: User[];
  students?: User[];
  groups?: Group[];
  subject?: Subject;
  status?: string;

  questions?: string[];
  answers?: string[];
  simulation?: { [p: string]: any };
  collections?: any[];
  conclusion?: string;
}
export interface ExperimentMessage {
  type:
    | "join"
    | "leave"
    | "sync"
    | "destroy"
    | "kick"
    | "error"
    | "request"
    | "response"
    | "publish"
    | "message";
  attr?: string;
  teachers?: User[];
  students?: User[];
  groups?: Group[];
  user?: User;
  subject?: Subject;
  status?: string;

  questions?: string[];
  answers?: string[];
  simulation?: { [p: string]: any };
  collections?: any[];
  conclusion?: string;

  error?: { code: string; message: string };

  requestPath?: string;
  requestBody?: object;
  responsePath?: string;
  responseBody?: object;
  publishPath?: string;
  publishBody?: object;
  messagePath?: string;
  messageBody?: object;
}
export interface ExperimentMessageError {
  type: string;
  attr?: string;
  subject?: Subject;
  status?: string;
  error: { code: string; message: string };
}
export class Collaboration {
  lab: number = 0;
  // url: string = "/api/message/experiment/";
  url: string = WS_ADDR + "/message/experiment/";
  connection?: WebSocket;
  intervalid: any;
  retry = true;
  timeout = 1e3 * 5;
  constructor(param: {}) {
    // if (location.hostname != "localhost") {
    // const base = `ws://${location.hostname}:${PORT}`;
    // console.log("base", base);
    // }
    let protocol = "ws";
    let port = PORT;
    if (!LOCAL) {
      if (isSecureContext) {
        protocol = "wss";
      }
      port = location.port;
    }
    this.url = `${protocol}://${location.hostname}:${port}/message/experiment/`;
  }
  connect() {
    if (this.connection) {
      console.warn("call connect while connection active");
      return;
    }
    this.connection = new WebSocket(this.url + this.lab);
    this.connection.addEventListener("open", this.onOpen);
    this.connection.addEventListener("message", this.onMessage);
    this.connection.addEventListener("close", this.onClose);
    this.connection.addEventListener("error", this.onError);
  }
  disconnect() {
    if (!this.connection) {
      console.warn("call disconnect while connection unactive");
      return;
    }
    this.connection.close();
    this.connection.removeEventListener("open", this.onOpen);
    this.connection.removeEventListener("message", this.onMessage);
    this.connection.removeEventListener("close", this.onClose);
    this.connection.removeEventListener("error", this.onError);
    delete this.connection;
  }
  reconnect() {
    clearTimeout(this.intervalid);
    this.intervalid = setTimeout(() => {
      this.disconnect();
      this.connect();
    }, this.timeout);
  }
  send(message: object) {
    if (!this.connection) {
      console.warn("call send while connection unactive");
      return;
    }
    // console.log("send:", message);
    const payload = JSON.stringify(message);
    this.connection.send(payload);
  }
  onOpen = (event: Event) => {
    // console.log("onOpen:", event);
    this.send({ authorization: token });
    this.onConnected();
  };
  onMessage = async (event: MessageEvent<string>) => {
    // console.log("onMessage:", event);
    if (typeof event.data == "string") {
      const message: ExperimentMessage = JSON.parse(event.data);
      if (typeof message == "object") {
        switch (message.type) {
          case "join":
            this.onJoin(message.user!);
            break;
          case "leave":
            this.onLeave(message.user!);
            break;
          case "kick":
            this.onKick(message as ExperimentSync);
            break;
          case "destroy":
            this.onDestroy();
            break;
          case "sync":
            this.onSync(message as ExperimentSync);
            break;
          case "error":
            this.onFailed(message as ExperimentMessageError);
            break;
          case "response":
            const [, id] = message.responsePath!.split(":");
            const promiser = this.session_get(id);
            if (!promiser) {
              console.warn("response ghost");
            } else {
              promiser.resolve(message.responseBody);
            }
            break;
          case "message":
            const subscribers = this.subscribers.get(message.messagePath!);
            if (!subscribers) {
              console.warn("message ghost");
            } else {
              for (const subscriber of subscribers) {
                await subscriber(message.messageBody);
              }
            }
            break;
          default:
            // @ts-ignore
            if (message.code == "UNAUTHORIZED") {
              this.onFailed({
                type: "error",
                error: message as any,
              });
              this.retry = false;
              this.disconnect();
              this.retry = false;
              break;
            }
            throw new Error("unknown format");
            break;
        }
      } else {
        throw new Error("unknown message type");
      }
    } else {
      throw new Error("unknown message data");
    }
  };
  onClose = (event: CloseEvent) => {
    // console.log("onClose:", event);
    this.onDisconnected();
    if (event.isTrusted && this.retry) {
      this.onRetry();
      this.reconnect();
    }
    // this.disconnect();
    // if (event.type == "close" && !this.intervalid) {
    //   this.onRetry();
    //   this.intervalid = setTimeout(() => {
    //     this.connect();
    //   }, 1e3 * 5);
    // }
  };
  onError = (event: ErrorEvent) => {
    // console.log("onError:", event);
    console.error(event.error);
  };

  onConnected() {
    console.warn("onConnected not implemented");
  }
  onDisconnected() {
    console.warn("onDisconnected not implemented");
  }
  onRetry() {
    console.warn("onRetry not implemented");
  }
  onJoin(user: User) {
    console.warn("onJoin not implemented");
  }
  onLeave(user: User) {
    console.warn("onLeave not implemented");
  }
  onKick(experiment: ExperimentSync) {
    console.warn("onLeave not implemented");
  }
  onDestroy() {
    console.warn("onDestroy not implemented");
  }
  onSync(experiment: ExperimentSync) {
    console.warn("onSync not implemented");
  }
  onFailed(message: ExperimentMessageError) {
    console.warn("onSync not implemented");
  }

  sync(experiment: Partial<ExperimentSync>) {
    const message: ExperimentMessage = {
      type: "sync",
      attr: experiment.attr ?? "groups",
      groups: experiment.groups,
      subject: experiment.subject,
      teachers: experiment.teachers,
      students: experiment.students,
      status: experiment.status,
      questions: experiment.questions,
      answers: experiment.answers,
      simulation: experiment.simulation,
      collections: experiment.collections,
      conclusion: experiment.conclusion,
    };
    this.send(message);
  }
  kick(user: User) {
    const message: ExperimentMessage = {
      type: "kick",
      user: user,
    };
    this.send(message);
  }
  session_id = 0;
  session_map = new Map<string, Promiser>();
  session_gen() {
    const id = ++this.session_id + "";
    const promiser: Promiser = {
      id,
      ...Promise.withResolvers(),
    };
    this.session_map.set(id, promiser);
    return promiser;
  }
  session_get(id: string) {
    const promiser = this.session_map.get(id);
    if (promiser) {
      return promiser;
    }
  }
  subscribers = new Map<string, Set<Subscriber>>();
  request(path: string, body: any) {
    const session = this.session_gen();
    const message: ExperimentMessage = {
      type: "request",
      requestPath: `${path}:${session.id}`,
      requestBody: body,
    };
    this.send(message);
    return session.promise;
  }
  subscribe(path: string, handler: Subscriber) {
    let subscribers = this.subscribers.get(path);
    if (subscribers) {
      subscribers.add(handler);
    } else {
      subscribers = new Set([handler]);
      this.subscribers.set(path, subscribers);
    }
  }
  unsubscribe(path: string, handler: Subscriber) {
    let subscribers = this.subscribers.get(path);
    if (subscribers) {
      subscribers.delete(handler);
    } else {
      console.warn("unsubscribe ghost");
    }
  }
  publish(path: string, body: any) {
    const message: ExperimentMessage = {
      type: "publish",
      publishPath: path,
      publishBody: body,
    };
    this.send(message);
  }
}

interface Promiser {
  id: string;
  promise: Promise<any>;
  resolve(value: any): void;
  reject(reason: Error): void;
}
type Subscriber = (message: any) => any | Promise<any>;

export const event = new EventStream({});
export const collaboration = new Collaboration({});
