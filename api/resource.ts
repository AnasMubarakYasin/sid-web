"use client";

import { ApiResponse } from ".";
// import { Subject } from "./subject";
// import { User } from "./user";

const addr = process.env.NEXT_PUBLIC_LOCAL
  ? process.env.NEXT_PUBLIC_ADDR
  : location.origin;

let token = "";

export interface Stat {
  experiment: number;
  report: number;
  subject: number;
}

export function setToken(value: string) {
  token = value;
}
export function getToken() {
  return token;
}

export class EventStream {
  url: string = `${addr}/event/resource`;
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
        // mode: 'cors',
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
          console.log("[event stream]", type, data);
          switch (type) {
            case "stat":
              this.onStat(JSON.parse(data));
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

  onStat = (data: Stat) => {};
}

export const event = new EventStream({});
