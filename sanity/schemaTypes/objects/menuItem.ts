import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'menuItem',
  title: 'Ítem de menú',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          {title: 'Entrantes', value: 'entrantes'},
          {title: 'Fuerte', value: 'fuerte'},
          {title: 'Postre', value: 'postre'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'category'},
  },
})
