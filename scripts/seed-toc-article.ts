import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function run() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Find Renovation section
  const sections = await payload.find({
    collection: 'sections',
    where: {
      slug: { equals: 'renovation' },
    },
    limit: 1,
  })

  if (!sections.docs.length) {
    console.error('Renovation section not found')
    process.exit(1)
  }

  const renovationId = sections.docs[0].id

  // Article with multiple H2s and one duplicate H2 to test deduplication
  const articleData = {
    headline: 'Smart Renovation Guide: Maximizing ROI in 2026',
    slug: 'smart-renovation-guide-maximizing-roi-2026',
    summary: 'Essential strategies for Australian homeowners looking to boost property value through targeted, energy-efficient renovations in 2026.',
    seoDescription: 'Comprehensive 2026 guide to smart home renovations, return on investment, and high-impact upgrades in the Australian property market.',
    section: renovationId,
    status: 'Published' as const,
    publishedAt: new Date().toISOString(),
    image: {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      source: 'Unsplash' as const,
    },
    imageAlt: 'Modern renovated home interior with open plan kitchen and living area',
    imageCredit: {
      name: 'Sarah Jenkins',
      link: 'https://unsplash.com',
    },
    body: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Home renovation in 2026 is no longer just about aesthetic appeal; it is a calculated financial decision driven by energy efficiency, climate resilience, and functional living space.',
                version: 1,
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Key Takeaways',
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Kitchens and bathrooms continue to deliver the highest percentage return on investment, averaging 70-80% recouped cost upon sale. Sustainable materials and solar integration now rank as top buyer prerequisites across Sydney, Melbourne, and Brisbane.',
                version: 1,
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'High-Value Upgrades for Australian Homes',
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Focusing on indoor-outdoor connectivity delivers outsized returns in the Australian climate. Bi-fold glass doors, sheltered alfresco dining spaces, and outdoor kitchens consistently attract premium appraisals.',
                version: 1,
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Cost Versus Value Analysis',
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Before breaking ground, homeowners should establish a clear 15% contingency buffer. Labor shortages and council planning approvals can significantly stretch timelines if not factored in early.',
                version: 1,
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h2',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Key Takeaways',
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Summary conclusion: always verify building certifications, choose durable non-combustible materials, and ensure structural warranties are transferable to future purchasers.',
                version: 1,
              },
            ],
          },
        ],
      },
    },
  }

  // Check if article already exists
  const existing = await payload.find({
    collection: 'articles',
    where: {
      slug: { equals: articleData.slug },
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'articles',
      id: existing.docs[0].id,
      data: articleData as any,
    })
    console.log('Updated test article with H2 headings successfully:', existing.docs[0].id)
  } else {
    const created = await payload.create({
      collection: 'articles',
      data: articleData as any,
    })
    console.log('Created test article with H2 headings successfully:', created.id)
  }

  process.exit(0)
}

run().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
