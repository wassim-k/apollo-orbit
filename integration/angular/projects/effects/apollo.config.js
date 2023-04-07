module.exports = {
  client: {
    service: {
      name: 'angular-effects',
      url: 'http://localhost:4000/graphql',
      localSchemaFile: null
    },
    includes: [
      `${__dirname}/src/app/**/*.state.ts`,
      `${__dirname}/src/app/**/*.graphql`
    ]
  }
};
