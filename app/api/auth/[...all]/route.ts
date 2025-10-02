// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/config"

export const GET = auth.handler
export const POST = auth.handler