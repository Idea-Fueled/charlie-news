import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function checkRuns() {
  const payload = await getPayload({ config: configPromise })

  const runs = await payload.find({
    collection: 'automation-runs',
    where: {
      id: { in: [39, 40, 41] },
    },
    sort: 'id',
  })
  console.log(JSON.stringify(runs.docs, null, 2))
}

checkRuns().catch(console.error)
