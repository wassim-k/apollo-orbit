# Development

## Codegen

```bash
yarn codegen:clean
yarn lerna run codegen
yarn lerna run codegen:test
yarn lerna run codegen:core
yarn lerna run codegen:effects
```

## Publish

```bash
yarn lerna version --no-push --no-changelog --no-git-tag-version --no-private

yarn build

yarn workspace @apollo-orbit/core publish dist --access=public
yarn workspace @apollo-orbit/angular publish dist --access=public
yarn workspace @apollo-orbit/codegen publish dist --access=public
yarn workspace @apollo-orbit/react publish dist --access=public
```
