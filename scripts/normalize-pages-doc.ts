import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function normalize() {
  const payload = await getPayload({ config: configPromise })

  const doc = await payload.findByID({
    collection: 'pages',
    id: 1,
  })

  console.log('Current Doc 1 before update:')
  console.log('Title:', doc.title)
  console.log('Slug:', doc.slug)

  // Check if termsOfUse has the test text
  const termsText = JSON.stringify(doc.termsOfUse)
  const hasTestTerms = termsText.includes('This is a test Terms of Use page for Charlie News.')

  const updateData: any = {
    slug: 'privacy-terms',
    title: 'Privacy Policy & Terms of Use',
  }

  if (hasTestTerms) {
    console.log('Removing old test Terms of Use text from database...')
    // Set to empty richText structure or null
    updateData.termsOfUse = {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: null,
      },
    }
  }

  const updated = await payload.update({
    collection: 'pages',
    id: 1,
    data: updateData,
  })

  console.log('\nUpdated Doc 1 successfully:')
  console.log('ID:', updated.id)
  console.log('Title:', updated.title)
  console.log('Slug:', updated.slug)
  console.log('Privacy Policy preserved length:', JSON.stringify(updated.privacyPolicy)?.length)
  console.log('Terms of Use cleared of test text:', !JSON.stringify(updated.termsOfUse)?.includes('This is a test Terms of Use page for Charlie News.'))
}

normalize().catch(console.error)
