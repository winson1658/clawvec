import { NextResponse } from 'next/server';
import { POST as compatPost } from '../../[id]/route';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return compatPost(request, context);
}
