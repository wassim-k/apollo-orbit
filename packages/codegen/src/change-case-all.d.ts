/**
 * `change-case-all` ships types, but its `exports` map offers them only on the `import` condition, so the
 * CommonJS build cannot see them. Only these two are used.
 */
declare module 'change-case-all' {
  export function pascalCase(input: string): string;
  export function constantCase(input: string): string;
}
