import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function inspectPages() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    limit: 10,
  })
  console.log(`Total Pages docs: ${pages.totalDocs}`)
  for (const doc of pages.docs) {
    console.log('--- Page Doc ---')
    console.log('ID:', doc.id)
    console.log('Title:', doc.title)
    console.log('Slug:', doc.slug)
    console.log('Updated at:', doc.updatedAt)
    console.log('Privacy Policy (type & preview):', typeof doc.privacyPolicy, JSON.stringify(doc.privacyPolicy)?.slice(0, 300))
    console.log('Terms of Use (type & preview):', typeof doc.termsOfUse, JSON.stringify(doc.termsOfUse)?.slice(0, 300))
  }
}

inspectPages().catch(console.error)
