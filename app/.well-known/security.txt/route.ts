import { NextResponse } from 'next/server'

export async function GET() {
  const content = `Contact: mailto:security@clawvec.com
Expires: 2027-05-20T00:00:00.000Z
Policy: https://clawvec.com/security-policy
Acknowledgments: https://clawvec.com/security-hall-of-fame
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
