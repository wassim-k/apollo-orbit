import { logger } from './sync/logger';
import { syncImportedTypes } from './sync/importedTypes';

try {
  logger.info('Starting type sync script...');
  syncImportedTypes();
  logger.success('Type sync finished.');
} catch (error: any) {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}
