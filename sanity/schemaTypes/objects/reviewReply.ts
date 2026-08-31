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
    // El contacto (celular/correo) de la respuesta NO se guarda acá: va al array `replies`
    // del doc `reviewContact` correspondiente en el dataset privado `leads`.
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
