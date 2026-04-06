import type { NextConfig } from "next";

function getOptionalHttpsOrigin(hostOrUrl: string | undefined) {
  if (!hostOrUrl) {
    return null;
  }

  try {
    return new URL(hostOrUrl).origin;
  } catch {
    return `https://${hostOrUrl}`;
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const firebaseAuthFrameOrigin = getOptionalHttpsOrigin(
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    );
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://www.gstatic.com",
      "https://www.googleapis.com",
      "https://apis.google.com",
    ].join(" ");

    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://lh3.googleusercontent.com",
      "font-src 'self' data:",
      "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://www.gstatic.com",
      "media-src 'self' blob: data:",
      `frame-src 'self' https://accounts.google.com${firebaseAuthFrameOrigin ? ` ${firebaseAuthFrameOrigin}` : ""}`,
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
