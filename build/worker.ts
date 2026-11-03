import handler from "vinext/server/fetch-handler";

// Cloudflare Worker entry point for the Law Girl site.
export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return handler.fetch(request, env, ctx);
  },
};
