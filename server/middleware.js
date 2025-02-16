export const config = {
  matcher: '/api/:path*',
}

export default function middleware(request) {
  const origin = request.headers.get('origin')
  const allowedOrigin = 'https://ntoa.vercel.app'

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // For health check endpoint, bypass authentication
  if (request.url.endsWith('/health')) {
    return Response.next()
  }

  // For all other requests, continue to the next middleware/route handler
  return Response.next()
} 