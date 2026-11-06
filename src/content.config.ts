import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One folder per project under src/content/projects/<slug>/
//   index.md   frontmatter = the metadata block, body = the story
//   *.jpg      the photos, referenced relatively from index.md
// Adding a project = adding a folder. Nothing else to edit.
const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(['Design / Build', 'Product Design', 'Brand Identity']),
      year: z.number(),
      client: z.string().optional(),
      designer: z.string().optional(), // architect or interior designer we worked with
      location: z.string().optional(),
      scope: z.array(z.string()).default([]),
      collaborators: z.array(z.string()).default([]),
      materials: z.array(z.string()).default([]),
      status: z.string().optional(),
      featured: z.boolean().default(false), // shows on the home page
      order: z.number().default(100), // lower = earlier in the grid
      summary: z.string().optional(), // one line for cards and the meta description
      model: z.string().optional(), // glTF under /public/models, e.g. /models/singing-hollow.glb
      hero: image(),
      heroAlt: z.string(),
      gallery: z
        .array(
          z.object({
            image: image().optional(),
            video: z.string().optional(), // path under /public, e.g. /video/x.mp4
            caption: z.string(),
          }),
        )
        .default([]),
      press: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
    }),
});

export const collections = { projects };
