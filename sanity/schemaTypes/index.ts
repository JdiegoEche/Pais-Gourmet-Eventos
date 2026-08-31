import event from './event'
import leadSignup from './leadSignup'
import restaurant from './restaurant'
import review from './review'
import reviewContact from './leads/reviewContact'
import features from './objects/features'
import menu from './objects/menu'
import menuItem from './objects/menuItem'
import menuHighlight from './objects/menuHighlight'
import reviewReply from './objects/reviewReply'
import sponsorLogo from './objects/sponsorLogo'
import zoneShowcaseItem from './objects/zoneShowcaseItem'
import priceRangeItem from './objects/priceRangeItem'

// Dataset público `production`: todo lo que se muestra en el sitio. Sin PII.
export const productionSchemaTypes = [
  // documents
  event,
  restaurant,
  review,
  // objects
  menu,
  menuItem,
  menuHighlight,
  reviewReply,
  features,
  sponsorLogo,
  zoneShowcaseItem,
  priceRangeItem,
]

// Dataset privado `leads`: datos personales de contacto. Nunca se lee desde el sitio.
export const leadsSchemaTypes = [leadSignup, reviewContact]
