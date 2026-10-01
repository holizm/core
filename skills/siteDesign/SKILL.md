---
name: site-design
description: Design or redesign a public website in the Holizm software product line, including its page concept, visual system, and site implementation when requested. Use for homepages, landing pages, and site themes; exclude panels and API-only work.
---

# Site design

Design a website around the product's actual promise and the visitor's next useful action. Match the deliverable to the request: a design proposal, a working site, or a deployed site.

## Understand the site

- Read the user's product description and identify the audience, distinctive value, primary action, and essential pages. Treat stated facts and preferences as constraints. Ask about a missing decision only when it materially changes the result; continue work that does not depend on the answer.
- Inspect the runnable site's current pages, theme, content data, and assets. Inspect `$HOME/site` and relevant part sites for reusable structures, components, and interactions. Use a comparable existing site when it clarifies a platform convention.
- Follow the applicable `AGENTS.md` and repository policies. Keep domain-neutral behavior in site core, reusable domain UI in part sites, and only product-specific composition in the runnable site.

## Shape the design

- Make the product's distinctive value clear in the first screen, then use the page sequence to show how it works, establish trust, and support the primary action. Choose the sequence for this product rather than applying a fixed landing-page template.
- Define a coherent visual direction through typography, spacing, colors, imagery, interaction, and responsive composition. Reuse established brand assets and theme conventions when present. Make the key task and action understandable on small screens.
- For a design-only request, provide a concrete, reviewable concept or mockup. For an implementation request, build the page and inspect the rendered result at desktop and mobile sizes. Refine visible layout or content problems before reporting completion.

## Content and implementation

- Store homepage, layout, CTA, and SEO copy in the `values` collection of the `contents` database, following the existing `contents` schema and `getValues` flow. Keep interface labels and reusable messages in localization resources. Do not move page copy into localization files.
- Have the API return content in its final display shape. Keep Qwik site components focused on rendering and unavoidable browser interaction.
- Reuse matching site-core and part-site components before creating new ones. When a new component is needed, place it at the broadest reusable layer and keep its styling in the site's theme CSS. Keep runnable pages as compositions of those components.
- Verify the relevant build, content loading, links, responsive layout, and the primary action. State any unverified behavior plainly.
