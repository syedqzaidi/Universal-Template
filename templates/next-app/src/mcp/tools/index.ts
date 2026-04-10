import { contentLifecycleTools } from './content-lifecycle'
import { seoIndexingTools } from './seo-indexing'
import { contentQualityTools } from './content-quality'
import { croTools } from './cro'
import { i18nTools } from './i18n'
import { searchRedirectsTools } from './search-redirects'
import { mediaTools } from './media'
import { formsTools } from './forms'

export const allTools = [
  ...contentLifecycleTools,
  ...seoIndexingTools,
  ...contentQualityTools,
  ...croTools,
  ...i18nTools,
  ...searchRedirectsTools,
  ...mediaTools,
  ...formsTools,
]
