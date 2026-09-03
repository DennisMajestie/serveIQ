import { z, defineCollection } from 'astro:content';

const faqCollection = defineCollection({
  type: 'data',
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string(),
  }),
});

export const collections = { faq: faqCollection };
