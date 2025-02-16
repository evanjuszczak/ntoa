import { NextResponse } from 'next/server'

export const config = {
  matcher: '/api/:path*',
}

export default function middleware(request) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin')
  
  // Define allowed origins
  const allowedOrigins = [
    'https://ntoa.vercel.app',
    'https://ntoa-5diyil6s2-evans-projects-6bc84f56.vercel.app'
  ]

  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin)

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Credentials': 'true',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Clone the request headers to modify them
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-middleware-next', 'true')

  // Create the response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
} 