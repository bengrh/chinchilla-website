# The journey: visual spec

Written 2026-11-06 before any scene code, so the look is decided and not improvised. Precedents and Ben's choices are in `docs/OVERHAUL-PLAN.md` and the plan of 2026-11-05.

## What it is

Three chapters, one per stage of a project, each a tall page with a fixed 3D scene behind the text. Scroll moves the camera and the scene. The scenes are built from the studio's own Rhino models, flat-shaded, no textures. Projects stay real pages; a chapter ends by pointing at the projects that prove it.

Working chapter names (Ben to confirm): **The idea**, **The development**, **The build**.

## The bar

The lab prototypes were rejected for looking cheap and for being effects on a page. So:

- Nothing floats in a void. Every scene has a ground plane, a horizon and a light that comes from somewhere.
- One palette per chapter, chosen, not random. Four tones each: ground, object, accent, haze.
- The camera moves like a dolly on a track, never like a mouse. Slow, one axis at a time, eased by scroll.
- Text is typeset exactly as the editorial site sets it. The scene does not change the type.
- The first paint is a designed poster rendered from the real scene, not a blank canvas.
- No loading spinners, no progress bars. The poster is on screen until the scene can replace it without a jump.

## Palette

The page stays `#0a0a0a`. Each chapter owns a muted tone family laid over it, the way BOCO gives each world a colour. Low saturation, high value range, so the flat shading reads as faceted light rather than cartoon colour.

| Chapter | Ground | Object | Accent | Haze (fog colour) |
| --- | --- | --- | --- | --- |
| The idea | `#141720` | `#8f94a6` graphite blue | `#f4f1ea` paper (the sketch line) | `#0d0f16` |
| The development | `#2a211a` | `#b59a78` pale oak | `#f97316` orange (the parameter) | `#16110d` |
| The build | `#13161a` | `#6e7681` steel | `#e9c46a` warm lamp | `#0e1013` |

Object colour is per material, flat. Two or three values of the same hue tell parts apart (bench slats alternate oak and darker oak). The accent is used once per scene, for the thing the chapter is about.

## Light rig (all chapters)

- Hemisphere light: sky = haze lifted 20 percent, ground = ground colour, intensity 0.9.
- One directional key, warm white, from upper left front, intensity 1.6, casting a soft shadow (PCF, map 1024, low radius) onto the ground plane only.
- One rim from behind right, intensity 0.5, cool, no shadow.
- Fog: `THREE.Fog(haze, near, far)` set so the ground fades to the page colour before the horizon.
- Materials: `MeshStandardMaterial` with `flatShading: true`, roughness 0.85, metalness 0, `toneMapped` on, ACES filmic, exposure 1.0.
- Ground: a large plane with the ground colour, receives shadows, slight `MeshStandardMaterial` roughness 1.

## Shading rules

- Flat shading on everything that was built; smooth only where the original surface is a true curve (the sphere's panels keep their facets, which is the point).
- Models are decimated to a facet size that reads at phone width, target 20k to 60k triangles per scene in total.
- No edges drawn, no outlines. Facets and shadow do the drawing.
- The sketch line in chapter one is the one exception: a `Line2` fat line in paper colour.

## Camera grammar

- Perspective, 35 degree vertical FOV, aspect from the viewport.
- Each chapter has three to five keyframes (position, look-at) on a scroll timeline from 0 to 1. GSAP ScrollTrigger scrubs the timeline with `scrub: 0.8` so the camera lags scroll a little.
- Only one thing moves at a time: the camera, or the objects. When objects rearrange, the camera holds.
- Dolly and pan only. No orbit, no roll, no zoom by FOV.
- The pointer moves the camera by at most 2 percent of its frame, eased, for life between scroll steps. Off on touch.

## Text over the scene

- The chapter has one text column, left aligned, max 36ch, same type as the editorial site: eyebrow (mono), heading (Inter 700, tight), body (Inter 400). Colour paper `#f4f1ea` on the dark scene; the scene darkens under the column with a soft vertical gradient so contrast is never left to luck.
- Each beat is a `<section>` of 100vh minimum with its text sitting in the lower third; the beat's scroll range drives that part of the scene timeline.
- Proof projects at the end use `ProjectCard.astro` on the editorial grid, scene fading out beneath.
- The next door closes the page: the next chapter's title in display type and its circle.

## Doors (home)

- Three circles in a row under the wordmark, Blandina's form. Thin paper outline, 1px, 22vw wide on desktop, 60vw stacked on phones.
- Inside each circle: the chapter poster, cropped to the circle, greyscale at rest, colour on hover (the editorial rule).
- Label under: number in mono and the chapter name in Inter 600.
- Hover starts the chapter's mini-scene in the circle only if the scene runtime is already loaded; otherwise the poster alone. Never load the 3D runtime for the home page unless the pointer rests on a door for 400ms.

## Motion rules

- Reduced motion: scenes do not scrub; each beat shows its poster frame; the text still works.
- No WebGL: the poster image per beat, the text, the proof, the door. Same page, no canvas.
- Phones: pixel ratio capped at 1.5, shadow map 512, fog closer. The scene runs if the device can hold 50 fps after two seconds; otherwise it drops to posters.

## Assets

- `public/models/lowpoly/<name>.glb`: decimated, Draco, no figures, no placeholder ottomans.
- `public/journey/posters/<chapter>-<beat>.webp`: rendered from the scene at 1600 wide, also the OG image for the chapter.
- The Stalactite blocks ship as a JSON of box centres and sizes, rebuilt in the scene as an instanced mesh, so each block can move on its own.

## Beats: The development

The chapter about the language, so the scene is the blocks. Beats on scroll:

1. **Flat field.** The table's block field laid flat as a plan on the ground, every block the same height, camera high and oblique. Eyebrow: the development. Heading: the model is the design.
2. **The parameter.** Scroll sweeps one number: block heights rise into the stepped underside. The accent orange marks the blocks that are moving. Camera holds.
3. **The table.** The top lands on the field; the camera dollies down to eye level; the ottomans are not there, the table stands alone on the ground. Text: samples, feasibility, what the machine can and cannot do.
4. **The slats.** The lath bench slats fan in from a flat stack beside the table and settle into the bench. Text: a new language, not a faster way to make the same things.
5. **Proof.** Scene fades to the page; project cards for the Stalactite Table and the Lath Bench; the door to The build.
