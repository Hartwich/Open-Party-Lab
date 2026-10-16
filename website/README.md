# Project website

The English project landing page is a standalone static site. It links to the
hosted test server, Windows releases, source and contributor guides. It does not
run the multiplayer server. Screenshots are reused from `docs/screenshots`; see
that directory's README for capture details.

Build from the repository root with `npm run site:build`. Output goes to the
ignored `dist/site` directory. To preview, serve that directory with a static
HTTP server, for example `python -m http.server 8080 --directory dist/site`.
No npm install, optional game checkouts or API keys are needed for this build.

The `Project website` workflow publishes changes to the site and screenshot
sources on `main`. Repository Settings → Pages must use **GitHub Actions** as
the publishing source. The intended URL is
https://hartwich.github.io/Open-Party-Lab/. If the repository is renamed, update
the canonical/Open Graph URLs in `index.html` and the sitemap/robots URLs in
`scripts/build-site.mjs`.

Keep screenshots and descriptions representative, label development limits,
and check both narrow phone and desktop layouts after visual changes. The page
uses system fonts and local assets without analytics or third-party embeds.
