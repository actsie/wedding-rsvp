import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Site configuration can only be edited in development mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    const contentPath = join(process.cwd(), 'content', 'site.json')
    const currentContent = await readFile(contentPath, 'utf-8')
    const currentData = JSON.parse(currentContent)

    const updatedData = {
      ...currentData,
      ...body,
    }

    await writeFile(contentPath, JSON.stringify(updatedData, null, 2), 'utf-8')

    return NextResponse.json(
      {
        success: true,
        message: 'Site configuration saved successfully',
        data: updatedData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error saving site configuration:', error)
    return NextResponse.json(
      { error: 'Failed to save site configuration' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }

  try {
    const contentPath = join(process.cwd(), 'content', 'site.json')
    const content = await readFile(contentPath, 'utf-8')
    const data = JSON.parse(content)

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Error reading site configuration:', error)
    return NextResponse.json(
      { error: 'Failed to read site configuration' },
      { status: 500 }
    )
  }
}
