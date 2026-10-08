import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function checkArticles() {
  const payload = await getPayload({ config: configPromise })

  const run41Articles = await payload.find({
    collection: 'articles',
    where: {
      claudeRunId: { equals: '41' },
    },
  })
  console.log(`Articles with claudeRunId '41': ${run41Articles.totalDocs}`)

  const recentArticles = await payload.find({
    collection: 'articles',
    sort: '-createdAt',
    limit: 5,
  })
  console.log('Recent 5 articles:')
  for (const a of recentArticles.docs) {
    console.log(`- ID: ${a.id}, Title: "${a.headline}", claudeRunId: ${a.claudeRunId}, CreatedAt: ${a.createdAt}`)
  }
}

checkArticles().catch(console.error)
