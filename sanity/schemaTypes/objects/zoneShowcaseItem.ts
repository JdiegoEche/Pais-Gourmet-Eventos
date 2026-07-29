import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'zoneShowcaseItem',
  title: 'Zona destacada',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagen',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name', media: 'image'},
  },
})
