import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Simple register called with:', body);
    
    // Minimal validation
    if (!body.email || !body.username || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Return success without database
    return NextResponse.json({
      success: true,
      message: 'Registration endpoint working (test mode)',
      received: {
        email: body.email,
        username: body.username,
        passwordLength: body.password.length
      }
    });
    
  } catch (error) {
    console.error('Simple register error:', error);
    return NextResponse.json(
      { 
        error: 'Server error', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Register API test endpoint is running',
    timestamp: new Date().toISOString()
  });
}