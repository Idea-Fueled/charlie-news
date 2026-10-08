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
 * Includes resilient alias resolution and fallback for legal pages
 */
export async function getPageBySlug(slug: string): Promise<CleanPage | null> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // 1. Try direct exact slug match
    let res = await payload.find({
      collection: 'pages' as any,
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
      depth: 0,
    })

    // 2. If querying for privacy/terms, check common aliases in case admin edited the CMS slug
    if ((!res.docs || res.docs.length === 0) && (slug === 'privacy-terms' || slug === 'privacy-policy')) {
      const aliasSlugs =
        slug === 'privacy-terms'
          ? ['privacy-policy', 'privacy-and-terms', 'privacy', 'terms']
          : ['privacy-terms', 'privacy-and-terms', 'privacy', 'terms']

      res = await payload.find({
        collection: 'pages' as any,
        where: {
          slug: {
            in: aliasSlugs,
          },
        },
        limit: 1,
        depth: 0,
      })
    }

    // 3. Fallback: if querying for privacy-terms and still not found, load the primary Pages document
    if ((!res.docs || res.docs.length === 0) && (slug === 'privacy-terms' || slug === 'privacy-policy')) {
      res = await payload.find({
        collection: 'pages' as any,
        limit: 1,
        depth: 0,
      })
    }

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

/**
 * Dedicated helper to retrieve the Privacy Policy & Terms of Use CMS document
 */
export async function getPrivacyTermsPage(): Promise<CleanPage | null> {
  return getPageBySlug('privacy-terms')
}
