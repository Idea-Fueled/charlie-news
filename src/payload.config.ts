import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Sections } from './collections/Sections'
import { Articles } from './collections/Articles'
import { Pages } from './collections/Pages'
import { AutomationRuns } from './collections/AutomationRuns'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    theme: 'dark',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo#AdminLogo',
      },
      Nav: '@/components/admin/Nav#AdminNav',
      views: {
        dashboard: {
          Component: '@/components/admin/Dashboard#AdminDashboard',
        },
      },
    },
  },
  collections: [Users, Media, Sections, Articles, Pages, AutomationRuns],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
