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
      name: 'logo',
      title: 'Logo',
      description:
        'Logo del evento que se muestra en la barra de navegación en lugar del nombre. Preferí PNG con fondo transparente o SVG.',
      type: 'image',
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
      name: 'whatIncludesImage',
      title: 'Imagen de "¿Qué incluye?"',
      description: 'Imagen mostrada en la sección "¿Qué incluye?" del home',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'priceRanges',
      title: 'Rangos de precio',
      description: 'Mosaico de rangos de precio con foto de un plato representativo (home)',
      type: 'array',
      of: [defineArrayMember({type: 'priceRangeItem'})],
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
      name: 'zoneShowcase',
      title: 'Zonas destacadas (home)',
      description: 'Mosaico de zonas con nombre e imagen para el home. Independiente del filtro de zonas.',
      type: 'array',
      of: [defineArrayMember({type: 'zoneShowcaseItem'})],
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
      name: 'heroRecommendedEnabled',
      title: 'Mostrar "Restaurantes recomendados"',
      description: 'Prende o apaga el carrusel de restaurantes recomendados del home',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'heroRecommendedRestaurants',
      title: 'Restaurantes recomendados',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'restaurant'}],
        }),
      ],
    }),
    defineField({
      name: 'weeklyRecommendedEnabled',
      title: 'Mostrar "Recomendados de la semana"',
      description:
        'Prende o apaga la sección de recomendados que aparece al final de cada página de restaurante. Los restaurantes que se muestran son aleatorios, no se eligen a mano.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'banners',
      title: 'Banners rotativos (home)',
      description: 'Imágenes del banner que rota cada 3 segundos en el home',
      type: 'array',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
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
