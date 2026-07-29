import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'menuHighlight',
  title: 'Ícono de menú',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      title: 'Ícono',
      type: 'image',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Etiqueta',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'label', media: 'icon'},
  },
})
