# Fonts

Self-hosted copies of the two families every PrepFusion site uses, Latin subset only, as served by
Google Fonts on 7 Nov 2026:

| File | Family | Weights | License |
|---|---|---|---|
| `sora-latin-var.v17.woff2` | Sora (variable) | 600 to 800 | SIL Open Font License 1.1 |
| `inter-latin-var.v20.woff2` | Inter (variable) | 400 to 700 | SIL Open Font License 1.1 |

Both are free to use, embed and redistribute under the OFL (https://openfontlicense.org).

They're self-hosted so the hero's Sora can be preloaded from a stable URL and cached for a year
(the version is in the file name). To update, download the new Latin woff2 from Google Fonts, give it
a new versioned name and update the `@font-face` rules in `styles.css` and the preload in `index.html`.
