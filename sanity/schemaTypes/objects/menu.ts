import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'menu',
  title: 'Menú',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre del menú',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'currentPrice',
      title: 'Precio actual',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'previousPrice',
      title: 'Precio anterior',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'items',
      title: 'Ítems',
      type: 'array',
      of: [defineArrayMember({type: 'menuItem'})],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'currentPrice'},
    prepare({title, subtitle}) {
      return {title, subtitle: subtitle ? `$${subtitle}` : undefined}
    },
  },
})
