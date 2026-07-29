import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'weeklyHours',
  title: 'Horario',
  type: 'object',
  fields: [
    defineField({
      name: 'day',
      title: 'Día',
      type: 'string',
      options: {
        list: [
          {title: 'Lunes', value: 'lunes'},
          {title: 'Martes', value: 'martes'},
          {title: 'Miércoles', value: 'miercoles'},
          {title: 'Jueves', value: 'jueves'},
          {title: 'Viernes', value: 'viernes'},
          {title: 'Sábado', value: 'sabado'},
          {title: 'Domingo', value: 'domingo'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'opens',
      title: 'Abre',
      type: 'string',
      description: 'Formato HH:mm, ej. 14:00',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'closes',
      title: 'Cierra',
      type: 'string',
      description: 'Formato HH:mm, ej. 21:00',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {day: 'day', opens: 'opens', closes: 'closes'},
    prepare({day, opens, closes}) {
      return {title: day, subtitle: `${opens} - ${closes}`}
    },
  },
})
