# BetterHUD by Virojet

A responsive GitHub Pages website for Virojet's public mods. Each project has an overview, a dedicated Tampermonkey install guide, and the verified upstream userscript link.

## Edit the website

- `site/catalog.json`: project names, versions, descriptions, features, source and install links.
- `site/build.py`: accessible HTML templates and static routes.
- `site/base.css`: responsive visual design.
- `site/site.js`: navigation, search, category filters and browser selection.
- `site/assets/`: the original Virojet avatar and mountain artwork.

No third-party Python libraries or frontend dependencies are required.

Build and check locally:

```sh
python site/build.py --output dist --origin https://virojet.github.io
python site/validate.py --output dist
python -m http.server 4173 --directory dist
```

## Publish

The `Publish BetterHUD` workflow builds and validates the site, then deploys it through GitHub Pages. In repository Settings > Pages, set the build source to **GitHub Actions**. Pushes to `main` that change `site/` or the deployment workflow publish automatically. The workflow can also be run manually.

Intended public URL: https://virojet.github.io/

## Installation behavior

Install buttons link directly to each project's `.user.js` URL. Tampermonkey handles the installation prompt. No mod code executes on this website. Links track the latest main/default branch rather than a fixed commit.

The experimental BetterHUD Sidebar Test is labeled separately and does not auto-update. Private projects are excluded. Source and installation metadata were checked on 25 October 2026.
