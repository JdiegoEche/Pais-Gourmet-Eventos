import {defineArrayMember, defineField, defineType} from 'sanity'

// Vive SOLO en el dataset privado `leads`. Guarda el contacto de quien dejó una reseña (y de
// quienes respondieron), separado del doc `review` público en `production`.
export default defineType({
  name: 'reviewContact',
  title: 'Contacto de reseña',
  type: 'document',
  fields: [
    defineField({
      name: 'reviewId',
      title: 'ID de la reseña',
      description: 'El _id del doc `review` en el dataset público `production`.',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'restaurantSlug',
      title: 'Restaurante (slug)',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Celular',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Correo electrónico',
      type: 'string',
    }),
    defineField({
      name: 'createdAt',
      title: 'Fecha',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'replies',
      title: 'Contacto de respuestas',
      description: 'Una entrada por cada respuesta a la reseña, correlacionada por _key.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', title: 'Nombre', type: 'string'}),
            defineField({name: 'phone', title: 'Celular', type: 'string'}),
            defineField({name: 'email', title: 'Correo electrónico', type: 'string'}),
            defineField({name: 'createdAt', title: 'Fecha', type: 'datetime'}),
          ],
          preview: {select: {title: 'name', subtitle: 'email'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'email'},
  },
})
