import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection } from "astro:content";
import { blogSchema } from "starlight-blog/schema";
import { topicSchema } from "starlight-sidebar-topics/schema";

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: (context) => blogSchema(context).merge(topicSchema),
		}),
	}),
};
