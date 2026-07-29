import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'features',
  title: 'Servicios',
  type: 'object',
  fields: [
    defineField({
      name: 'petFriendly',
      title: 'Pet friendly',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'delivery',
      title: 'Delivery',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'tableService',
      title: 'Servicio a la mesa',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'paymentMethods',
      title: 'Medios de pago',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
  ],
})
