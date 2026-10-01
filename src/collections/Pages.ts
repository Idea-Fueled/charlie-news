import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
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
        description: 'Web address slug for this page (e.g. "privacy-terms")',
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
