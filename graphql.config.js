module.exports = {
  projects: {
    ngCore: {
      schema: [
        'http://localhost:4000/graphql',
        'integration/angular/projects/core/src/**/*.state.ts'
      ],
      documents: [
        'integration/angular/projects/core/src/**/*.graphql'
      ],
      extensions: {
        customDirectives: [
          'directive @client on FIELD'
        ]
      }
    },
    ngEffects: {
      schema: [
        'http://localhost:4000/graphql',
        'integration/angular/projects/effects/src/**/*.state.ts'
      ],
      documents: [
        'integration/angular/projects/effects/src/**/*.graphql'
      ],
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
      documents: [
        'integration/react/src/**/*.graphql'
      ],
      extensions: {
        customDirectives: [
          'directive @client on FIELD'
        ]
      }
    }
  }
}
