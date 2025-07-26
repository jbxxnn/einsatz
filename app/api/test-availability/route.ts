import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const freelancerId = url.searchParams.get("freelancerId")
  const date = url.searchParams.get("date")
  const categoryId = url.searchParams.get("categoryId")

  return NextResponse.json({
    message: "Test availability endpoint working",
    params: {
      freelancerId,
      date,
      categoryId
    },
    mockData: {
      availabilityBlocks: [
        {
          id: "test-block-1",
          start: "09:00",
          end: "17:00",
          availableStartTimes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          certainty_level: "guaranteed",
          is_recurring: false,
          recurrence_pattern: null,
        }
      ]
    }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      message: "Test availability POST endpoint working",
      receivedData: body,
      mockSlots: [
        {
          start: "09:00",
          end: "10:00",
          startTime: "2024-01-15T09:00:00.000Z",
          endTime: "2024-01-15T10:00:00.000Z"
        },
        {
          start: "10:00",
          end: "11:00",
          startTime: "2024-01-15T10:00:00.000Z",
          endTime: "2024-01-15T11:00:00.000Z"
        }
      ],
      totalSlots: 2
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to parse request body",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 })
  }
} 