import type { CollectionConfig } from 'payload'
import fs from 'fs'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
      validate: () => true as const,
      admin: {
        description: 'Alt text for accessibility (auto-generated from filename if empty)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
      validate: () => true as const,
      admin: {
        description: 'Optional image caption',
      },
    },
    {
      name: 'fileData',
      type: 'text',
      required: false,
      maxLength: 50000000,
      validate: () => true as const,
      admin: {
        hidden: true,
      },
    },
  ],
  upload: {
    // Disable saving files to local disk so Vercel serverless / read-only filesystem never throws EROFS
    disableLocalStorage: true,
    mimeTypes: ['image/*'],
    crop: true,
    focalPoint: true,
    displayPreview: true,
    adminThumbnail: ({ doc }) => {
      const d = doc as any
      return d?.url || (d?.filename ? `/api/media/file/${d.filename}` : null)
    },
    handlers: [
      async (req: any, args: any) => {
        const filename = args?.params?.filename || req?.routeParams?.filename
        let fileDoc = args?.doc && typeof args.doc === 'object' ? args.doc : null

        if (!fileDoc?.fileData && !fileDoc?.file_data && filename && req?.payload) {
          try {
            const cleanName = decodeURIComponent(filename)
            const isId = !isNaN(Number(cleanName))
            const result = await req.payload.find({
              collection: 'media',
              where: isId
                ? { id: { equals: Number(cleanName) } }
                : { filename: { equals: cleanName } },
              limit: 1,
              pagination: false,
            })
            fileDoc = result?.docs?.[0] || null
          } catch (e) {
            req.payload?.logger?.error?.(e)
          }
        }

        const base64Data = fileDoc?.fileData || fileDoc?.file_data
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64')
          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': fileDoc.mimeType || fileDoc.mime_type || 'image/jpeg',
              'Content-Length': buffer.length.toString(),
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        }
        return new Response('Not Found', { status: 404 })
      },
    ],
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (data) {
          if (!data.alt && data.filename) {
            data.alt = data.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
          }
          if (!data.alt && (req as any)?.file?.name) {
            data.alt = (req as any).file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        if (data) {
          if (!data.alt && data.filename) {
            data.alt = data.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
          }
          // Set canonical file URL if not already assigned
          if (data.filename && !data.url) {
            data.url = `/api/media/file/${data.filename}`
          }

          // Capture file buffer and persist to fileData base64 text field in PostgreSQL
          const fileObj = (req as any)?.file
          if (fileObj?.data && Buffer.isBuffer(fileObj.data)) {
            data.fileData = fileObj.data.toString('base64')
          } else if (fileObj?.tempFilePath) {
            try {
              const buf = await fs.promises.readFile(fileObj.tempFilePath)
              data.fileData = buf.toString('base64')
            } catch {
              // Ignore temp file read error if already cleaned up
            }
          }
        }
        return data
      },
    ],
  },
}
