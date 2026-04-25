import { NextRequest, NextResponse } from 'next/server'
import { POST as runMonitorPost } from '../monitor/route'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const headers = new Headers(req.headers)
  const secret = process.env.MONITOR_API_SECRET
  if (secret && !headers.has('x-monitor-secret')) {
    headers.set('x-monitor-secret', secret)
  }

  const forwardedReq = new NextRequest(new URL('/api/monitor', req.url), {
    method: 'POST',
    headers,
  })

  return runMonitorPost(forwardedReq)
}

export async function GET(req: NextRequest) {
  return POST(req)
}
