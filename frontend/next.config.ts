import type { NextConfig } from "next";

// Where the Next.js server forwards /api/* requests. The browser only ever
// calls same-origin /api, so there are no CORS or HTTP/HTTPS mixed-content
// problems on phones or in production. On Render, set BACKEND_URL to the
// backend's public https://<name>.onrender.com address (read at build time).
const BACKEND_URL = (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Next.js blocks dev assets and the HMR websocket for any origin other than
  // localhost. Without this, phones opening http://<LAN-IP>:3000 get 403s on
  // JS chunks, React never hydrates, and only native inputs respond to touch.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],

  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
