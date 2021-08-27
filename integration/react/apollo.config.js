module.exports = {
  client: {
    service: {
      name: 'react',
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
