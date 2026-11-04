# Chinchilla Design — site overhaul plan

Started 2026-11-04. Branch: `site-overhaul`. Live site: https://chinchilla.design (Netlify, from GitHub `main`).

## Goal

Replace the single-page launch site with a ground-up rebuild that:

1. Explains clearly what Chinchilla Design is and why it is different (the current "DFMA" section does not).
2. Gives every project its own page and URL.
3. Loads fast on every device.
4. Is easy to add projects to without touching code.

Reference site Ben likes: https://spearhead.ca (Nelson, BC timber fabricator). What to borrow is the *structure*, not the video: a Process page that reads as a manifesto, one page per project with a metadata block, light and spacious layout. Spearhead's Process page is eleven short headed statements with sketches and shop photos, no video required.

## Site architecture

| URL | Purpose |
| --- | --- |
| `/` | Home. One sentence on what we are, a few featured projects, a short "how we work" teaser, contact. |
| `/process` (or `/approach`) | The explainer. The page that replaces the DFMA section. See below. |
| `/projects` | Grid of all projects, filterable by type. |
| `/projects/<slug>` | One page per project: hero image, metadata block, story, gallery, related projects. |
| `/studio` | About, the name story, team, shop and equipment. |
| `/contact` | Form (Netlify Forms) plus email, phone, address, map link. |

Project metadata block (borrowed from Spearhead's, adapted): Client / Designer or Architect / Location / Type / Year / Our scope / Collaborators / Materials. Fields are optional per project.

## Technical approach

- **Astro** static site, built by Netlify from the repo. No server, no CMS to pay for.
- Projects are a content collection: one folder per project with an `index.md` (frontmatter = metadata, body = story) and its photos. Adding a project = adding a folder.
- Images go through Astro's image pipeline: capped at ~2400px, WebP/AVIF, `srcset` for phones, lazy below the fold. Originals stay out of the repo (currently 71 MB of JPEGs are served raw; Wall Art photos are 8–11 MB each).
- Video (Tiny House walkthrough) is poster + click to play, not autoplay.
- Keep Google Analytics, the security headers and the `images/*` cache header from the current `netlify.toml`.
- Redirect the old hash URLs (`/#projects`, `/#about`, `/#contact`) to the new pages.
- `prefers-reduced-motion` respected; no custom cursor.

## Design direction

Open. Ben is not attached to the current dark look. Decide at the design phase after the content exists. Content first, then layout, then polish.

Reference sites:

- **spearhead.ca** (Nelson, BC timber). Like: the Process page as a manifesto, per-project pages with a metadata block, light and spacious. Not ours: the video-driven home page.
- **workbench.ca** (Vancouver). Like: the photography. Full-bleed, editorial, lots of white, objects shot in natural light with shadow and texture. Site is otherwise two pages (Work, About) with almost no copy, so it is a photo reference, not a structure reference.
- **origins.work** (Vancouver). Ben does not love it. It is a storefront: catalogue rows with SKU, price and add-to-cart, dense small type, and a long client list in the sidebar. Avoid the catalogue density and the shop framing. Two things worth noting anyway: the clients-and-collaborators list is persuasive social proof for designers, and the "trade program" line speaks directly to interior designers. A short "designers and studios we've worked with" line on our Process or Studio page could do the same without the shop feel.

Equipment question: a designer deciding whether to call cares about capacity (sheet size, thickness, three-axis vs five-axis, finishing on site), not brand names. Recommendation: one sentence of capacity on the studio page, no tool inventory. Ben to confirm.

## The explainer (replaces "DFMA")

This is the heart of the rebuild and needs Ben's input before anything is written. Working structure:

1. **What we are, in one sentence.** Settled 2026-11-04, Ben's wording.

   Headline (home page, page title):
   > Chinchilla Design is a Vancouver studio that designs and builds things in wood you didn't know were possible. We work with you from the first concept, developing the core idea right through to a built reality.

   Home page display version (name dropped, logo sits above it):
   > We design and build things in wood you didn't know were possible.

   Supporting line (Process page opener, meta description):
   > Chinchilla Design is a Vancouver design and fabrication studio that helps architects, designers and clients take on complex projects in wood. We develop ambitious ideas with you from the first sketch, then build them ourselves.

   Positioning note: design partner, not a fabricator. The site must say people can ask for things in wood they didn't think were possible, and that we advance the idea, not just build what is drawn.
2. **Who it is for.** Settled 2026-11-04.

   1. **Interior designers** first. All business to date has come through designers. The Process page speaks to them, and the home page features the projects that came through designers.
   2. **Architects** as a keyword and a named audience, but not the frame. Keep "architects, designers and clients" phrasing; don't let the site read as architecture-only.
   3. **Hospitality, commercial and private clients** as the wider "and clients." Still welcome, still shown, not the lead voice.

   Implication for copy: lead with the designer's situation (a detail, feature or piece they can picture but can't find a shop for), not the architect's (structure, coordination, schedule). Implication for search: page titles and headings carry both "designers" and "architects."
