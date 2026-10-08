import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function diagnose() {
  const payload = await getPayload({ config: configPromise })

  // Find run #41
  try {
    const run = await payload.findByID({
      collection: 'automation-runs',
      id: 41,
      depth: 1,
    })
    console.log('--- RUN #41 DETAILS ---')
    console.log(JSON.stringify(run, null, 2))
  } catch (err: any) {
    console.log('Error finding run by ID 41:', err.message)
    // Maybe ID is string or different, let's list latest runs
    const latest = await payload.find({
      collection: 'automation-runs',
      sort: '-createdAt',
      limit: 5,
    })
    console.log('--- LATEST 5 AUTOMATION RUNS ---')
    console.log(JSON.stringify(latest.docs.map(d => ({
      id: d.id,
      startedAt: d.startedAt,
      result: d.result,
      storiesChecked: d.storiesChecked,
      draftsCreated: d.draftsCreated,
      tokensUsed: d.tokensUsed,
      estimatedCost: d.estimatedCost,
      errors: d.errors,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })), null, 2))
  }
}

diagnose().catch(err => {
  console.error('Fatal diagnosis error:', err)
  process.exit(1)
})
