import { NextResponse } from 'next/server'

export const config = {
  matcher: '/api/:path*',
}

export default function middleware(request) {
  const response = NextResponse.next()
  
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', 'https://ntoa.vercel.app')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
} 