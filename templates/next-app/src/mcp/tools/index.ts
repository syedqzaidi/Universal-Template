import { contentLifecycleTools } from './content-lifecycle'
import { seoIndexingTools } from './seo-indexing'
import { contentQualityTools } from './content-quality'
import { croTools } from './cro'
import { i18nTools } from './i18n'
import { searchRedirectsTools } from './search-redirects'
import { mediaTools } from './media'
import { formsTools } from './forms'
import { pseoSeedingTools } from './pseo-seeding'
import { pseoPageGenerationTools } from './pseo-page-generation'
import { pseoKeywordTools } from './pseo-keywords'
import { pseoQualityTools } from './pseo-quality'
import { pseoArchitectureTools } from './pseo-architecture'
import { pseoLifecycleTools } from './pseo-lifecycle'
import { pseoLocalSeoTools } from './pseo-local-seo'
import { pseoLaunchTools } from './pseo-launch'

export const allTools = [
  ...contentLifecycleTools,
  ...seoIndexingTools,
  ...contentQualityTools,
  ...croTools,
  ...i18nTools,
  ...searchRedirectsTools,
  ...mediaTools,
  ...formsTools,
  ...pseoSeedingTools,
  ...pseoPageGenerationTools,
  ...pseoKeywordTools,
  ...pseoQualityTools,
  ...pseoArchitectureTools,
  ...pseoLifecycleTools,
  ...pseoLocalSeoTools,
  ...pseoLaunchTools,
]
