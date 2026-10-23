// DataSource Manager for @node-backend-toolkit
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { getPostgresOptions } from './config';

let appDataSource: DataSource | null = null;

export const setDataSource = (dataSource: DataSource | null): void => {
  appDataSource = dataSource;
};

export const initializeDataSource = async (
  customEntities: unknown[] = [],
  overrides: Partial<PostgresConnectionOptions> = {},
): Promise<DataSource> => {
  if (appDataSource && appDataSource.isInitialized) {
    return appDataSource;
  }

  const options = getPostgresOptions(customEntities, overrides);
  appDataSource = new DataSource(options);
  await appDataSource.initialize();

  return appDataSource;
};

export const destroyDataSource = async (): Promise<void> => {
  if (appDataSource) {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
    appDataSource = null;
  }
};

export const getDataSource = (): DataSource => {
  if (!appDataSource || !appDataSource.isInitialized) {
    throw new Error(
      'DataSource not initialized! Call initializeBackend() or initializeDataSource() first.',
    );
  }
  return appDataSource;
};

export default new Proxy(
  {},
  {
    get(_target, prop) {
      return (getDataSource() as unknown as Record<string | symbol, unknown>)[prop];
    },
  },
) as DataSource;
