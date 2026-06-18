import { NextRequest, NextResponse } from "next/server";

const ADDR = process.env.ADDR!;
const API_ADDR = process.env.API_ADDR!;

if (!ADDR && !API_ADDR) {
  throw new Error("env not found");
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ rest: string[] }> },
) {
  console.log("[HEAD]", request.url);
  return fetch(request.url.replace(/^.*\/api/, API_ADDR), {
    method: "GET",
    headers: request.headers,
  });
}
export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ rest: string[] }> },
) {
  console.log("[OPTIONS]", request.url);
  return fetch(request.url.replace(/^.*\/api/, API_ADDR), {
    method: "GET",
    headers: request.headers,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ rest: string[] }> },
) {
  console.log("[request]", request.url);
  try {
    if (request.headers.has("upgrade")) {
      console.log("[upgrade]", request.url);
      const ws = new WebSocket(request.url.replace(/^.*\/api/, API_ADDR));
      ws.addEventListener("open", (event) => {
        console.log("[websocket] open");
      });
      ws.addEventListener("message", (event) => {
        console.log("[websocket] message");
      });
      ws.addEventListener("error", (event) => {
        console.log("[websocket] error");
      });
      ws.addEventListener("close", (event) => {
        console.log("[websocket] close");
      });
    } else {
      return fetch(request.url.replace(/^.*\/api/, API_ADDR), {
        method: "GET",
        headers: request.headers,
      });
    }
  } catch (error: any) {
    console.error(error);
    return Response.json(
      {
        success: false,
        error: { message: error.message },
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ rest: string[] }> },
) {
  try {
    // const [cloned] = request.body!.tee();
    // const transform = new TransformStream();
    // request.body!.pipeThrough(transform);
    return await fetch(request.url.replace(/^.*\/api/, API_ADDR), {
      method: "POST",
      headers: request.headers,
      body: await request.blob(),
      // body: cloned,
      // body: transform.readable,
      // duplex: "half",
    });
  } catch (error: any) {
    console.error(error);
    return Response.json(
      {
        success: false,
        error: { message: error.message },
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ rest: string[] }> },
) {
  try {
    const [cloned] = request.body!.tee();
    // const transform = new TransformStream();
    // request.body!.pipeThrough(transform);
    return await fetch(request.url.replace(/^.*\/api/, API_ADDR), {
      method: "PUT",
      headers: request.headers,
      body: cloned,
      // body: transform.readable,
      // // @ts-expect-error ___
      // duplex: "half",
    });
  } catch (error: any) {
    console.error(error);
    return Response.json(
      {
        success: false,
        error: { message: error.message },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ rest: string[] }> },
) {
  try {
    return await fetch(request.url.replace(/^.*\/api/, API_ADDR), {
      method: "DELETE",
      headers: request.headers,
    });
  } catch (error: any) {
    console.error(error);
    return Response.json(
      {
        success: false,
        error: { message: error.message },
      },
      { status: 500 },
    );
  }
}
