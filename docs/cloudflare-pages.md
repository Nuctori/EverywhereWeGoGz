# Cloudflare Pages Deployment

This project can now be deployed to Cloudflare Pages without changing the asset path manually.

## What changed

- Vite now reads `APP_BASE` from the environment.
- Default build target uses `/`, which fits Cloudflare Pages.
- Existing GitHub Pages workflows still work by injecting `APP_BASE=EverywhereWeGoGz` during build.

## Cloudflare Pages settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `master`

## Notes

- The default Cloudflare Pages URL will be `https://<project-name>.pages.dev`.
- If you later bind a custom domain, you usually do not need any extra path prefix.
- If you no longer need GitHub Pages, you can disable the Pages deployment workflow in GitHub later.
