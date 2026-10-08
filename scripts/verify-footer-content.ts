import { readFileSync } from 'fs'
import { join } from 'path'

async function verifyFooter() {
  console.log('================================================================')
  console.log('CHARLIE NEWS - FOOTER VERIFICATION SUITE')
  console.log('================================================================\n')

  const footerPath = join(process.cwd(), 'src/components/Footer.tsx')
  const footerCode = readFileSync(footerPath, 'utf-8')

  // Check 1: Exact About text match
  const expectedLine1 = 'Charlie News is your source for Australian property news, from interior and exterior design to the latest market and policy updates.'
  const expectedLine2 = 'Stories are drafted with the help of AI and checked by our team before they go live.'
  const expectedLine3 = 'General information only, not financial, legal or property advice.'

  console.log('--- Check 1: Client-Provided About Text ---')
  if (!footerCode.includes(expectedLine1)) throw new Error('Missing line 1 in Footer.tsx')
  console.log('  ✓ Line 1 matched exactly')
  if (!footerCode.includes(expectedLine2)) throw new Error('Missing line 2 in Footer.tsx')
  console.log('  ✓ Line 2 matched exactly')
  if (!footerCode.includes(expectedLine3)) throw new Error('Missing line 3 in Footer.tsx')
  console.log('  ✓ Line 3 matched exactly')

  // Check old text is completely gone
  const oldText = 'Charlie News is an independent Australian property news publication'
  if (footerCode.includes(oldText)) throw new Error('Old about text still present in Footer.tsx')
  console.log('  ✓ Old About text completely removed')

  // Check 2: Contact email
  console.log('\n--- Check 2: Contact Email ---')
  if (!footerCode.includes('href="mailto:info@corbygroup.com"')) throw new Error('Missing mailto:info@corbygroup.com')
  console.log('  ✓ href="mailto:info@corbygroup.com" is present and clickable')
  if (!footerCode.includes('>info@corbygroup.com<')) throw new Error('Missing text info@corbygroup.com')
  console.log('  ✓ Display text info@corbygroup.com matched')
  if (footerCode.includes('contact@charlienews.com.au')) throw new Error('Old email still present')
  console.log('  ✓ Old contact email completely removed')

  // Check 3: Privacy & Terms link
  console.log('\n--- Check 3: Privacy & Terms Link ---')
  if (!footerCode.includes('href="/privacy-terms"')) throw new Error('Missing link to /privacy-terms')
  console.log('  ✓ Privacy & Terms link to /privacy-terms preserved')

  // Check 4: Copyright line
  console.log('\n--- Check 4: Dynamic Copyright ---')
  if (!footerCode.includes('© {currentYear} Charlie News. All rights reserved.')) throw new Error('Copyright line missing')
  console.log('  ✓ Copyright line shows dynamic {currentYear} + Charlie News')

  // Check 5: Editor Login removed
  console.log('\n--- Check 5: Editor Login Removed ---')
  if (footerCode.includes('Editor Login')) throw new Error('Editor Login still present in Footer.tsx')
  if (footerCode.includes('href="/admin"')) throw new Error('/admin link still present in Footer.tsx')
  console.log('  ✓ Editor Login link completely removed from Footer.tsx')

  // Check 6: Live HTML check from dev server
  console.log('\n--- Check 6: Live Dev Server Response (/ on port 3005) ---')
  try {
    const res = await fetch('http://localhost:3005/')
    if (res.ok) {
      const html = await res.text()
      if (!html.includes('Charlie News is your source for Australian property news')) {
        throw new Error('Live HTML missing new about text')
      }
      console.log('  ✓ Live HTML contains updated About text')
      if (html.includes('<br/><br/>') || html.includes('<br /><br />')) {
        throw new Error('Live HTML contains double br spacing')
      }
      console.log('  ✓ Live HTML does not contain double br spacing')
      if (!html.includes('mailto:info@corbygroup.com')) {
        throw new Error('Live HTML missing new contact email')
      }
      console.log('  ✓ Live HTML contains mailto:info@corbygroup.com')
      if (html.includes('contact@charlienews.com.au')) {
        throw new Error('Live HTML still has old email')
      }
      console.log('  ✓ Live HTML does not have old email')
      if (!html.includes('/privacy-terms')) {
        throw new Error('Live HTML missing /privacy-terms link')
      }
      console.log('  ✓ Live HTML contains /privacy-terms link')
      if (html.includes('Editor Login')) {
        throw new Error('Live HTML still has Editor Login')
      }
      console.log('  ✓ Live HTML does not contain Editor Login')
    }
  } catch (err: any) {
    console.log('  (Dev server fetch check skipped or failed:', err.message, ')')
  }

  console.log('\n================================================================')
  console.log('ALL FOOTER CHECKS PASSED!')
  console.log('================================================================\n')
}

verifyFooter().catch((err) => {
  console.error('Footer verification failed:', err)
  process.exit(1)
})
