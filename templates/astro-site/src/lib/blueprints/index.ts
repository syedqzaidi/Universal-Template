import { registerBlueprint } from '../blueprint-registry'
import { homepageBlueprint } from './homepage'
import { entityDetailBlueprint } from './entity-detail'
import { entityListingBlueprint } from './entity-listing'
import { crossProductBlueprint } from './cross-product'
import { blogPostBlueprint } from './blog-post'
import { blogIndexBlueprint } from './blog-index'
import { teamBlueprint } from './team'
import { faqBlueprint } from './faq'
import { contactBlueprint } from './contact'
import { aboutBlueprint } from './about'
import { landingPageBlueprint } from './landing-page'
import { notFoundBlueprint } from './not-found'

// Register all built-in blueprints
registerBlueprint('homepage', homepageBlueprint)
registerBlueprint('entity-detail', entityDetailBlueprint)
registerBlueprint('entity-listing', entityListingBlueprint)
registerBlueprint('cross-product', crossProductBlueprint)
registerBlueprint('blog-post', blogPostBlueprint)
registerBlueprint('blog-index', blogIndexBlueprint)
registerBlueprint('team', teamBlueprint)
registerBlueprint('faq', faqBlueprint)
registerBlueprint('contact', contactBlueprint)
registerBlueprint('about', aboutBlueprint)
registerBlueprint('landing-page', landingPageBlueprint)
registerBlueprint('404', notFoundBlueprint)

// Re-export all blueprints for direct access
export {
  homepageBlueprint,
  entityDetailBlueprint,
  entityListingBlueprint,
  crossProductBlueprint,
  blogPostBlueprint,
  blogIndexBlueprint,
  teamBlueprint,
  faqBlueprint,
  contactBlueprint,
  aboutBlueprint,
  landingPageBlueprint,
  notFoundBlueprint,
}
