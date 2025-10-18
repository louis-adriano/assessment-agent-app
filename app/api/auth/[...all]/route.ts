// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/config"
import { NextRequest } from "next/server"

export const GET = auth.handler
export const POST = auth.handler

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}