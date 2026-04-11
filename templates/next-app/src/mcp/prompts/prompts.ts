import { z } from 'zod'
import type { PayloadRequest } from 'payload'

const msg = (role: 'assistant' | 'user', t: string) => ({
  messages: [{ content: { text: t, type: 'text' as const }, role }],
})

export const allPromptDefinitions = [
  {
    name: 'brand_voice',
    title: 'Brand Voice Guidelines',
    description: 'Professional agency tone: clear, confident, jargon-free, active voice, benefit-driven',
    argsSchema: { context: z.string().optional() },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const context = args['context'] as string | undefined

      const contextSection = context
        ? `\n## Applied to Your Context\nContext: "${context}"\n\nFor this specific content, focus on:\n- Lead with the direct benefit to the reader\n- Use concrete, specific language rather than vague claims\n- Structure your copy so the most important information appears first\n- End with a clear next step or call to action\n`
        : ''

      const text = `# Brand Voice Guidelines

## Tone
Professional but approachable. We communicate like a trusted expert — knowledgeable without being condescending, confident without being arrogant. Think Google or Apple: clean, purposeful, human.

## Voice Principles

### Active Voice
Write in active voice. The subject does the action.
- ✅ "Our platform automates your workflow."
- ❌ "Your workflow is automated by our platform."

### Confident Language
Make direct statements. Avoid hedging words like "might", "could", "possibly", "perhaps" unless genuinely uncertain.
- ✅ "This saves you 3 hours per week."
- ❌ "This might possibly save you some time."

### Clear and Concise
Short sentences. One idea per sentence. Aim for a Flesch-Kincaid reading ease above 60.

### Benefit-Driven
Lead with what the reader gains, not what the product does.
- ✅ "Publish faster with one-click scheduling."
- ❌ "We have a one-click scheduling feature."

## Language Standards

### Words and Phrases to Avoid
These are overused, vague, or meaningless:
- "leverage" → use "use"
- "synergy" → be specific about the collaboration
- "cutting-edge" → describe the actual innovation
- "innovative" → show don't tell
- "world-class" → unsubstantiated claim
- "seamlessly" → describe the actual experience
- "holistic" → be specific
- "paradigm shift" → too abstract
- "best-in-class" → requires evidence
- "solution" (as a standalone noun) → name the actual thing

### Preferred Language Patterns
- Numbers over words for data: "3 steps" not "three steps" (for UI/body copy)
- Contractions are fine: "you're", "we'll", "it's" — makes copy feel human
- Second person: address the reader as "you"
- Oxford comma: always

## Structure
- Short paragraphs: 2-4 lines max for web
- Scannable: use headers, bullets, and bold for key points
- Hierarchical: most important information first (inverted pyramid)
- White space is content: don't pack too much into one section

## Content Types

### Headlines
- Lead with benefit or intrigue
- Under 60 characters for SEO
- Avoid questions unless the answer is obvious

### Body Copy
- First sentence of each paragraph should be the most important
- Use the "so what?" test — if a sentence doesn't serve the reader, cut it

### CTAs
- Verb-first: "Start free trial", "Download the guide", "Book a demo"
- Specific over generic: "Get my free report" beats "Submit"
- No "Click here"
${contextSection}`

      return msg('assistant', text)
    },
  },

  {
    name: 'seo_content_standards',
    title: 'SEO Content Standards',
    description: 'Meta title 50-60 chars, description 150-160 chars, heading hierarchy, keyword placement',
    argsSchema: { keyword: z.string().optional() },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const keyword = args['keyword'] as string | undefined

      const keywordSection = keyword
        ? `\n## Keyword-Specific Examples: "${keyword}"\n\n### Sample Meta Title\n"${keyword.charAt(0).toUpperCase() + keyword.slice(1)} | [Brand Name]" — adjust to hit 50-60 characters\n\n### Sample Meta Description\nInclude "${keyword}" naturally in the first 100 characters. Example: "Discover how [benefit related to ${keyword}]. [Supporting detail]. [CTA like 'Learn more' or 'Get started today']."\n\n### Sample H1\nAim for: "The [adjective] Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}" or a direct statement incorporating the keyword\n\n### First Paragraph\nMention "${keyword}" within the first 100 words, as naturally as possible in context.\n`
        : ''

      const text = `# SEO Content Standards

## Meta Title
- **Length:** 50-60 characters (Google truncates at ~60)
- **Keyword placement:** Include primary keyword in first 30 characters
- **Format:** Primary Keyword – Brand Name (use em dash or pipe separator)
- **No keyword stuffing:** One primary keyword, one supporting if natural
- **Every title unique:** No duplicate meta titles across the site

## Meta Description
- **Length:** 150-160 characters (Google truncates beyond this)
- **Must include:** Primary keyword, a clear benefit, and a CTA
- **Tone:** Compelling, not a list of features
- **Formula:** [Benefit statement + keyword] + [Supporting detail] + [CTA]
- Example: "Learn how to write SEO-optimized content that ranks. Step-by-step guide with templates. Start improving your traffic today."

## Heading Hierarchy

### H1 — One Per Page
- Contains the primary keyword
- Matches or closely mirrors the meta title intent
- Never use H1 for decorative text

### H2 — Section Headers
- Break content into logical sections
- Include secondary keywords naturally
- Should make sense as standalone navigation items

### H3 — Sub-sections
- Support the parent H2
- More specific, long-tail keyword opportunities

### Never Skip Levels
- H1 → H2 → H3 is correct
- H1 → H3 (skipping H2) breaks accessibility and SEO signals

## Keyword Placement
1. **Meta title** — keyword near the front
2. **Meta description** — keyword in first 100 characters
3. **H1** — primary keyword present
4. **First paragraph** — keyword within first 100 words
5. **Subheadings (H2/H3)** — secondary and related keywords
6. **Body copy** — natural density, approximately 1-2% (don't force it)
7. **Image alt text** — descriptive, include keyword where genuinely relevant
8. **URL slug** — include primary keyword, kebab-case, short

## URL Structure
- **Format:** /category/primary-keyword-phrase
- **Length:** Under 60 characters
- **No dates** unless content is date-specific (news, events)
- **No stop words:** Remove "a", "the", "and", "of" unless they're essential

## Internal Linking
- **2-5 internal links** per page minimum
- **Anchor text:** Descriptive, keyword-relevant — never "click here" or "read more"
- Link to cornerstone/pillar content from supporting pages
- Update older content to link to newer relevant pages

## Image SEO
- **Alt text:** Descriptive sentence, include keyword where natural
  - ✅ "Marketing team reviewing SEO content standards on laptop"
  - ❌ "image of team" or leaving alt text blank
- **Filename:** kebab-case, descriptive, include keyword
  - ✅ seo-content-checklist-2024.webp
  - ❌ IMG_4892.jpg
- **Title attribute:** Optional but adds context for accessibility

## Content Depth
- **Minimum 300 words** for any indexable page
- **Pillar content:** 1,500-3,000+ words for competitive keywords
- **Answer related questions:** Address People Also Ask and related searches
- **Update frequency:** Refresh evergreen content annually at minimum
${keywordSection}`

      return msg('assistant', text)
    },
  },

  {
    name: 'landing_page_structure',
    title: 'Landing Page Structure',
    description: 'Hero → problem → solution → features → social proof → CTA conversion flow',
    argsSchema: { product: z.string().optional() },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const product = args['product'] as string | undefined

      const productLabel = product || 'your product'
      const productCap = product
        ? product.charAt(0).toUpperCase() + product.slice(1)
        : 'Your Product'

      const text = `# Landing Page Structure Blueprint

A high-converting landing page follows a psychological flow: capture attention → establish relevance → build trust → remove objections → drive action.

---

## Section 1: Hero
**Goal:** Capture attention and communicate core value in under 5 seconds.

### Components
- **Headline:** Primary value proposition — what does ${productLabel} do for the visitor?
  - Formula: [Outcome] + [Timeframe or Differentiator]
  - Example: "Launch Your Next Campaign in Half the Time"
- **Subheadline:** Expand on the headline with one supporting sentence
  - Example: "${productCap} automates the repetitive work so your team can focus on strategy."
- **Primary CTA:** One clear action button — verb-first, benefit-implied
  - Example: "Start Free Trial", "Get Instant Access", "Book Your Demo"
- **Hero Image/Video:** Show the product in context, or a human outcome
- **Social proof badge (optional):** "Trusted by 10,000+ teams" or a recognizable logo bar

### Copy Guidelines
- Headline: Under 10 words ideally, under 15 max
- Subheadline: 1-2 sentences only
- No paragraphs in the hero — the CTA must be visible without scrolling

---

## Section 2: Problem Statement
**Goal:** Show empathy and make the visitor feel understood.

### Components
- **Pain point headline:** Name the problem directly
  - Example: "Managing campaigns across 5 tools is exhausting."
- **Problem elaboration:** 2-3 sentences or a short bullet list of frustrations
- **Emotional resonance:** Use the visitor's own language (pull from reviews, support tickets)

### Copy Guidelines
- This section should feel like you're reading the visitor's mind
- Don't sell here — just validate the problem
- Keep it brief: 50-100 words

---

## Section 3: Solution
**Goal:** Position ${productLabel} as the logical answer to the problem just named.

### Components
- **Solution headline:** Bridge from problem to answer
  - Example: "There's a better way."
- **Solution statement:** 2-3 sentences introducing ${productLabel} as the answer
- **Key differentiator:** What makes this solution different from alternatives?

### Copy Guidelines
- Transition naturally from Section 2
- Don't list features yet — stay at the benefit/outcome level

---

## Section 4: Features / Benefits
**Goal:** Build conviction with specific proof of value.

### Components
- **3-5 key benefit blocks**, each containing:
  - Icon or illustration
  - Benefit headline (what the user gains)
  - 1-2 sentence description (how ${productLabel} delivers it)
- **Layout options:** 3-column grid, alternating left/right, or tabbed

### Copy Guidelines
- Lead each block with the benefit, not the feature
  - ✅ "Publish without the back-and-forth" (benefit)
  - ❌ "Multi-user approval workflows" (feature)
- Use numbers where possible: "Save 5 hours per campaign"

---

## Section 5: Social Proof
**Goal:** Reduce risk perception and build trust through third-party validation.

### Components (use 2-3 of these)
- **Customer testimonials:** Specific outcome-based quotes with name, title, and photo
  - Best format: "[Specific result] since using [Product]. — Name, Title at Company"
- **Logo bar:** Recognizable brand logos ("Trusted by teams at...")
- **Case study teaser:** Headline stat + "Read how Company X achieved Y"
- **Review aggregates:** Star ratings with count ("4.8/5 from 1,200+ reviews")
- **Press mentions:** "As seen in Forbes, TechCrunch..."

### Copy Guidelines
- Specificity beats vague praise: "Increased leads by 40%" beats "Great product!"
- Match testimonials to the objections visitors likely have

---

## Section 6: Final CTA
**Goal:** Convert the visitor who is now ready to act.

### Components
- **Restate the core value proposition** (brief)
- **Primary CTA button** — same as hero or stronger with urgency
- **Urgency element (optional):** "Free for 14 days", "Limited spots available", "No credit card required"
- **Risk reversal:** Address the biggest fear ("Cancel anytime", "30-day money back")
- **Secondary CTA (optional):** For visitors not ready to convert — "Book a demo instead"

### Copy Guidelines
- Mirror the headline from Section 1 for psychological closure
- The risk reversal must be visible near the CTA button
- Keep the form minimal: ask only what's absolutely needed

---

## Page-Level Guidelines
- **Single focused goal:** One primary CTA throughout the page
- **Navigation:** Consider removing top nav to reduce exit paths
- **Mobile-first:** Each section must work at 375px width
- **Page speed:** Under 3 seconds load time — compress images, defer scripts
- **A/B test priority:** Hero headline first, then CTA copy, then social proof placement`

      return msg('assistant', text)
    },
  },

  {
    name: 'image_guidelines',
    title: 'Image Guidelines',
    description: 'Aspect ratios, alt text rules, format preferences, file size limits',
    argsSchema: { imageType: z.string().optional() },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const imageType = args['imageType'] as string | undefined

      const imageTypeSection = imageType
        ? (() => {
            const type = imageType.toLowerCase()
            let specificGuidance = ''

            if (type === 'hero') {
              specificGuidance = `\n## Hero Image Specifics\n- **Dimensions:** 1920x1080px (16:9) minimum, 2560x1440px for large displays\n- **Subject placement:** Keep primary subject in the center-right to avoid overlap with headline text (typically on the left)\n- **Max file size:** 400-500KB (heroes are allowed larger due to visual impact)\n- **Format:** WebP with JPEG fallback\n- **Avoid:** Stock photo clichés (handshakes, people staring at laptops in cafes)\n- **Alt text:** Describe what's shown, include brand context where natural\n`
            } else if (type === 'thumbnail') {
              specificGuidance = `\n## Thumbnail Image Specifics\n- **Dimensions:** 800x600px (4:3) or 400x400px (1:1) for square contexts\n- **Max file size:** 80-120KB\n- **Format:** WebP preferred\n- **Composition:** Clear focal point — thumbnails are viewed small, avoid busy backgrounds\n- **Text overlay:** If adding text, ensure minimum 4.5:1 contrast ratio\n- **Alt text:** Describe the content the thumbnail represents, not just what's in the image\n`
            } else if (type === 'og' || type === 'open graph') {
              specificGuidance = `\n## OG (Open Graph) Image Specifics\n- **Dimensions:** Exactly 1200x630px\n- **Max file size:** 300KB (Facebook and LinkedIn have limits)\n- **Format:** JPEG or PNG (not WebP — limited social platform support)\n- **Safe zone:** Keep important content within 1000x520px centered area (edges may be cropped on some platforms)\n- **Text:** Large, readable at thumbnail size — minimum 32px equivalent\n- **Branding:** Include logo in a consistent position (top-left or bottom-right recommended)\n- **Alt text:** Write as if describing the image to someone who can't see social card previews\n`
            } else {
              specificGuidance = `\n## Notes for "${imageType}" Images\nRefer to the general guidelines below. If this image type has specific use cases in your CMS, add custom dimension rules to this section.\n`
            }

            return specificGuidance
          })()
        : ''

      const text = `# Image Guidelines
${imageTypeSection}
## Aspect Ratios by Use Case

| Image Type        | Aspect Ratio | Recommended Dimensions |
|-------------------|-------------|------------------------|
| Hero / Banner     | 16:9        | 1920×1080px minimum    |
| Blog thumbnail    | 4:3         | 800×600px              |
| Square thumbnail  | 1:1         | 400×400px              |
| OG / Social share | 1.91:1      | 1200×630px             |
| Portrait          | 3:4         | 600×800px              |
| Team / Headshot   | 1:1         | 400×400px              |
| Logo              | Variable    | Min 200px wide, SVG preferred |

---

## Alt Text Rules

### What Alt Text Is For
Alt text serves screen readers, search engines, and cases where images fail to load. Write it for a person who cannot see the image.

### Rules
- **Be descriptive and specific** — describe what is actually shown
- **Do not start with** "Image of...", "Photo of...", "Picture of..." — screen readers already announce "image"
  - ❌ "Photo of a woman using a laptop"
  - ✅ "Marketing manager reviewing campaign analytics on a laptop at her desk"
- **Include keyword naturally** when the image is genuinely relevant to the page's topic
- **Functional images** (buttons, icons): describe the function, not the appearance
  - ❌ "Arrow icon"
  - ✅ "Next slide"
- **Decorative images:** Use empty alt attribute \`alt=""\` so screen readers skip them
- **Length:** Under 125 characters — concise but complete

---

## File Format Preferences

### Primary Format: WebP
- 25-35% smaller than JPEG at equivalent quality
- Supports both lossy and lossless compression
- Supports transparency (replaces PNG in most cases)
- Browser support: All modern browsers

### Fallback: JPEG
- For environments where WebP is not supported
- Quality setting: 80-85% (good balance of quality vs. size)
- Use for photographs, not graphics with flat colors

### When to Use PNG
- Screenshots with text (crisp edges required)
- Images requiring full transparency
- Converting to WebP is still recommended when possible

### When to Use SVG
- Logos
- Icons
- Illustrations with flat colors
- Anything that needs to scale to any size

### Avoid GIF
- Use MP4/WebM video or CSS animation instead
- GIF files are larger and lower quality than alternatives

---

## File Size Limits

| Use Case         | Max File Size | Notes                                    |
|------------------|--------------|------------------------------------------|
| Web thumbnails   | 100KB        | Strict — these load in lists/grids       |
| Blog images      | 150KB        | Per image in article body                |
| Hero images      | 500KB        | One per page, loaded prominently         |
| OG/Social images | 300KB        | Social platforms may reject larger files |
| SVG icons        | 10KB         | Inline SVG preferred for critical icons  |

**Optimization tools:** Squoosh (squoosh.app), ImageOptim (Mac), Sharp (Node.js)

---

## Filename Conventions

- **Format:** kebab-case (all lowercase, hyphens between words)
- **Descriptive:** Describes the content, not the position or date
  - ✅ \`team-meeting-product-review.webp\`
  - ❌ \`IMG_4892.jpg\` or \`hero-image-final-v3.jpg\`
- **Include keyword** where naturally relevant to the page content
- **No spaces or special characters** in filenames
- **Keep short:** Under 5 words where possible

---

## Responsive Image Best Practices

- Use \`srcset\` and \`sizes\` attributes for responsive images
- Provide at least 2 sizes: mobile (480-768px wide) and desktop (1200-1920px wide)
- Use \`loading="lazy"\` on all below-the-fold images
- Use \`loading="eager"\` and \`fetchpriority="high"\` on the hero/LCP image
- Set explicit \`width\` and \`height\` attributes to prevent layout shift (CLS)`

      return msg('assistant', text)
    },
  },

  {
    name: 'translation_guidelines',
    title: 'Translation Guidelines',
    description: 'Preserve SEO intent, adapt cultural references, maintain CTA urgency',
    argsSchema: {
      targetLocale: z.string().optional(),
      sourceText: z.string().optional(),
    },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const targetLocale = args['targetLocale'] as string | undefined
      const sourceText = args['sourceText'] as string | undefined

      const localeNotes: Record<string, string> = {
        'fr': `\n## Locale Notes: French (fr)\n- Formal register ("vous") is standard for B2B; "tu" only if brand explicitly targets a young/casual audience\n- French punctuation rules: spaces before ":;!?" — \`Bonjour : voici votre résultat !\`\n- Avoid anglicisms where French equivalents exist ("logiciel" not "software", though some tech terms are acceptable)\n- French SEO keywords often differ significantly from literal translations — research fr-FR vs fr-CA separately\n- Legal content (GDPR notices, terms) requires certified translation\n`,
        'fr-fr': `\n## Locale Notes: French France (fr-FR)\n- Formal register ("vous") standard\n- Use French spacing rules before punctuation marks (:;!?)\n- fr-FR and fr-CA can have vocabulary differences — keep them as separate locales\n- Accent marks are required (é, è, ê, à, ù, ç) — missing accents look unprofessional\n`,
        'fr-ca': `\n## Locale Notes: French Canada (fr-CA)\n- More informal register than fr-FR is acceptable\n- Different vocabulary from France: "courriel" vs "email", "magasiner" vs "faire du shopping"\n- Quebec has strict language laws (Bill 101) — commercial content must be in French\n`,
        'de': `\n## Locale Notes: German (de)\n- Formal register ("Sie") for B2B; "du" for consumer brands targeting younger audiences\n- German compound words can be very long — test UI for text overflow at copy stage\n- German text is typically 20-30% longer than English equivalents — allocate extra space in designs\n- SEO: Research German keyword variants — direct translations often aren't the searched terms\n- Strict data privacy culture — GDPR messaging should be thorough, not minimal\n`,
        'es': `\n## Locale Notes: Spanish (es)\n- Distinguish between es-ES (Spain) and es-MX / es-419 (Latin America) — vocabulary and formality differ\n- Spain: "vosotros" form; Latin America: "ustedes"\n- Latin American Spanish is generally preferred for broader reach unless targeting Spain specifically\n- Spanish text is typically 15-25% longer than English\n`,
        'es-mx': `\n## Locale Notes: Spanish Mexico (es-MX)\n- "Ustedes" (not "vosotros") for second person plural\n- Informal "tú" is acceptable in consumer contexts\n- Avoid Castilian Spanish vocabulary that sounds formal or foreign to Mexican readers\n- High mobile usage — ensure copy works well at small sizes\n`,
        'ja': `\n## Locale Notes: Japanese (ja)\n- Honorific language levels (keigo) are critical — use 丁寧語 (polite) for B2B\n- Japanese text is typically shorter than English in character count but needs different layout consideration\n- Avoid humor or idioms that don't translate — Japanese business communication prefers directness and respect\n- CTAs: Strong action language is culturally appropriate; urgency tactics should be subtle\n- Line breaks and text layout are more rigid — test thoroughly\n`,
        'zh': `\n## Locale Notes: Chinese (zh)\n- Distinguish Simplified (zh-CN, mainland China) vs Traditional (zh-TW, Taiwan; zh-HK, Hong Kong)\n- Never use Simplified characters for Traditional Chinese audiences or vice versa\n- Chinese text is significantly shorter than English equivalent — design needs extra consideration\n- SEO: Chinese search engines (Baidu) have different ranking factors; Baidu prefers .cn domains and Chinese hosting\n`,
        'pt': `\n## Locale Notes: Portuguese (pt)\n- Distinguish pt-BR (Brazil) from pt-PT (Portugal) — spelling, vocabulary, and tone differ\n- Brazilian Portuguese is generally more informal and is the larger market\n- "Você" is standard for Brazil; European Portuguese uses more formal constructions\n`,
        'pt-br': `\n## Locale Notes: Portuguese Brazil (pt-BR)\n- More informal register than European Portuguese\n- Brazil has a strong preference for local cultural references\n- Significant mobile-first audience\n- Brazilian SEO market is competitive — keyword research specifically for pt-BR is essential\n`,
        'ar': `\n## Locale Notes: Arabic (ar)\n- Right-to-left (RTL) layout — all UI must be mirrored\n- Modern Standard Arabic (MSA) for formal content; be aware of regional dialect differences\n- Numbers: Eastern Arabic numerals (٠١٢٣) used in some contexts; Western numerals acceptable in tech\n- Dates and time formats vary by region\n- Test thoroughly for RTL layout issues\n`,
      }

      const normalizedLocale = targetLocale?.toLowerCase().replace('_', '-') || ''
      const localeSection = normalizedLocale && localeNotes[normalizedLocale]
        ? localeNotes[normalizedLocale]
        : targetLocale
          ? `\n## Locale Notes: ${targetLocale}\nNo specific pre-built notes for this locale. Apply general translation guidelines and conduct locale-specific keyword and cultural research before publishing.\n`
          : ''

      const sourceTextSection = sourceText
        ? `\n## Source Text Review\nSource text provided:\n\n> ${sourceText}\n\n### Quick Assessment Checklist\n- [ ] Identify idioms or culturally-specific expressions that need adaptation\n- [ ] Note any humor or wordplay that requires equivalent (not literal) translation\n- [ ] Flag brand names, product names, or proper nouns that should NOT be translated\n- [ ] Check for any urgency language (CTAs) that needs equivalent emotional weight in target language\n- [ ] Identify any numbers, dates, or measurements that may need formatting changes\n`
        : ''

      const text = `# Translation Guidelines
${localeSection}${sourceTextSection}
## Core Principles

### 1. Preserve SEO Intent — Not Literal Keywords
Keywords rarely translate directly. A literal translation may be grammatically correct but not what people actually search for.

**Process:**
- Identify the primary keyword in the source
- Research what people in the target locale actually search for (use Google Search Console, Keyword Planner, or Ahrefs for that locale)
- Use the researched keyword — not the literal translation
- Update meta title, meta description, H1, and slug with the locale-appropriate keyword

**Example:**
- English: "project management software" (high volume)
- ❌ Literal French: "logiciel de gestion de projet" (lower volume)
- ✅ Researched French: "outil de gestion de projet" (how French users actually search)

### 2. Adapt Cultural References and Idioms
Idioms, metaphors, and cultural references almost never translate directly.

**Rules:**
- Replace idioms with the equivalent meaning in the target culture
  - ❌ Translating "hit the ground running" literally
  - ✅ Find an equivalent idiom or rephrase for clarity
- Sports references may not resonate (e.g., American football idioms in European markets)
- Humor: When in doubt, remove it. Bad humor across cultures is worse than no humor.
- Examples: Use examples relevant to the target market when possible

### 3. Maintain CTA Urgency and Action-Orientation
CTAs must feel compelling in the target language — urgency doesn't always survive literal translation.

**Guidelines:**
- Test translated CTAs with native speakers for emotional impact
- Verb-first structure should be maintained where grammatically possible
- "Free" is a universal motivator but the word/concept must feel natural
- Urgency phrases ("Act now", "Limited time") — ensure these feel culturally normal, not pushy
- If urgency feels out of place in the target culture, use benefit-framing instead

### 4. Do Not Translate
The following should remain in their original form unless there is a well-known localized name:
- **Brand names:** Product names, company names
- **Technical terms and acronyms:** API, CRM, SaaS (unless a local equivalent is standard)
- **Proper nouns:** People's names, city names (unless the city has a standard localized name)
- **Legal terms:** Use certified translation for legal documents; never self-translate legal content
- **URLs and slugs:** Use locale-specific keyword research for slugs, not translations

### 5. Match Tone and Formality to Target Culture
Formality levels vary significantly by culture and language.

| Culture | Formality Tendency |
|---------|-------------------|
| German (B2B) | Formal ("Sie") |
| French (B2B) | Formal ("vous") |
| Japanese | Highly formal (keigo) |
| Brazilian Portuguese | Relatively informal |
| American English | Casual-professional |

- Research the convention for your specific audience (B2B vs B2C also affects this)
- Be consistent — don't mix formal and informal registers in the same page

### 6. Preserve Content Structure
- Maintain heading hierarchy (H1 → H2 → H3)
- Keep the same paragraph structure where possible
- Preserve bullet points and numbered lists
- Do not add or remove sections without editorial approval
- Translate caption text, button labels, and form field placeholders — don't leave English fallbacks

### 7. Account for Text Expansion/Contraction
Many languages expand significantly from English:

| Language | Typical Expansion |
|----------|------------------|
| German   | +20-30%          |
| French   | +15-25%          |
| Spanish  | +15-25%          |
| Italian  | +15-20%          |
| Japanese | -10 to +10%      |
| Chinese  | -20 to -30%      |

- Alert designers/developers when translated text may overflow UI components
- Test all translated UI strings in the actual interface before publishing

## Quality Review Checklist

Before approving a translation for publishing:
- [ ] Native speaker review (not just translator review)
- [ ] SEO keywords researched and applied (not literally translated)
- [ ] All CTAs reviewed for emotional impact and urgency
- [ ] Cultural references adapted (not just translated)
- [ ] Brand/product names preserved
- [ ] Tone and formality consistent throughout
- [ ] Text expansion tested in UI
- [ ] Meta title and description within character limits in target language
- [ ] URL slug updated with locale-researched keyword
- [ ] Alt text translated for all images`

      return msg('assistant', text)
    },
  },

  {
    name: 'pseo_page_template',
    title: 'pSEO Page Content Template',
    description:
      'Content template system for generating service-page copy with headline, intro, localContent, and CTA variants',
    argsSchema: {
      serviceName: z.string(),
      city: z.string(),
      state: z.string(),
    },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const svc = args['serviceName'] as string
      const city = args['city'] as string
      const state = args['state'] as string

      const text = `# pSEO Page Content Template

## Service: ${svc}
## Location: ${city}, ${state}

---

## Headline Variants (H1)
Pick one. Each must include the primary keyword "${svc} in ${city}" naturally.

1. "Professional ${svc} in ${city}, ${state}"
2. "Trusted ${svc} Services in ${city}"
3. "Expert ${svc} for ${city} Residents"
4. "${city}'s Top-Rated ${svc} Provider"
5. "Reliable ${svc} in ${city}, ${state} — Get a Free Quote"

---

## Introduction Variants (150-200 words each)
Each must mention "${svc} in ${city}" within the first 100 words.

### Variant A — Problem-Solution
"Finding reliable ${svc} in ${city} shouldn't be stressful. Whether you're dealing with [common problem 1] or need [common need], our team provides [key benefit]. Serving ${city} and surrounding ${state} communities, we bring [X] years of experience to every project. [Add local detail about ${city} — neighborhood, landmark, or community reference]. Contact us today for a free consultation."

### Variant B — Authority-Led
"As ${city}'s trusted ${svc} provider, we've helped [hundreds/thousands] of homeowners and businesses across ${state}. Our licensed professionals specialize in [service aspect 1], [service aspect 2], and [service aspect 3]. [Local detail about serving the ${city} area]. We're committed to transparent pricing and guaranteed satisfaction."

### Variant C — Benefit-Forward
"Get professional ${svc} in ${city}, ${state} — fast, affordable, and backed by our satisfaction guarantee. We understand that ${city} [local context — climate, building types, common issues]. That's why we offer [specific solution]. From [service type A] to [service type B], we handle it all."

---

## Local Content Variants (100-150 words)

### Variant 1 — Area Expertise
"We proudly serve ${city} and the greater ${state} area, including [nearby cities/neighborhoods]. Our team understands the unique [challenges/needs] of ${city} properties, from [local factor 1] to [local factor 2]. Whether you're in [neighborhood 1] or [neighborhood 2], we're just a call away."

### Variant 2 — Community Connection
"${city} is more than our service area — it's our community. We've been providing ${svc} to local homes and businesses for [X] years, building relationships based on quality work and honest pricing. As a locally operated company, we take pride in keeping ${city} [relevant outcome]."

---

## CTA Variants

1. "Get Your Free ${svc} Quote in ${city}" (primary — form submission)
2. "Call Now for ${svc} in ${city}" (phone-oriented)
3. "Schedule Your ${svc} Consultation Today" (appointment-oriented)`

      return msg('assistant', text)
    },
  },

  {
    name: 'pseo_enrichment_prompt',
    title: 'pSEO AI Enrichment Prompt',
    description:
      'AI enrichment prompt template for improving template-generated service-pages with unique, locally relevant content',
    argsSchema: {
      serviceName: z.string(),
      city: z.string(),
      stateCode: z.string(),
    },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const svc = args['serviceName'] as string
      const city = args['city'] as string
      const sc = args['stateCode'] as string

      const text = `# AI Enrichment Prompt for ${svc} in ${city}, ${sc}

Use this prompt to generate unique content for the service-page. Feed it to an AI model along with any available context about the service and location.

---

## Enrichment Prompt

You are writing content for a local service page about "${svc} in ${city}, ${sc}".

**Requirements:**
1. Write a unique 150-200 word introduction that:
   - Mentions "${svc} in ${city}" within the first sentence
   - References at least one specific detail about ${city} (geography, climate, demographics, or local landmarks)
   - Explains why ${city} residents specifically need this service
   - Includes a clear value proposition
   - Ends with a soft call-to-action

2. Write a 100-150 word "Local Expertise" section that:
   - Names 2-3 nearby cities or neighborhoods served
   - Mentions a local factor relevant to this service (e.g., climate, building codes, common property types)
   - Establishes credibility specific to the ${city} market

**Constraints:**
- Do NOT use generic filler phrases ("in today's world", "when it comes to", "look no further")
- Do NOT repeat the same sentence structure more than twice
- Maintain a professional but approachable tone
- Include the primary keyword "${svc} in ${city}" exactly 2-3 times across both sections
- Ensure Flesch-Kincaid reading ease > 60

**Output Format:**
Return JSON: { "introduction": "...", "localContent": "...", "contentSource": "ai-enriched", "contentQualityScore": 75 }`

      return msg('assistant', text)
    },
  },

  {
    name: 'pseo_launch_readiness',
    title: 'pSEO Launch Readiness Assessment',
    description:
      'Pre-launch quality thresholds and readiness criteria for programmatic SEO sites',
    argsSchema: {
      pageCount: z.string().optional(),
    },
    handler: (args: Record<string, unknown>, _req: PayloadRequest, _extra: unknown) => {
      const pageCount = args['pageCount'] as string | undefined
      const pageNote = pageCount ? `\n**Target page count:** ${pageCount}\n` : ''

      const text = `# pSEO Launch Readiness Assessment
${pageNote}
## What "Ready to Launch" Looks Like

A programmatic SEO site is ready for launch when it meets ALL of the following thresholds. Use the \`run_prelaunch_checklist\` tool to validate these automatically.

---

## Critical Requirements (Must Pass)

### CMS Data
- [ ] ≥1 published service exists
- [ ] ≥1 published location exists
- [ ] Service-pages generated for all service×location combinations
- [ ] ≥3 FAQs per service (for FAQ schema markup)
- [ ] ≥2 testimonials per service×location combo (for social proof)

### Content Quality
- [ ] **Zero** pages with contentQualityScore < 30 (deindex risk)
- [ ] **<20%** of pages are template-only (contentSource: 'template')
- [ ] Average quality score across all pages ≥ 60
- [ ] No pages with empty introduction AND empty localContent
- [ ] All pages have ≥300 words of indexable content

### SEO Completeness
- [ ] **100%** of pages have seoTitle (≤60 chars)
- [ ] **100%** of pages have seoDescription (≤160 chars)
- [ ] **Zero** duplicate seoTitle values
- [ ] **Zero** duplicate seoDescription values
- [ ] All slugs pass validation (lowercase, hyphens, ≤60 chars/segment)
- [ ] Primary keyword present in H1 of every page

### Internal Linking
- [ ] **Zero** orphan pages (every page has ≥3 inbound links)
- [ ] Every service-page links to its pillar service page
- [ ] Cross-service links present for same-location pages
- [ ] Sibling links present for same-service pages

### Technical
- [ ] Canonical URLs configured correctly (absolute, HTTPS, no trailing slash)
- [ ] XML sitemap includes all published pages
- [ ] robots.txt allows crawling of all published pages
- [ ] No redirect chains (all redirects are direct 301s)

---

## Warning Thresholds (Should Fix Before Launch)

| Metric | Warning Level | Action |
|--------|--------------|--------|
| Template-only pages | >10% | Run \`enrich_service_pages\` |
| Average quality score | <70 | Prioritize enrichment |
| Content uniqueness | Jaccard >0.4 for any pair | Rewrite flagged pages |
| Keyword stuffing | >8 occurrences on any page | Edit meta fields |
| Missing testimonials | Any combo with <2 | Run \`seed_testimonials\` |
| Stale content | Any page >60 days old | Schedule content refresh |

---

## Launch Sequence

1. Run \`list_collection_stats\` — verify all collections populated
2. Run \`run_prelaunch_checklist\` — check all categories pass
3. Run \`validate_content_uniqueness\` — ensure no near-duplicates
4. Run \`audit_canonical_consistency\` — verify canonical URLs
5. Run \`audit_slugs\` — validate all URL structures
6. Fix any failing checks
7. Re-run checklist until all pass
8. Launch and monitor Google Search Console for crawl/index issues`

      return msg('assistant', text)
    },
  },
]
