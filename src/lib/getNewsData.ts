import { getPayload } from 'payload'
import config from '@/payload.config'
import { DEMO_ARTICLES, DemoArticle } from './demoArticles'

export interface CleanSection {
  id?: number | string
  name: string
  slug: string
  description?: string | null
  menuOrder?: number
}

export interface CleanArticle {
  id: string | number
  headline: string
  slug: string
  summary: string
  seoDescription?: string | null
  body?: any
  bodyText?: string[]
  publishedAt?: string | null
  createdAt?: string
  section: CleanSection
  image?: {
    url?: string | null
    width?: number | null
    height?: number | null
    source?: string | null
  } | null
  imageAlt?: string | null
  imageCredit?: {
    name?: string | null
    link?: string | null
  } | null
  isDemo?: boolean
}

export type ArticleLookupResult =
  | { type: 'found'; article: CleanArticle }
  | { type: 'redirect'; targetUrl: string }
  | { type: 'notFound' }

function mapDocToCleanArticle(doc: any): CleanArticle {
  const sec =
    typeof doc.section === 'object' && doc.section !== null
      ? {
          id: doc.section.id,
          name: doc.section.name || 'Property',
          slug: doc.section.slug || 'property',
          description: doc.section.description || null,
        }
      : {
          id: doc.section,
          name: 'Property',
          slug: 'property',
          description: null,
        }

  return {
    id: doc.id,
    headline: doc.headline,
    slug: doc.slug,
    summary: doc.summary,
    seoDescription: doc.seoDescription || null,
    body: doc.body,
    publishedAt: doc.publishedAt || null,
    createdAt: doc.createdAt || null,
    section: sec,
    image: doc.image || null,
    imageAlt: doc.imageAlt || null,
    imageCredit: doc.imageCredit || null,
    isDemo: false,
  }
}

/**
 * Fetch all active sections ordered by menuOrder
 */
export async function getActiveSections(): Promise<CleanSection[]> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const res = await payload.find({
      collection: 'sections',
      where: {
        status: {
          equals: 'Active',
        },
      },
      sort: 'menuOrder',
      limit: 100,
    })

    if (res.docs && res.docs.length > 0) {
      return res.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        slug: doc.slug,
        description: doc.description || null,
        menuOrder: doc.menuOrder || 0,
      }))
    }
  } catch (err) {
    console.error('Error fetching sections from Payload:', err)
  }

  // Fallback default sections from SOW if db is initializing
  return [
    {
      id: 1,
      name: 'Renovation',
      slug: 'renovation',
      description: 'Home renovation ideas, costs, trends, materials, and approvals in Australia.',
      menuOrder: 1,
    },
    {
      id: 2,
      name: 'Politics',
      slug: 'politics',
      description: 'Australian federal, state, and local government decisions that affect housing, property, renters, and buyers.',
      menuOrder: 2,
    },
  ]
}

/**
 * Fetch all published articles sorted newest first (for Homepage hero and latest grid)
 */
export async function getAllPublishedArticles(
  limit = 50,
): Promise<{ articles: CleanArticle[]; isDemo: boolean }> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const res = await payload.find({
      collection: 'articles',
      where: {
        status: {
          equals: 'Published',
        },
      },
      sort: '-publishedAt',
      limit,
      depth: 1,
    })

    if (res.docs && res.docs.length > 0) {
      return {
        articles: res.docs.map(mapDocToCleanArticle),
        isDemo: false,
      }
    }
  } catch (err) {
    console.error('Error fetching articles from Payload:', err)
  }

  // If no published articles yet, return curated demo articles
  const demoList: CleanArticle[] = DEMO_ARTICLES.map((d) => ({
    ...d,
    isDemo: true,
  }))

  return { articles: demoList, isDemo: true }
}

/**
 * Fetch published articles for a specific section with pagination support
 */
