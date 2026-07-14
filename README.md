<div align="center">
  <img src=".github/assets/dodocs-logo.png" alt="DoDocs" width="480" height="480" style="border-radius: 1rem;">
  <h1 align="center">DoDocs</h1>
  <p align="center">
    Turn Markdown files into a documentation website.<br>
    <a href="https://thiagocajadev.github.io/do-docs/getting-started/introduction">Read the live documentation</a>
    ·
    <a href="README.pt-BR.md">Versão em Português (Brasil)</a>
  </p>
  <a href="https://github.com/thiagocajadev/do-docs/releases"><img src="https://img.shields.io/github/package-json/v/thiagocajadev/do-docs?style=flat-square&color=1f6feb" alt="Version" /></a>
  <a href="https://github.com/thiagocajadev/do-docs/pkgs/container/do-docs"><img src="https://img.shields.io/badge/ghcr.io-do--docs-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Container" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D24-brightgreen?style=flat-square&logo=nodedotjs" alt="Node" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License: MIT" /></a>
</div>

<br>

You give DoDocs a folder of `.md`/`.mdx` files. It returns a static website with sidebar navigation, search, table of contents, syntax highlighting, light and dark themes, and previous/next links. You do not write any application code.

The folder structure defines the site structure. Folders become sidebar sections and files become pages. Your documentation stays as plain Markdown, versioned in the same repository as your code.

<p align="center">
  <kbd><img src=".github/assets/dodocs-example-page.png" alt="A page built by DoDocs, with the sidebar, the search box and the table of contents" /></kbd>
</p>

<p align="center">
  <sub>The <code>example/</code> folder of this repository, rendered. Run <code>pnpm dev</code> to get this.</sub>
</p>

---

## Quick reference

There is nothing to install. You add a GitHub Action to your repository, point it at your documentation folder, and it publishes the site to GitHub Pages.

Create `.github/workflows/docs.yml`:

```yaml
name: Docs

on:
  push:
    branches: ['main']
  workflow_dispatch:

jobs:
  build:
    permissions:
      contents: read
      pages: write
      id-token: write
    uses: thiagocajadev/do-docs/.github/workflows/build.yml@main
    with:
      mdx: 'docs' # your Markdown folder
      libname: 'My Project' # name shown in the header
      home_redirect: '/getting-started/introduction'
      locale: 'pt-BR' # 'en' (default) or 'pt-BR'
      icon: '📘'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Push to `main`. The Action builds your `docs/` folder and publishes the result.

To preview the site on your machine before setting up the Action, run:

```sh
$ curl -sL https://raw.githubusercontent.com/thiagocajadev/do-docs/refs/heads/main/preview.sh | \
  MDX="docs" \
  ICON="🥑" \
  DOCKER_IMAGE="ghcr.io/thiagocajadev/do-docs:latest" \
  sh
```

This runs the same build inside Docker. Nothing is installed on your machine.

---

## `.md` or `.mdx`?

DoDocs accepts both, in the same folder, mixed freely. The extension decides what the file is allowed to do.

| Extension | Use it when                             | What you get                                                        |
| --------- | --------------------------------------- | ------------------------------------------------------------------- |
| `.md`     | Ordinary Markdown, which is most cases  | All standard Markdown, plus raw HTML such as `<details>`            |
| `.mdx`    | You want components inside the page     | Everything `.md` has, plus components like `<Intro>` and `<Mermaid>` |

If you are not sure which to pick, use `.md`. Rename it to `.mdx` on the day you need a component.

One practical difference: in `.md`, writing `<div>` produces a real `div`. In `.mdx`, a capitalized tag such as `<Intro>` is read as a component, so raw HTML has to be valid for JSX.

## What it gives you

- **Navigation built from your folders.** Folders become sections, files become pages. Ordering, grouping and display names can be adjusted with `nav_order` and `nav_labels`, but they are optional.
- **Search** across all pages, running in the browser. There is no search service to host.
- **Themes** generated from one accent color, with a light/dark/system switch.
- **Code blocks** with syntax highlighting, plus a copy to clipboard button.
- **Interface in English or Portuguese.** Your content is never translated.
- **Static output**, which you can publish to GitHub Pages, Vercel, or any static host.

## Configuration

Every option in the [configuration reference](docs/getting-started/introduction.mdx#Configuration) can be passed as an Action input (lowercase) or as an environment variable (uppercase).

The most common ones. The three marked with `*` are required:

| Input             | Environment variable             | What it does                                       |
| ----------------- | -------------------------------- | -------------------------------------------------- |
| `mdx`\*           | `MDX`                            | Path to your Markdown folder                       |
| `libname`\*       | `NEXT_PUBLIC_LIBNAME`            | Name shown in the header                           |
| `home_redirect`\* | `HOME_REDIRECT`                  | Page that `/` redirects to                         |
| `locale`          | `NEXT_PUBLIC_LOCALE`             | Interface language: `en` or `pt-BR`                |
| `nav_order`       | `NAV_ORDER`                      | Sidebar order, with optional grouping              |
| `nav_labels`      | `NAV_LABELS`                     | Display names that automatic capitalization misses |
| `icon`            | `ICON`                           | Emoji or image used as the favicon                 |
| `theme_primary`   | `THEME_PRIMARY`                  | Accent color the theme is generated from           |
| `static_page_generation_timeout` | `STATIC_PAGE_GENERATION_TIMEOUT` | Seconds allowed per page. Raise it for large docs sets |

## Language

`locale` sets the language of the DoDocs interface: the search box, the "On This Page" heading, the previous/next labels, the theme switch and the footer. The accepted values are `en` (default) and `pt-BR`. An unknown value falls back to English instead of failing the build.

It does not affect your Markdown. DoDocs renders your content in the language you wrote it.

## Development

The repository includes an `example/` folder, so a fresh clone starts a working site. Use it to validate the layout before pointing DoDocs at real content.

```sh
$ pnpm install
$ pnpm dev
```

Open `http://localhost:3000`. The default settings come from `.env.development`, which is committed to the repository.

To use your own folder instead:

```sh
$ MDX=./my-docs pnpm dev
```

You can also override any setting in `.env.local`, which is ignored by git and takes precedence.

## Tests

```sh
$ pnpm test
```

Unit tests, run by Vitest, covering the parts that turn Markdown into pages: MDX compilation, link rewriting and image URL resolution. CI runs them on every push.

## Releases

A release is made by increasing `version` in `package.json`. CI detects the change, publishes the Docker image to `ghcr.io/thiagocajadev/do-docs`, and creates the `v<major>` and `v<major>.<minor>.<patch>` tags.

## Credits

DoDocs is an independent project, based on the work of [pmndrs/docs](https://github.com/pmndrs/docs) by [Poimandres](https://pmnd.rs), the documentation generator it originally grew out of. That code is MIT licensed, and its license and copyright are preserved in [LICENSE](LICENSE).

Developed by [@thiagocajadev](https://github.com/thiagocajadev).
