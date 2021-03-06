module.exports = {
  client: {
    service: {
      name: 'angular-core-books',
      url: 'http://localhost:4000/graphql',
      localSchemaFile: null
    },
    includes: [
      `${__dirname}/src/app/**/*.state.ts`,
      `${__dirname}/src/app/**/api/**/*.graphql`
    ],
    excludes: [
      `${__dirname}/src/app/**/api/**/*.ts`
    ]
  }
};
