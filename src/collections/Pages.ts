import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      () => {
        try {
          revalidatePath('/privacy-terms')
        } catch {
          // Non-blocking outside of Next.js request context
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Privacy Policy & Terms of Use',
      admin: {
        description: 'Page title displayed on the website',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      defaultValue: 'privacy-terms',
      admin: {
        description: 'Web address slug for this page. Public frontend route is /privacy-terms.',
      },
    },
    {
      name: 'privacyPolicy',
      type: 'richText',
      admin: {
        description: 'Content for Section 1: Privacy Policy',
      },
    },
    {
      name: 'termsOfUse',
      type: 'richText',
      admin: {
        description: 'Content for Section 2: Terms of Use',
      },
    },
  ],
}
