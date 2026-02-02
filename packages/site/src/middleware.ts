import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
	console.log("[Josh] Looking at url:", context.request.url);

	if (context.request.url !== context.request.url.toLowerCase()) {
		return Response.redirect(context.request.url.toLowerCase(), 307);
	}

	return next();
});
