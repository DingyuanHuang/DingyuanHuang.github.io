# Dingyuan Huang - Research Portfolio

Personal research website: https://dingyuanhuang.github.io/

## Website files

- `index.html`: bilingual research portfolio.
- `resume.html`: online resume with print styles.
- `Resume.pdf`: downloadable resume exported from the supplied Google Doc.
- `assets/`: local styles, scripts, images, fonts, and third-party licenses.
- `avatar.jpg`: portrait fallback and sharing image.
- `favicon.ico`, `favicon-96x96.png`, `apple-touch-icon.png`, and `assets/favicon.svg`: DH site icons and their vector source.
- `sitemap.xml` and the Google verification HTML file: search-engine metadata.

The site is static and publishes from the `main` branch through GitHub Pages. Keep all website files together when updating it. `.nojekyll` serves the checked-in files without Jekyll processing. No runtime package installation or external font/script service is required.

## Editing

Keep the English fallback in `index.html` synchronized with `assets/content.js`, and update relevant entries in `resume.html`. The PDF is a separate Google Doc export; replace it with a new export when that source changes.

The optional Tailwind build uses the checked-in configuration:

```sh
npx --yes tailwindcss@3.4.17 --config tailwind.config.cjs --input assets/tailwind-input.css --output assets/tailwind.css --minify
```

The interface includes keyboard navigation, semantic headings, bilingual image descriptions, an animation pause control, and reduced-motion support. These features and automated checks do not constitute accessibility certification.

Third-party notices and licenses are in `assets/THIRD_PARTY.txt` and `assets/licenses/`. Local audit reports, backups, and source exports are excluded from this repository.
