import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'reviewReply',
  title: 'Respuesta',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Celular',
      description: 'Dato privado para poder contactar a quien dejó la reseña. Nunca se muestra en el sitio.',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Correo electrónico',
      description: 'Dato privado para poder contactar a quien dejó la reseña. Nunca se muestra en el sitio.',
      type: 'string',
    }),
    defineField({
      name: 'message',
      title: 'Mensaje',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Fecha',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'message'},
  },
})
