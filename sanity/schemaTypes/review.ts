import {defineArrayMember, defineField, defineType} from 'sanity'

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
    // El contacto (celular/correo) de quien deja la reseña NO se guarda acá: va a un doc
    // `reviewContact` en el dataset privado `leads`. Este dataset es de lectura pública.
    defineField({
      name: 'rating',
      title: 'Calificación general',
      description: 'Promedio de comida, servicio y ambiente. Reseñas antiguas solo tienen este campo.',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5).integer(),
    }),
    defineField({
      name: 'foodRating',
      title: 'Calificación de comida',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(5).integer(),
    }),
    defineField({
      name: 'serviceRating',
      title: 'Calificación de servicio',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(5).integer(),
    }),
    defineField({
      name: 'ambianceRating',
      title: 'Calificación de ambiente',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(5).integer(),
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
    defineField({
      name: 'menuKey',
      title: 'Menú reseñado (key)',
      description:
        'Escrito por el formulario público / la API al crear la reseña. Editarlo a mano desincroniza el reporte de ranking por menú — no lo cambies desde Studio.',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'menuPriceSnapshot',
      title: 'Precio del menú al reseñar',
      description:
        'Escrito por el formulario público / la API al crear la reseña (precio del menú en ese momento). Editarlo a mano desincroniza el reporte de ranking por menú — no lo cambies desde Studio.',
      type: 'number',
      readOnly: true,
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'replies',
      title: 'Respuestas',
      type: 'array',
      of: [defineArrayMember({type: 'reviewReply'})],
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
