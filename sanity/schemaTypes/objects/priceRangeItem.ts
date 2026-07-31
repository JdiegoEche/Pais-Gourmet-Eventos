import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'priceRangeItem',
  title: 'Rango de precio',
  type: 'object',
  fields: [
    defineField({
      name: 'range',
      title: 'Rango',
      description: 'Ej. "$85.000 - $105.000 para 2 personas"',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagen',
      description: 'Foto de un plato representativo de este rango de precio',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'range', media: 'image'},
  },
})
