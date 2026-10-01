import { getPayload } from 'payload'
import config from '@/payload.config'

export interface CleanPage {
  id: string | number
  title: string
  slug: string
  privacyPolicy?: any
  termsOfUse?: any
  updatedAt?: string
}

/**
 * Fetch a CMS page by slug (e.g. 'privacy-terms')
 */
export async function getPageBySlug(slug: string): Promise<CleanPage | null> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const res = await payload.find({
      collection: 'pages' as any,
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
    })

    if (res.docs && res.docs.length > 0) {
      const doc = res.docs[0] as any
      return {
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        privacyPolicy: doc.privacyPolicy,
        termsOfUse: doc.termsOfUse,
        updatedAt: doc.updatedAt,
      }
    }
  } catch (err) {
    console.error('Error fetching page from Payload:', err)
  }

  return null
}
