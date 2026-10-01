import type { CollectionConfig } from 'payload'

export const AutomationRuns: CollectionConfig = {
  slug: 'automation-runs',
  labels: {
    singular: 'Automation Run',
    plural: 'Automation Runs',
  },
  admin: {
    useAsTitle: 'result',
    defaultColumns: [
      'startedAt',
      'result',
      'draftsCreated',
      'storiesChecked',
      'tokensUsed',
      'estimatedCost',
    ],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Timestamp when this automation run started',
      },
    },
    {
      name: 'finishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Timestamp when this automation run finished',
      },
    },
    {
      name: 'result',
      type: 'select',
      required: true,
      defaultValue: 'Success',
      options: [
        {
          label: 'Success',
          value: 'Success',
        },
        {
          label: 'Partial',
          value: 'Partial',
        },
        {
          label: 'Failed',
          value: 'Failed',
        },
      ],
      admin: {
        description: 'Outcome of the automation run',
      },
    },
    {
      name: 'storiesChecked',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Number of RSS/source stories evaluated',
      },
    },
    {
      name: 'draftsCreated',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Number of article drafts generated during this run',
      },
    },
    {
      name: 'errors',
      type: 'textarea',
      admin: {
        description: 'Error messages or failure logs if encountered',
      },
    },
    {
      name: 'tokensUsed',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Total LLM tokens consumed during the run',
      },
    },
    {
      name: 'estimatedCost',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        step: 0.0001,
        description: 'Estimated API cost for this run',
      },
    },
  ],
}
