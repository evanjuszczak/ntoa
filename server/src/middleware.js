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

  // Handle actual requests
  const response = Response.next()
  
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
  
  return response
} 