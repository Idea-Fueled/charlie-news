async function verifyRoute() {
  const res = await fetch('http://localhost:3005/privacy-terms')
  console.log('HTTP Status:', res.status)
  const html = await res.text()
  
  console.log('Contains "Who we are":', html.includes('Who we are'))
  console.log('Contains "What we collect":', html.includes('What we collect'))
  console.log('Contains "Klaviyo":', html.includes('Klaviyo'))
  console.log('Contains test Privacy Policy string:', html.includes('This is a test Privacy Policy for Charlie News..'))
  console.log('Contains test Terms string:', html.includes('This is a test Terms of Use page for Charlie News.'))
  console.log('Contains fallback "Pexels" string:', html.includes('attributed in accordance with licensing guidelines provided by Pexels'))
}

verifyRoute().catch(console.error)
