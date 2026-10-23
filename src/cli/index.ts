#!/usr/bin/env node
// CLI for node-backend-toolkit
import fs from 'fs';
import path from 'path';
import { generateMigration } from '../database/dynamic-fields/migration-generator';
import { IUserFieldConfig } from '../config/types';

const printHelp = () => {
  console.log(`
node-backend-toolkit CLI

Usage:
  npx node-backend-toolkit <command> [options]

Commands:
  generate-migration    Generate TypeORM migration file for configured dynamic user fields
  help                  Show this help message

Options:
  --config=<path>       Path to backend config JS/JSON/TS file (default: ./toolkit.config.json)
  --output=<dir>        Output directory for migrations (default: ./src/database/migrations)
`);
};

export const runCli = (args: string[] = process.argv.slice(2)): void => {
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'generate-migration') {
    let configPath = path.resolve(process.cwd(), 'toolkit.config.json');
    let outputDir = path.resolve(process.cwd(), 'src/database/migrations');

    for (const arg of args.slice(1)) {
      if (arg.startsWith('--config=')) {
        configPath = path.resolve(process.cwd(), arg.split('=')[1]);
      } else if (arg.startsWith('--output=')) {
        outputDir = path.resolve(process.cwd(), arg.split('=')[1]);
      }
    }

    if (!fs.existsSync(configPath)) {
      console.error(`❌ Config file not found at: ${configPath}`);
      process.exit(1);
    }

    let fields: IUserFieldConfig[] = [];
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(content);
      fields = parsed.users?.fields || parsed.fields || [];
    } catch (err: unknown) {
      console.error(`❌ Failed to parse config file: ${(err as Error).message}`);
      process.exit(1);
    }

    if (fields.length === 0) {
      console.log('ℹ️ No dynamic fields found in config. No migration generated.');
      return;
    }

    const migration = generateMigration(fields);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, migration.fileName);
    fs.writeFileSync(filePath, migration.code, 'utf8');

    console.log(`✅ Dynamic fields migration generated successfully!`);
    console.log(`📁 File: ${filePath}`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
};

if (require.main === module) {
  runCli();
}
