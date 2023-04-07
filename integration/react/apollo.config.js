module.exports = {
  client: {
    service: {
      name: 'react',
      url: 'http://localhost:4000/graphql',
      localSchemaFile: null
    },
    includes: [
      `${__dirname}/src/**/*.state.ts`,
      `${__dirname}/src/**/*.graphql`
    ]
  }
};
