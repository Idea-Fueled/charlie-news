import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params
    if (!filename) {
      return new Response('Filename required', { status: 400 })
    }

    const payload = await getPayload({ config })
    const isId = !isNaN(Number(filename))

    const result = await payload.find({
      collection: 'media',
      where: isId
        ? { id: { equals: Number(filename) } }
        : { filename: { equals: decodeURIComponent(filename) } },
      limit: 1,
      pagination: false,
    })

    const doc = result?.docs?.[0] as any
    const base64Data = doc?.fileData || doc?.file_data

    if (base64Data) {
      const buffer = Buffer.from(base64Data, 'base64')
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': doc.mimeType || doc.mime_type || 'image/jpeg',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    return new Response('File not found', { status: 404 })
  } catch (error) {
    console.error('Error serving media file:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
