# Documentation

The site uses Docusaurus 3. Its API tables are generated from the Angular package source and the repository's Apollo Client types during each site build.

Run these commands from the repository root with Yarn Classic and a Node version supported by the root project:

```sh
yarn install --frozen-lockfile
yarn --cwd docs install --frozen-lockfile
yarn --cwd docs start
```

To build the site:

```sh
yarn --cwd docs build
```

The static site is written to `docs/build`. The build also refreshes the tracked Markdown tables in `docs/src/components/api-tables`; include those changes when updating the API docs. Edit source documentation or the generator rather than editing generated tables directly.

Use `yarn --cwd docs serve` to preview the production build. Restart the development server after changing library API declarations so their tables are regenerated.

The GitHub Pages workflow builds and deploys the `docs` branch after a push to that branch.
