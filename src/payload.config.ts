import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  lexicalEditor,
  FixedToolbarFeature,
  InlineToolbarFeature,
  HeadingFeature,
  LinkFeature,
  EXPERIMENTAL_TableFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
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
    meta: {
      icons: {
        icon: '/fav-icon.png',
        apple: '/apple-touch-icon.png',
      },
      titleSuffix: '- Charlie News Admin',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo#AdminLogo',
        Icon: '@/components/admin/Icon#AdminIcon',
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
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      InlineToolbarFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      LinkFeature({
        enabledCollections: ['pages', 'articles'],
      }),
      EXPERIMENTAL_TableFeature(),
      UploadFeature({
        collections: {
          media: {
            fields: [
              {
                name: 'caption',
                type: 'text',
                label: 'Caption',
                admin: {
                  description: 'Optional image caption displayed under the photo in the article',
                },
              },
            ],
          },
        },
      }),
    ],
  }),
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
