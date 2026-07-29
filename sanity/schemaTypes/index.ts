import event from './event'
import leadSignup from './leadSignup'
import restaurant from './restaurant'
import review from './review'
import features from './objects/features'
import menu from './objects/menu'
import menuItem from './objects/menuItem'
import sponsorLogo from './objects/sponsorLogo'
import weeklyHours from './objects/weeklyHours'
import zoneShowcaseItem from './objects/zoneShowcaseItem'

export const schemaTypes = [
  // documents
  event,
  restaurant,
  review,
  leadSignup,
  // objects
  menu,
  menuItem,
  weeklyHours,
  features,
  sponsorLogo,
  zoneShowcaseItem,
]
