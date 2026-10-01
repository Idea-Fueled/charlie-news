import { APIError, type CollectionConfig } from 'payload'

export const Sections: CollectionConfig = {
  slug: 'sections',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'menuOrder', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Web address ending for this section (e.g. "renovation")',
      },
    },
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'One-line description displayed as the page heading description',
      },
    },
    {
      name: 'menuOrder',
      type: 'number',
      required: true,
      admin: {
        description: 'Order number in the navigation menu',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'Active',
      options: [
        {
          label: 'Active',
          value: 'Active',
        },
        {
          label: 'Hidden',
          value: 'Hidden',
        },
      ],
      admin: {
        description: 'Visibility status of the section (Active or Hidden)',
      },
    },
    {
      name: 'claudeTopicGuide',
      type: 'textarea',
      admin: {
        description:
          'A few lines telling Claude what fits this section (Claude only writes for Active sections that have a topic guide)',
      },
    },
  ],
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        if (req.payload.collections && 'articles' in req.payload.collections) {
          const articles = await req.payload.find({
            collection: 'articles' as any,
            where: {
              section: {
                equals: id,
              },
            },
            limit: 1,
          })

          if (articles?.totalDocs && articles.totalDocs > 0) {
            throw new APIError(
              'A section with articles cannot be deleted, only hidden (to avoid broken links).',
              400,
            )
          }
        }
      },
    ],
  },
}
