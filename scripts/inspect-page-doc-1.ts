import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function checkDoc() {
  const payload = await getPayload({ config: configPromise })
  const doc = await payload.findByID({
    collection: 'pages',
    id: 1,
    depth: 2,
  })
  console.log('--- Page Doc 1 Full Details ---')
  console.log('ID:', doc.id)
  console.log('Title:', doc.title)
  console.log('Slug:', doc.slug)
  console.log('Privacy Policy text paragraphs:')
  const pTexts = doc.privacyPolicy?.root?.children?.map((c: any) => c.children?.map((t: any) => t.text).join('')) || []
  pTexts.forEach((p: string, i: number) => console.log(`  [${i + 1}] ${p}`))
  console.log('Terms of Use text paragraphs:')
  const tTexts = doc.termsOfUse?.root?.children?.map((c: any) => c.children?.map((t: any) => t.text).join('')) || []
  tTexts.forEach((t: string, i: number) => console.log(`  [${i + 1}] ${t}`))
}

checkDoc().catch(console.error)
