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
      admin: {
        description: 'Alt text for accessibility (auto-generated from filename if empty)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional image caption',
      },
    },
    {
      name: 'fileData',
      type: 'text',
      required: false,
      admin: {
        hidden: true,
      },
    },
  ],
  upload: {
    // Disable saving files to local disk so Vercel serverless / read-only filesystem never throws EROFS
    disableLocalStorage: true,
    mimeTypes: ['image/*'],
    adminThumbnail: ({ doc }) => {
      const d = doc as any
      return d?.url || (d?.filename ? `/api/media/file/${d.filename}` : null)
    },
    handlers: [
      async (_req: any, { doc }: any) => {
        const fileDoc = doc as any
        const base64Data = fileDoc?.fileData || fileDoc?.file_data
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64')
          return new Response(buffer, {
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
