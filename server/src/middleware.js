import { NextResponse } from 'next/server'

export const config = {
  matcher: '/:path*',
}

export default function middleware(request) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin')
  const isPreflight = request.method === 'OPTIONS'

  // Create response object (preflight or pass-through)
  const response = isPreflight 
    ? new Response(null, { status: 204 })
    : NextResponse.next()

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://ntoa.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }

  // Apply headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
} 