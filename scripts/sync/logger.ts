/* eslint-disable no-console */

export const logger = {
  info: (msg: string): void => console.log(`ℹ️  ${msg}`),
  success: (msg: string): void => console.log(`✅  ${msg}`),
  warning: (msg: string): void => console.log(`⚠️  ${msg}`),
  error: (msg: string): void => console.log(`❌  ${msg}`)
};
