import { NextRequest, NextResponse } from 'next/server'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${PYTHON_API_URL}/gesture-descriptions`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch gesture descriptions' },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error fetching gesture descriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


