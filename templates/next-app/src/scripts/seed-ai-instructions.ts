/**
 * Seed AI plugin instruction records for all enabled collections.
 * Runs automatically via onInit hook in payload.config.ts.
 *
 * Records are only created once — existing records are skipped.
 * To re-seed with updated prompts: RESEED_AI_PROMPTS=1 pnpm dev:next
 */

import type { Payload } from 'payload'

const COLLECTION = 'plugin-ai-instructions'

interface FieldDef {
  schemaPath: string
  fieldType: 'text' | 'textarea' | 'richText' | 'upload'
  prompt: string
  modelId?: string
}

const fields: FieldDef[] = [
  // ═══════════════════════════════════════════════════════════════
  // PAGES
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'pages.title',
    fieldType: 'text',
    prompt: 'Keep the exact page title "{{ title }}" — only fix capitalization to Title Case and correct obvious typos. Do not change the meaning or generate a different title. Output only the corrected title.',
  },
  {
    schemaPath: 'pages.excerpt',
    fieldType: 'textarea',
    prompt: 'Write a meta description (150-160 characters) for the page "{{ title }}". If page content is available, summarize it. Otherwise, write a clear value proposition based on the title. Include a subtle call-to-action. Do not use quotation marks.',
  },
  {
    schemaPath: 'pages.content',
    fieldType: 'richText',
    prompt: 'Write professional website page content for "{{ title }}". Structure with:\n- A compelling opening paragraph\n- 2-3 sections with descriptive H2 headings\n- Supporting details with bullet points where appropriate\n- A closing paragraph with a call-to-action\n\nTone: confident and helpful. Length: 400-600 words.',
  },
  {
    schemaPath: 'pages.featuredImage',
    fieldType: 'upload',
    prompt: 'A professional, high-quality photograph representing "{{ title }}" for a local service business website. Clean composition, natural lighting, no text overlays, no logos, no watermarks.',
  },

  // ═══════════════════════════════════════════════════════════════
  // BLOG POSTS
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'blog-posts.title',
    fieldType: 'text',
    prompt: 'Keep the exact blog title "{{ title }}" — only fix capitalization and correct obvious typos. Do not change the meaning or generate a different title. Output only the corrected title.',
  },
  {
    schemaPath: 'blog-posts.excerpt',
    fieldType: 'textarea',
    prompt: 'Write a blog excerpt (150-160 characters) for "{{ title }}". If post content is available, summarize the key takeaway. Otherwise, write a hook that previews the value the reader will get. Write in second person (you/your). End with intrigue.',
  },
  {
    schemaPath: 'blog-posts.content',
    fieldType: 'richText',
    prompt: 'Write an in-depth blog post about "{{ title }}" for a local service business audience. Include:\n- An engaging introduction that states the problem and promises a solution\n- 3-5 sections with H2 headings using natural keyword variations\n- Practical tips, examples, or data points in each section\n- Bullet points or numbered lists for scannable content\n- A conclusion with a clear next-step call-to-action\n\nTone: authoritative yet approachable. Length: 800-1200 words. Write for homeowners and local customers.',
  },
  {
    schemaPath: 'blog-posts.featuredImage',
    fieldType: 'upload',
    prompt: 'A professional blog header photograph for an article about "{{ title }}". Visually relevant to the topic, high resolution, editorial style, warm natural lighting, no text or overlays.',
  },
  {
    schemaPath: 'blog-posts.authorOverride',
    fieldType: 'text',
    prompt: 'Keep the exact author name "{{ authorOverride }}" — only fix capitalization and correct obvious typos. Do not change the name. Output only the corrected name.',
  },
  {
    schemaPath: 'blog-posts.seoTitle',
    fieldType: 'text',
    prompt: 'Write an SEO title tag (50-60 characters) for the blog post "{{ title }}". Include the primary keyword near the beginning. Make it click-worthy in search results.',
  },
  {
    schemaPath: 'blog-posts.seoDescription',
    fieldType: 'textarea',
    prompt: 'Write an SEO meta description (150-155 characters) for the blog post "{{ title }}". If an excerpt is available, expand on it for search context. Otherwise, summarize the key takeaway, include a benefit, and end with an implicit call-to-action.',
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVICES (primary field: "name")
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'services.name',
    fieldType: 'text',
    prompt: 'Keep the exact service name "{{ name }}" — only fix capitalization to Title Case and correct obvious typos. Do not change the meaning, rename the service, or generate a different name. Output only the corrected name.',
  },
  {
    schemaPath: 'services.shortDescription',
    fieldType: 'textarea',
    prompt: 'Write a one-sentence service summary (80-120 characters) for "{{ name }}". If a full description is available, distill it into a single benefit-focused sentence. Otherwise, capture the core customer benefit based on the service name. Focus on the outcome, not the process.',
  },
  {
    schemaPath: 'services.tagline',
    fieldType: 'text',
    prompt: 'Write a punchy service tagline (6-10 words) for "{{ name }}". If a description is available, draw from its key themes. Communicate reliability and expertise. Avoid clichés like "best in class" or "second to none".',
  },
  {
    schemaPath: 'services.excerpt',
    fieldType: 'textarea',
    prompt: 'Write a service excerpt (150-160 characters) for "{{ name }}". If a full description is available, summarize its key points. Otherwise, highlight the primary benefit and include a subtle call-to-action. Suitable for search results and service listing cards.',
  },
  {
    schemaPath: 'services.description',
    fieldType: 'richText',
    prompt: 'Write a comprehensive service page for "{{ name }}" targeting local homeowners. Include:\n- Opening paragraph explaining the service and who it is for\n- H2: "What We Offer" — specific sub-services or capabilities as a bullet list\n- H2: "Why Choose Us" — 3-4 differentiators (experience, guarantees, certifications)\n- H2: "Our Process" — numbered steps from initial contact to completion\n- Closing paragraph with urgency and a call-to-action\n\nTone: trustworthy, professional. Length: 500-800 words.',
  },
  {
    schemaPath: 'services.featuredImage',
    fieldType: 'upload',
    prompt: 'A professional photograph of "{{ name }}" being performed by a skilled technician. Show real work in progress, clean and well-lit, no stock photo feel, no text overlays.',
  },
  {
    schemaPath: 'services.seoTitle',
    fieldType: 'text',
    prompt: 'Write an SEO title tag (50-60 characters) for the service "{{ name }}". Include the service name and location intent — e.g. "Professional [Service] | [Area] Experts".',
  },
  {
    schemaPath: 'services.seoDescription',
    fieldType: 'textarea',
    prompt: 'Write an SEO meta description (150-155 characters) for "{{ name }}". If a description or excerpt is available, draw from those. Mention the service, a key benefit, and include a call-to-action like "Call today" or "Get a free estimate".',
  },
  {
    schemaPath: 'services.features.title',
    fieldType: 'text',
    prompt: 'Write a concise feature title (3-6 words) for a capability of the "{{ name }}" service. Be specific — e.g. "Same-Day Emergency Response" not "Fast Service".',
  },
  {
    schemaPath: 'services.features.description',
    fieldType: 'textarea',
    prompt: 'Write a feature description (1-2 sentences) explaining this capability of "{{ name }}". Focus on the customer benefit and what makes it valuable.',
  },

  // ═══════════════════════════════════════════════════════════════
  // LOCATIONS (primary field: "displayName")
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'locations.displayName',
    fieldType: 'text',
    prompt: 'Keep the exact location name "{{ displayName }}" — only format it to standard "City, ST" style (e.g. "Austin, TX") and fix any typos. Do not change the location or generate a different name. Output only the formatted name.',
  },
  {
    schemaPath: 'locations.description',
    fieldType: 'richText',
    prompt: 'Write a location page description (300-500 words) for "{{ displayName }}". Include:\n- An intro about the area and the services available there\n- H2: "About {{ displayName }}" — brief area overview relevant to homeowners\n- H2: "Our Services in {{ displayName }}" — mention key services with local context\n- H2: "Why {{ displayName }} Residents Choose Us" — local trust signals\n- Closing with a call-to-action mentioning the location name\n\nInclude natural geographic references for local SEO.',
  },
  {
    schemaPath: 'locations.areaInfo',
    fieldType: 'textarea',
    prompt: 'Write a brief area overview (2-3 sentences) for "{{ displayName }}" relevant to home services. Mention the type of housing, common service needs, and any local factors (climate, building codes, seasonal issues).',
  },
  {
    schemaPath: 'locations.seoTitle',
    fieldType: 'text',
    prompt: 'Write a geo-targeted SEO title (50-60 characters) for "{{ displayName }}" — e.g. "Home Services in [City], [State] | [Business Name]".',
  },
  {
    schemaPath: 'locations.seoDescription',
    fieldType: 'textarea',
    prompt: 'Write a geo-targeted meta description (150-155 characters) for "{{ displayName }}". If a description is available, summarize it with local context. Include the city name, mention top services, and add a local call-to-action.',
  },
  {
    schemaPath: 'locations.featuredImage',
    fieldType: 'upload',
    prompt: 'A recognizable cityscape or neighborhood photograph of "{{ displayName }}". Show the local character — landmarks, streetscapes, or residential areas. No text overlays.',
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVICE PAGES (Service × Location cross-product)
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'service-pages.title',
    fieldType: 'text',
    prompt: 'Keep the exact title "{{ title }}" — only fix capitalization and correct obvious typos. Do not change the meaning or generate a different title. Output only the corrected title.',
  },
  {
    schemaPath: 'service-pages.headline',
    fieldType: 'text',
    prompt: 'Write a compelling H1 headline (40-70 characters) for "{{ title }}" that speaks directly to local customers searching for this service in their area.',
  },
  {
    schemaPath: 'service-pages.introduction',
    fieldType: 'richText',
    prompt: 'Write a localized introduction (150-250 words) for "{{ title }}". Open with a statement that connects the service to the specific location. Mention local expertise, response times, and why residents trust this provider. Include natural geo-references for local SEO.',
  },
  {
    schemaPath: 'service-pages.localContent',
    fieldType: 'richText',
    prompt: 'Write location-specific content (300-500 words) for "{{ title }}". Include:\n- H2: Local considerations (climate, building codes, common issues in this area)\n- H2: Service availability and response times for this location\n- Practical tips specific to homeowners in this area\n- Natural mentions of nearby neighborhoods and landmarks\n\nThis content should be genuinely useful to someone in this specific location, not generic.',
  },
  {
    schemaPath: 'service-pages.seoTitle',
    fieldType: 'text',
    prompt: 'Write a hyper-local SEO title (50-60 characters) for "{{ title }}". Combine [Service] + [City] + [differentiator] — e.g. "Emergency Plumber in Austin TX | 24/7 Service".',
  },
  {
    schemaPath: 'service-pages.seoDescription',
    fieldType: 'textarea',
    prompt: 'Write a geo-targeted meta description (150-155 characters) for "{{ title }}". If an introduction is available, draw from it. Include the service, location, a specific benefit, and a call-to-action.',
  },

  // ═══════════════════════════════════════════════════════════════
  // FAQs (primary field: "question")
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'faqs.question',
    fieldType: 'text',
    prompt: 'Keep the exact question "{{ question }}" — only fix grammar, spelling, and punctuation. Ensure it reads as a natural question. Do not change the meaning or generate a different question. Output only the corrected question.',
  },
  {
    schemaPath: 'faqs.answer',
    fieldType: 'richText',
    prompt: 'Write a clear, helpful answer (100-200 words) to the question "{{ question }}". Start with a direct answer in the first sentence. Then elaborate with practical details. Use bullet points if listing multiple items. End with a sentence encouraging the reader to contact for specifics. Tone: knowledgeable and reassuring.',
  },

  // ═══════════════════════════════════════════════════════════════
  // TESTIMONIALS (primary field: "clientName")
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'testimonials.clientName',
    fieldType: 'text',
    prompt: 'Keep the exact client name "{{ clientName }}" — only fix capitalization and correct obvious typos. Do not change the name or generate a different one. Output only the corrected name.',
  },
  {
    schemaPath: 'testimonials.clientTitle',
    fieldType: 'text',
    prompt: 'Generate a brief client descriptor (under 30 characters) based on "{{ clientName }}" — e.g. "Homeowner in Austin", "Property Manager", "Long-time Customer".',
  },
  {
    schemaPath: 'testimonials.review',
    fieldType: 'textarea',
    prompt: 'Write a realistic customer testimonial (2-4 sentences) from "{{ clientName }}". Include a specific problem they had, what the experience was like, and the outcome. Use natural, conversational language — not corporate-speak. Vary the tone between grateful, impressed, and relieved.',
  },
  {
    schemaPath: 'testimonials.avatar',
    fieldType: 'upload',
    prompt: 'A friendly, professional headshot portrait of a satisfied customer. Natural smile, casual-professional attire, neutral background, warm lighting. Photorealistic.',
  },

  // ═══════════════════════════════════════════════════════════════
  // TEAM MEMBERS (primary field: "name")
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'team-members.name',
    fieldType: 'text',
    prompt: 'Keep the exact team member name "{{ name }}" — only fix capitalization and correct obvious typos. Do not change the name. Output only the corrected name.',
  },
  {
    schemaPath: 'team-members.role',
    fieldType: 'text',
    prompt: 'Generate a professional job title (under 30 characters) for "{{ name }}" at a local service company — e.g. "Lead Technician", "Operations Manager", "Senior Plumber".',
  },
  {
    schemaPath: 'team-members.bio',
    fieldType: 'richText',
    prompt: 'Write a professional team member bio (100-150 words) for "{{ name }}". If a role is available ({{ role }}), incorporate it. Include:\n- Years of experience and specializations\n- Relevant certifications or training\n- A personal touch (community involvement, hobbies, or family)\n- Why they are passionate about their work\n\nTone: warm and professional. Write in third person.',
  },
  {
    schemaPath: 'team-members.photo',
    fieldType: 'upload',
    prompt: 'A professional headshot portrait of a friendly, approachable service professional. Clean background, professional attire, natural smile, well-lit. Photorealistic.',
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDIA
  // ═══════════════════════════════════════════════════════════════
  {
    schemaPath: 'media.alt',
    fieldType: 'text',
    prompt: 'Write descriptive alt text (10-15 words) for this image. Be specific about what is shown — objects, actions, setting. Do not start with "Image of" or "Photo of".',
  },
  {
    schemaPath: 'media.caption',
    fieldType: 'text',
    prompt: 'Write a brief image caption (1 sentence) that adds context beyond what is visible. Include relevant details about the location, service, or subject.',
  },
]

