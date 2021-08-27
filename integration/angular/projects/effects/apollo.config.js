module.exports = {
  client: {
    service: {
      name: 'angular-effects',
      url: 'http://localhost:4000/graphql',
      localSchemaFile: null
    },
    includes: [
      `${__dirname}/**/*.state.ts`,
      `${__dirname}/**/gql/**/*.graphql`
    ],
    excludes: [
      `${__dirname}/**/gql/**/*.ts`
    ]
  }
};
