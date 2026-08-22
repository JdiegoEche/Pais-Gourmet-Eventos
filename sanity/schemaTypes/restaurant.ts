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
    }),
    defineField({
      name: 'zone',
      title: 'Zonas',
      description: 'Zonas donde el restaurante atiende en mesa. Puede ser más de una si tiene varias sedes.',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'deliveryZones',
      title: 'Zonas a domicilio',
      description: 'Zonas a las que este restaurante hace entregas a domicilio',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
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
      description: 'Texto libre tal cual lo escribe el restaurante, ej. "Lunes a viernes de 3:30pm a 10pm".',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'menus',
      title: 'Menús',
      type: 'array',
      of: [defineArrayMember({type: 'menu'})],
    }),
    defineField({
      name: 'menuHighlights',
      title: 'Íconos del menú',
      description: 'Íconos que resumen qué incluye el menú. Opcional y editable por restaurante.',
      type: 'array',
      of: [defineArrayMember({type: 'menuHighlight'})],
    }),
    defineField({
      name: 'youtubeVideoUrl',
      title: 'Video de YouTube',
      description: 'Opcional. Se muestra junto al menú si se completa.',
      type: 'url',
    }),
    defineField({
      name: 'vegetarianOption',
      title: 'Opción vegetariana',
      type: 'boolean',
      initialValue: false,
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
  ],
  preview: {
    select: {title: 'name', subtitle: 'zone', media: 'gallery.0'},
    prepare({title, subtitle, media}) {
      return {title, subtitle: Array.isArray(subtitle) ? subtitle.join(', ') : subtitle, media}
    },
  },
})