export async function seedAiInstructions(payload: Payload): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  for (const field of fields) {
    const existing = await payload.find({
      collection: COLLECTION,
      where: { 'schema-path': { equals: field.schemaPath } },
      limit: 1,
      locale: 'all',
    })

    if (existing.docs.length > 0) {
      skipped++
      continue
    }

    let modelId = 'Oai-text'
    if (field.fieldType === 'richText') modelId = 'Oai-object'
    if (field.fieldType === 'upload') modelId = 'dall-e'
    if (field.modelId) modelId = field.modelId

    try {
      await payload.create({
        collection: COLLECTION,
        data: {
          'schema-path': field.schemaPath,
          'field-type': field.fieldType,
          'model-id': modelId,
          prompt: field.prompt,
          ...(field.fieldType === 'upload' ? { 'relation-to': 'media' } : {}),
          // Set GPT-5 as default model for text providers
          ...(modelId === 'Oai-text' ? { 'Oai-text-settings': { model: 'gpt-5', maxTokens: 5000, temperature: 0.7 } } : {}),
          ...(modelId === 'Oai-object' ? { 'Oai-object-settings': { model: 'gpt-5', maxTokens: 5000, temperature: 0.7 } } : {}),
        },
      })
      created++
      payload.logger.info(`Seeded AI prompt for: ${field.schemaPath}`)
    } catch (err) {
      payload.logger.error(`Failed to seed ${field.schemaPath}: ${err}`)
    }
  }

  return { created, skipped }
}
