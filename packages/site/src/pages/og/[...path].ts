import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";

const paths = await getCollection("docs");
const pages = Object.fromEntries(
	paths.map(({ data, id }) => {
		return [id, { data }] as const;
	}),
);

export const { GET, getStaticPaths } = await OGImageRoute({
	getImageOptions: (_, { data }) => ({
		bgGradient: [
			[35, 42, 28],
			[14, 21, 7],
		],
		description: data.description,
		format: "WEBP",
		logo: {
			path: "./public/logo.png",
			size: [138],
		},
		padding: 80,
		title: data.title,
	}),
	pages,
	param: "path",
});