3. **How we are different.** Candidate angles seen in the current About text and the project stories; Ben to confirm, cut and add:
   - Design fluency *and* a shop: one party carries intent from sketch to install, so nothing is lost in handoff. (holds)
   - Early involvement (design-assist): material strategy, fabrication logic and real feasibility before the design is locked. (holds)
   - A new language in wood, not robots replacing carvers. Parametric design and CNC are used to develop projects whose language and scope would be near impossible any other way: not a faster way to make the same things, but a way to make different things. (Ben, 2026-11-04. The current About text already has the seed: "a new design language is emerging.")
   - Finish and hand work on top of machine precision (the two left visible, as in Wall Art). (holds)
   - An intimate working relationship with a hardworking, highly capable collaborator. The studio is small enough that the designer deals directly with the people developing and building the piece, in Vancouver. Keep the focus on the relationship and the collaborator, not on Ben as an individual. (Ben, 2026-11-04)
4. **How a project runs.** Spearhead does this as a list of headed statements. Ours could follow the actual phases: feasibility and quoting → design assist → shop drawings → prototype → CNC → joinery → finish → install. Each gets one or two sentences and a real photo.
5. **Proof.** Singing Hollow (Ben, 2026-11-04). Co-designed with Brent Comber for IDS West 2026: parametric sphere, CNC-milled in the North Vancouver shop, a skin of individually shaped western red cedar tiles over a yellow cedar core, funnelling to a lit hollow. It fits every angle: a new language in wood, design and shop in one place, an intimate collaboration, hand finish over machine precision. Still needed from Ben: two or three sentences on what being in from the first idea changed (what Brent came with, what the parametric model and the shop made possible that wouldn't have been otherwise). IDS Pavilion (reclaimed UBC beams shaping the design) is the backup or a second short example.
6. **Call to action.** "Bring us in early" with a form.

Open questions for Ben (one at a time):

- [x] The one-sentence description.
- [x] Who the site is mainly for.
- [x] Which of the "different" angles are true and which are missing.
- [x] A story where early involvement saved a design: Singing Hollow. Still need Ben's two or three sentences on what changed.
- [x] Photos: anything on this computer and in the share section of the Chinchilla Design shared Google Drive can be shown (Ben, 2026-11-04). Candidate jobs from the suite: Fay Mihailides Design, Danco Interiors, Rethink, Ian & Wendy, Saturna Fire & Rescue. Next step: inventory those photo folders and shortlist.
- [x] No photo of Jamil. Team is presented without portraits: names and roles in text, with shop and work-in-progress photos carrying the page. This also suits angle 5 (the collaborator, not the individual).
- [x] Location: "North Vancouver" only, no street address. Phone as currently on the site. Equipment: undecided (see Design direction note).

## Phases

1. **Housekeeping.** Fast-forward stale local `main`, retire the Documents clone and the old worktree, delete leftover `claude/*` branches on GitHub. _(done: branch `site-overhaul` created)_
2. **Content.** Answer the open questions, write the explainer, migrate the seven project stories into markdown, write the studio and contact copy.
3. **Scaffold.** Astro project, content collection, image pipeline, Netlify build, deploy preview URL. _(done 2026-11-04 on `site-overhaul`: Astro 5, seven projects migrated to `src/content/projects/<slug>/index.md` with their photos, pages for home, process, projects, project detail, studio, contact and thanks; old page kept at `legacy/index.html`. `npm run dev` to preview, `npm run build` to build. Deploy preview URL comes when the branch is pushed and Netlify builds it.)_

   To add a project: copy a folder in `src/content/projects/`, replace the photos, edit `index.md`. The frontmatter fields are documented in `src/content.config.ts`.
4. **Templates.** Home, process, projects index, project page, studio, contact. Mobile first.
5. **Design pass.** Typography, colour, motion, hero imagery.
6. **Launch.** Lighthouse on phone and desktop, redirects, sitemap, LocalBusiness schema, social share images, merge to `main`.

## Photo inventory (2026-11-04)

Surveyed this computer and the shared drive's Share folder. Paths below are what to pull from.

### Ready to use

| Project | Where | What |
| --- | --- | --- |
| Singing Hollow (2026) | Drive: Share / Folder for Darya / Singing Hollow | Professional set: Matthew Thornhill (5+ files, 9–12 MB each, full-res), Iryna Avilova (IDS Design Festival / DelightMedia set, 12 files, web-res), Ben/Darya Photos (DSC JPGs + phone video), Video folder (5+ MOV clips, 5–55 MB). Also local: `Downloads\BEN HAYWARD` (the 12 DelightMedia files). **Best material we have.** |
| Singing Hollow process | `Desktop\New folder` (30 DSC photos, May 2026) | Shop photos: radial arm saw, stacked yellow cedar blocks, glued-up core. Good for the Process page. |
| IDS Pavilion (2025) | `Downloads\Images` (6 phone photos), existing site folder, Drive: Share / Photos to Share (HEIC originals) | What is on the site now plus a few more. |
| Lath Bench (2026) | `Active Projects\Brent Comber\extracted_images`, `Fay Mihailides\Baldwin\work\furniture` (DSC03668–03681) | Gallery and shop shots, same as site. |
| Chair (2025) | Drive: Share / Chair Photos (HEIC) | Same as site. |
| Tiny House, Sage Hayward, Wall Art | Existing site `images/`, Drive: Share / Photos to Share | As on site. Wall Art originals are 7008 x 4672. |

### Candidates needing a decision or more photos

| Project | Where | Notes |
| --- | --- | --- |
| Saturna Fire & Rescue sign | `Active Projects\Saturna Fire Department\Share` | Site photos of the old sign plus three rendered options and a texture close-up. No photo of the installed piece yet. Needs an install photo to be a project page; could be a Process page example of design options. |
| Ian & Wendy headboards | `Active Projects\Ian & Wendy Interior` | Grasshopper files (fluted headboard versions) and reference photos only. No photos of the built piece found locally. Ben to say whether it was built and photographed. |
| Havn Spa benches | `Active Projects\Havn Spa\Brief` | Four drawings (S-curve, hook, stair benches, vessel plan). Prospect, not built. Not for the site yet. |
| Fay Mihailides / Baldwin | `Active Projects\Fay Mihailides\Baldwin\work\*` | Renders, texture samples, precedents, egg_pro, relief, equilibrium. Designer client, so high value for the audience, but it is work in progress. Ben to say what is finished and cleared to show. |
| First & Royal | `Active Projects\First & Royal\Render` | Column wrap and capital renders. Status unknown. |
| Darya sign, CA Lyceum art hanging, Danco, POGO, Tactile Formation, Jacob Antoni, Andrew Van Egmond, Marko, Nexcore | Active Projects | No photos found locally. Danco and Rethink are paying clients in the suite with nothing on disk. |

### Instagram (chinchilla.design.vancouver)

Cleared by Ben as a source. Signed out, Instagram shows only the twelve most recent posts, which are nearly all Singing Hollow, and serves images compressed to about 1080 px. Two ways to get the whole feed at a usable size:

1. **Instagram data export** (Settings > Accounts Center > Your information and permissions > Download your information, choose "Media" and JSON or HTML). Returns every original upload with its caption and date. Best option: original files, captions double as draft project copy. Ben requests it; it arrives by email within a day or two.
2. Ben signs in to Instagram in the Claude browser pane himself; the full grid can then be browsed and shortlisted, but files are still 1080 px.

Profile bio reads "Designer and builder. Merging digital fabrication and traditional craftsmanship to create art with wood." Follower count is substantial and is worth a line on the site as social proof.

### Not found

No local photos for Danco Interiors or Rethink. If they were photographed, they are somewhere else (phone, Instagram, the client).

### Shortlist for launch

1. Singing Hollow, as the lead project and the Process page proof story.
2. IDS Pavilion.
3. Lath Bench.
4. Chair.
5. Wall Art.
6. Tiny House.
7. Sage Hayward Vineyards.

Ben (2026-11-04): Saturna sign photos are coming from him. The Chinchilla Instagram (chinchilla.design.vancouver) is cleared as a source; pull from it at liberty. Baldwin and Ian & Wendy still open. Seven projects is enough to launch; designer-client work is the gap to fill over time.

Housekeeping note: the Drive folder "Folder for Darya" contains a Google Doc titled "Instagram Login" alongside the photos. Worth moving out of a share folder.

## Current site inventory (for migration)

Projects: Singing Hollow (2026, IDS West, with Brent Comber), IDS Pavilion (2025), Tiny House (2023, HGTV feature, 4 press links), Lath Bench (2026, Brent Comber Originals), Wall Art (2026, private), Chair (2025, private), Winery Branding (2024, Sage Hayward Vineyards, Nuvo press link).

Services copy (16 items, process + sectors) lives in the current `index.html` around lines 3215–3295 and is worth keeping as source material.

About text, name story and team bios are in `index.html` around lines 2396–2450.
