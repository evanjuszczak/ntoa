import { NextResponse } from 'next/server'

export const config = {
  matcher: '/api/:path*',
}

export default function middleware(request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://ntoa.vercel.app',
    'https://ntoa-5diyil6s2-evans-projects-6bc84f56.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5175',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175'
  ]
  const isAllowedOrigin = allowedOrigins.includes(origin)

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Forward the request to the destination
  const response = NextResponse.next()
  
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : allowedOrigins[0])
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
  
  return response
} 