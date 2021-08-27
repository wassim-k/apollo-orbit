module.exports = {
  client: {
    service: {
      name: 'react',
      url: 'http://localhost:4000/graphql',
      localSchemaFile: null
    },
    includes: [
      `${__dirname}/**/*.state.ts`,
      `${__dirname}/**/api/**/*.graphql`
    ],
    excludes: [
      `${__dirname}/**/api/**/*.ts`
    ]
  }
};
