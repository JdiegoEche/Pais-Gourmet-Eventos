import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'event',
  title: 'Evento',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Fecha de inicio',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha de fin',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'whatIncludes',
      title: '¿Qué incluye?',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'priceRanges',
      title: 'Rangos de precio',
      description: 'Usados como filtro, ej. "$85k - $105k para 2 personas"',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'zones',
      title: 'Zonas geográficas',
      description: 'Usadas como filtro, ej. Pereira, Manizales, Armenia',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'featuredRestaurants',
      title: 'Restaurantes destacados',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'restaurant'}],
        }),
      ],
    }),
    defineField({
      name: 'sponsorLogos',
      title: 'Logos de sponsors',
      type: 'array',
      of: [defineArrayMember({type: 'sponsorLogo'})],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'slug.current'},
  },
})
