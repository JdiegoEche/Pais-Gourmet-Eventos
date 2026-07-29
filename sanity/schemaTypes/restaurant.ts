import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'restaurant',
  title: 'Restaurante',
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
      description: 'Usado en la tira de logos del home. Si falta, se usa la primera foto de la galería.',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'event',
      title: 'Evento',
      type: 'reference',
      to: [{type: 'event'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cuisineTypes',
      title: 'Tipos de cocina',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'zone',
      title: 'Zona',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Dirección',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp',
      type: 'string',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'string',
    }),
    defineField({
      name: 'hours',
      title: 'Horarios',
      type: 'array',
      of: [defineArrayMember({type: 'weeklyHours'})],
    }),
    defineField({
      name: 'menus',
      title: 'Menús',
      type: 'array',
      of: [defineArrayMember({type: 'menu'})],
    }),
    defineField({
      name: 'features',
      title: 'Servicios',
      type: 'features',
    }),
    defineField({
      name: 'gallery',
      title: 'Galería de fotos',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
        }),
      ],
    }),
    defineField({
      name: 'relatedRestaurants',
      title: 'Restaurantes relacionados',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'restaurant'}],
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'zone', media: 'gallery.0'},
  },
})