export async function getArticlesBySection(
  sectionSlug: string,
  page = 1,
  limit = 12,
): Promise<{
  articles: CleanArticle[]
  totalPages: number
  currentPage: number
  totalDocs: number
  section: CleanSection | null
  isDemo: boolean
}> {
  try {
    const sections = await getActiveSections()
    const section =
      sections.find((s) => s.slug.toLowerCase() === sectionSlug.toLowerCase()) || null

    if (!section) {
      return {
        articles: [],
        totalPages: 1,
        currentPage: 1,
        totalDocs: 0,
        section: null,
        isDemo: false,
      }
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const res = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'Published' } },
          { section: { equals: section.id } },
        ],
      },
      sort: '-publishedAt',
      limit,
      page,
      depth: 1,
    })

    if (res.docs && res.docs.length > 0) {
      return {
        articles: res.docs.map(mapDocToCleanArticle),
        totalPages: res.totalPages || 1,
        currentPage: res.page || page,
        totalDocs: res.totalDocs || res.docs.length,
        section,
        isDemo: false,
      }
    }

    // Check if there are any published articles in the entire database
    const totalPublishedCount = await payload.count({
      collection: 'articles',
      where: {
        status: { equals: 'Published' },
      },
    })

    // If there ARE published articles in DB, but this section has 0, return empty (shows coming soon)
    if (totalPublishedCount.totalDocs > 0) {
      return {
        articles: [],
        totalPages: 1,
        currentPage: 1,
        totalDocs: 0,
        section,
        isDemo: false,
      }
    }
  } catch (err) {
    console.error('Error fetching section articles from Payload:', err)
  }

  // Fallback to demo articles during initial setup preview
  const demoList = DEMO_ARTICLES.filter(
    (a) => a.section?.slug?.toLowerCase() === sectionSlug.toLowerCase(),
  ).map((d) => ({ ...d, isDemo: true }))

  return {
    articles: demoList,
    totalPages: 1,
    currentPage: 1,
    totalDocs: demoList.length,
    section: {
      id: sectionSlug === 'politics' ? 2 : 1,
      name: sectionSlug.charAt(0).toUpperCase() + sectionSlug.slice(1),
      slug: sectionSlug,
    },
    isDemo: true,
  }
}

/**
 * Fetch a single article by slug, checking canonical slug first, then oldSlugs for 301 redirect
 */
export async function getArticleBySlugOrRedirect(
  sectionSlug: string,
  articleSlug: string,
): Promise<ArticleLookupResult> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // 1. Direct canonical slug match
    const res = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'Published' } },
          { slug: { equals: articleSlug } },
        ],
      },
      limit: 1,
      depth: 1,
    })

    if (res.docs && res.docs.length > 0) {
      const clean = mapDocToCleanArticle(res.docs[0])
      // If the URL section slug does not match canonical section, redirect
      if (
        clean.section.slug &&
        clean.section.slug.toLowerCase() !== sectionSlug.toLowerCase()
      ) {
        return {
          type: 'redirect',
          targetUrl: `/${clean.section.slug}/${clean.slug}`,
        }
      }
      return { type: 'found', article: clean }
    }

    // 2. Check oldSlugs (SOW 4.4 redirect requirements)
    const oldSlugRes = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'Published' } },
          { 'oldSlugs.slug': { equals: articleSlug } },
        ],
      },
      limit: 1,
      depth: 1,
    })

    if (oldSlugRes.docs && oldSlugRes.docs.length > 0) {
      const clean = mapDocToCleanArticle(oldSlugRes.docs[0])
      const canonicalSection = clean.section.slug || sectionSlug
      return {
        type: 'redirect',
        targetUrl: `/${canonicalSection}/${clean.slug}`,
      }
    }
  } catch (err) {
    console.error('Error fetching article by slug from Payload:', err)
  }

  // 3. Check demo articles fallback
  const demoMatch = DEMO_ARTICLES.find(
    (a) =>
      a.slug === articleSlug &&
      a.section?.slug?.toLowerCase() === sectionSlug.toLowerCase(),
  )

  if (demoMatch) {
    return {
      type: 'found',
      article: { ...demoMatch, isDemo: true },
    }
  }

  return { type: 'notFound' }
}

/**
 * Backward compatibility wrapper
 */
export async function getArticleBySlug(
  sectionSlug: string,
  articleSlug: string,
): Promise<CleanArticle | null> {
  const result = await getArticleBySlugOrRedirect(sectionSlug, articleSlug)
  if (result.type === 'found') {
    return result.article
  }
  return null
}

