"use client";

import { useEffect, useState } from "react";

export type WebGLStatus = "checking" | "supported" | "unsupported";

let cached: WebGLStatus | null = null;

function detect(): WebGLStatus {
  if (cached) return cached;
  try {
    // Allow forcing the fallback for QA: ?webgl=off
    if (new URLSearchParams(window.location.search).get("webgl") === "off") return (cached = "unsupported");
    // three.js (r163+) renders with WebGL2 only; WebGL1-only devices get the 2D fallback.
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    cached = gl ? "supported" : "unsupported";
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = "unsupported";
  }
  return cached;
}

/**
 * Detects WebGL on the client. Starts as "checking" so server and first client
 * render agree, then resolves after mount.
 */
export function useWebGLSupport(): WebGLStatus {
  const [status, setStatus] = useState<WebGLStatus>("checking");
  useEffect(() => {
    // Deferred to a frame so the effect body doesn't set state synchronously.
    const id = requestAnimationFrame(() => setStatus(detect()));
    return () => cancelAnimationFrame(id);
  }, []);
  return status;
}
