module.exports = {
  projects: {
    ngCore: {
      schema: [
        'http://localhost:4000/graphql',
        'integration/angular/projects/core/src/**/*.state.ts'
      ],
      documents: 'integration/angular/projects/core/src/**/*.graphql',
      include: 'integration/angular/projects/core/src/**/*.*',
      extensions: {
        customDirectives: [
          'directive @client on FIELD'
        ]
      }
    },
    ngState: {
      schema: [
        'http://localhost:4000/graphql',
        'integration/angular/projects/state/src/**/*.state.ts'
      ],
      documents: 'integration/angular/projects/state/src/**/*.graphql',
      include: 'integration/angular/projects/state/src/**/*.*',
      extensions: {
        customDirectives: [
          'directive @client on FIELD'
        ]
      }
    },
    react: {
      schema: [
        'http://localhost:4000/graphql',
        'integration/react/src/**/*.state.ts'
      ],
      documents: 'integration/react/src/**/*.graphql',
      include: 'integration/react/src/**/*.*',
      extensions: {
        customDirectives: [
          'directive @client on FIELD'
        ]
      }
    }
  }
}
