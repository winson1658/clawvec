import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const forwarded = new Request(new URL(`../`, request.url), {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ ...body, action: 'message' }),
  });

  const mod = await import('../route');
  return mod.POST(forwarded, { params: Promise.resolve({ id }) });
}
