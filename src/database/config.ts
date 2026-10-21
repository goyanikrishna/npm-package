// Database Configuration Builder
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { configManager } from '../config/config.manager';
import { PACKAGE_ENTITIES } from './entities';

export const getPostgresOptions = (
  customEntities: unknown[] = [],
  overrides: Partial<PostgresConnectionOptions> = {},
): PostgresConnectionOptions => {
  const dbConfig = configManager.getDatabase();

  const options: PostgresConnectionOptions = {
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    schema: dbConfig.schema,
    ssl: dbConfig.ssl,
    synchronize: dbConfig.synchronize ?? false,
    logging: dbConfig.logging ?? false,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [...PACKAGE_ENTITIES, ...customEntities] as PostgresConnectionOptions['entities'],
    extra: {
      max: dbConfig.poolSize ?? 10,
    },
    ...overrides,
  };

  return options;
};
