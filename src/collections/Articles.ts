import { APIError, type CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'headline',
    defaultColumns: ['headline', 'section', 'status', 'flags', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      // Authenticated admin users can view all articles (Draft, Published, Rejected)
      if (user) {
        return true
      }
      // Public visitors can only view Published articles
      return {
        status: {
          equals: 'Published',
        },
      }
    },
  },
  fields: [
    {
      name: 'headline',
      type: 'text',
      required: true,
      maxLength: 90,
      admin: {
        description: 'Article headline (max 90 characters)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Web address slug for the article URL (e.g. /section/slug)',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 200,
      admin: {
        description: 'Short article summary (max 200 characters)',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Meta description for Google and social previews (max 160 characters)',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      admin: {
        description: 'Full article text with subheadings and paragraphs (400-700 words)',
      },
    },
    {
      name: 'section',
      type: 'relationship',
      relationTo: 'sections',
      required: true,
      hasMany: false,
      admin: {
        description: 'The section this article belongs to (e.g. Renovation, Politics)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'Draft',
      options: [
        {
          label: 'Draft',
          value: 'Draft',
        },
        {
          label: 'Published',
          value: 'Published',
        },
        {
          label: 'Rejected',
          value: 'Rejected',
        },
      ],
      admin: {
        description:
          'Publication status: Draft (in Review Queue), Published (live on website), or Rejected',
      },
    },
    {
      name: 'flags',
      type: 'select',
      hasMany: true,
      options: [
        {
          label: 'Needs photo',
          value: 'Needs photo',
        },
        {
          label: 'Check wording',
          value: 'Check wording',
        },
        {
          label: 'Facts unclear',
          value: 'Facts unclear',
        },
      ],
      admin: {
        description: 'Flags raised by automated checks or Claude',
      },
    },
    {
      name: 'flagReasons',
      type: 'textarea',
      admin: {
        description: 'Details and reasons for any flags attached to this draft',
      },
    },
    {
      name: 'rejectReason',
      type: 'select',
      options: [
        {
          label: 'Not relevant',
          value: 'Not relevant',
        },
        {
          label: 'Wrong facts',
          value: 'Wrong facts',
        },
        {
          label: 'Poor writing',
          value: 'Poor writing',
        },
        {
          label: 'Duplicate',
          value: 'Duplicate',
        },
        {
          label: 'Other',
          value: 'Other',
        },
      ],
      admin: {
        description: 'Optional reason for rejection (saved to help tune Claude)',
      },
    },
    {
      name: 'image',
      type: 'group',
      fields: [
        {
          name: 'url',
          type: 'text',
          admin: {
            description: 'URL of the image',
          },
        },
        {
          name: 'width',
          type: 'number',
          admin: {
            description: 'Image width in pixels',
          },
        },
        {
          name: 'height',
          type: 'number',
          admin: {
            description: 'Image height in pixels',
          },
        },
        {
          name: 'source',
          type: 'select',
          options: [
            {
              label: 'Pexels',
              value: 'Pexels',
            },
            {
              label: 'Unsplash',
              value: 'Unsplash',
            },
            {
              label: 'Upload',
              value: 'Upload',
            },
          ],
          admin: {
            description: 'Source provider of the image (Pexels, Unsplash, or Upload)',
          },
        },
      ],
    },
    {
      name: 'imageAlt',
      type: 'text',
      admin: {
        description: 'Alt text for the photo for accessibility',
      },
    },
    {
      name: 'imageCredit',
      type: 'group',
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'Name of the photographer or credit holder',
          },
        },
        {
          name: 'link',
          type: 'text',
          admin: {
            description: 'Link to the photo page or photographer profile',
          },
        },
      ],
    },
    {
      name: 'imageSourceId',
      type: 'text',
      admin: {
        description: 'Photo ID on Pexels or Unsplash',
      },
    },
    {
      name: 'sourceName',
      type: 'text',
      admin: {
        description: 'Name of the original news source',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        description: 'URL of the original source story',
      },
    },
    {
      name: 'sourceFingerprint',
      type: 'text',
      index: true,
      admin: {
        description: 'Fingerprint (cleaned URL + headline) used to stop repeats within 14 days',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Publication date and time (Sydney timezone)',
      },
    },
    {
      name: 'claudeModel',
      type: 'text',
      admin: {
        description: 'Claude model used to generate draft (e.g. claude-sonnet-5)',
      },
    },
    {
      name: 'claudeRunId',
      type: 'text',
      admin: {
        description: 'ID of the automation run that produced this draft',
      },
    },
    {
      name: 'oldSlugs',
      type: 'array',
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description:
          'Previous slugs kept for redirects when an admin changes the headline',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc }) => {
        const status = data?.status ?? originalDoc?.status
        const imageUrl = data?.image !== undefined ? data?.image?.url : originalDoc?.image?.url

        // SOW 5.3.3: Approve is blocked if required publishing data is missing
        if (status === 'Published') {
          const headline = data?.headline !== undefined ? data.headline : originalDoc?.headline
          const section = data?.section !== undefined ? data.section : originalDoc?.section
          const body = data?.body !== undefined ? data.body : originalDoc?.body

          if (!headline || (typeof headline === 'string' && headline.trim() === '')) {
            throw new APIError('A headline is required before publishing.', 400)
          }

          if (!section) {
            throw new APIError('A section must be selected before publishing.', 400)
          }

          if (!body) {
            throw new APIError('Article body content is required before publishing.', 400)
          }

          if (!imageUrl) {
            throw new APIError('Add a photo before approving.', 400)
          }

          // SOW 5.3.3: Set publishedAt when approved/published if not already set
          if (!data?.publishedAt && !originalDoc?.publishedAt) {
            data.publishedAt = new Date().toISOString()
          }

          // Clear previous rejection reason if article is now being approved/published
          data.rejectReason = null
        }

        // SOW 5.3.3: Rejection validation - rejectReason must be provided when rejecting
        if (status === 'Rejected') {
          const rejectReason = data?.rejectReason !== undefined ? data.rejectReason : originalDoc?.rejectReason
          if (!rejectReason) {
            throw new APIError(
              'Please select a rejection reason before rejecting the article.',
              400,
            )
          }
        }

        // SOW 4.4: If headline/slug changes, retain previous slug for redirects
        if (originalDoc?.slug && data?.slug && originalDoc.slug !== data.slug) {
          const existingOldSlugs = Array.isArray(originalDoc.oldSlugs) ? originalDoc.oldSlugs : []
          const alreadyTracked = existingOldSlugs.some(
            (item: any) => item?.slug === originalDoc.slug,
          )
          if (!alreadyTracked) {
            data.oldSlugs = [...existingOldSlugs, { slug: originalDoc.slug }]
          }
        }

        return data
      },
    ],
  },
}
