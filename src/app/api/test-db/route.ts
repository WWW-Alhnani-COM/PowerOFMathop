import { createClient } from '@utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies();  // Await here
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .limit(5)

    if (error) {
      return Response.json(
        {
          success: false,
          message: 'Database query failed',
          error: error.message,
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Database connected successfully',
      data,
    })
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        message: 'Server error',
        error: err.message,
      },
      { status: 500 }
    )
  }
}