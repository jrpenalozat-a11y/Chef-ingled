import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Son datos de salud de una persona real: nada de esto se indexa.
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        // El service worker debe poder controlar toda la app, no solo /
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default config
