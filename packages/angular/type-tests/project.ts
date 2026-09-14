import type { ViteUserConfig } from 'vitest/config';

export function defineTypeTestProject(name: string): ViteUserConfig {
  return {
    test: {
      name: `angular:types:${name}`,
      include: [],
      passWithNoTests: true,
      watch: false,
      typecheck: {
        enabled: true,
        only: true,
        tsconfig: './tsconfig.json',
        include: ['*.spec.ts']
      }
    }
  };
}
