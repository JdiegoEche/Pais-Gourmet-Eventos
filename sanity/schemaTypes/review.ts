import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'review',
  title: 'Reseña',
  type: 'document',
  fields: [
    defineField({
      name: 'restaurant',
      title: 'Restaurante',
      type: 'reference',
      to: [{type: 'restaurant'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rating',
      title: 'Calificación',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5).integer(),
    }),
    defineField({
      name: 'comment',
      title: 'Comentario',
      type: 'text',
      rows: 4,
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
  // Reseña pública, sin campo de moderación/aprobación: se publica directo al enviarse.
  preview: {
    select: {title: 'name', subtitle: 'rating'},
    prepare({title, subtitle}) {
      return {title, subtitle: subtitle ? `${subtitle} ★` : undefined}
    },
  },
})
