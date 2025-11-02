# Development

## Run integration server
```bash
yarn workspace @integration/server start
```

## Codegen

```bash
yarn workspace @apollo-orbit/codegen build
yarn lerna run codegen
yarn lerna run codegen:test
yarn lerna run codegen:core
yarn lerna run codegen:state
```

## Release

```bash
yarn lerna version --no-private
```
