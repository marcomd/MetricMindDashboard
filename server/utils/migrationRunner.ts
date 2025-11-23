import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Migration {
  timestamp: string;
  name: string;
  filename: string;
  filepath: string;
}

interface AppliedMigration {
  filename: string;
}

/**
 * Migration Runner for Dashboard
 *
 * Uses the existing schema_migrations table created by the extractor project.
 * Applies dashboard-specific migrations automatically on server startup.
 */
class MigrationRunner {
  private migrationsDir: string;

  constructor() {
    this.migrationsDir = path.join(__dirname, '../../migrations');
  }

  /**
   * Ensure schema_migrations table exists
   * Note: Uses 'filename' column to match extractor project schema
   */
  async ensureMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY
      );
    `;
    await pool.query(query);
  }

  /**
   * Get all applied migrations from database
   */
  async getAppliedMigrations(): Promise<Set<string>> {
    const result = await pool.query<AppliedMigration>(
      'SELECT filename FROM schema_migrations ORDER BY filename'
    );
    return new Set(result.rows.map(row => row.filename));
  }

  /**
   * Read all migration files from migrations directory
   */
  readMigrationFiles(): Migration[] {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('No migrations directory found, skipping migrations');
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir);
    const migrations: Migration[] = [];

    for (const filename of files) {
      // Only process .sql files, skip .down.sql files for now
      if (!filename.endsWith('.sql') || filename.endsWith('.down.sql')) {
        continue;
      }

      // Parse timestamp from filename (format: YYYYMMDDHHMMSS_description.sql)
      const match = filename.match(/^(\d{14})_(.+)\.sql$/);
      if (!match) {
        console.warn(`Skipping invalid migration filename: ${filename}`);
        continue;
      }

      const [, timestamp, name] = match;
      migrations.push({
        timestamp,
        name: filename,
        filename,
        filepath: path.join(this.migrationsDir, filename)
      });
    }

    // Sort by timestamp
    migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return migrations;
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    const sql = fs.readFileSync(migration.filepath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Execute migration SQL
      await client.query(sql);

      // Record in schema_migrations
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [migration.name]
      );

      await client.query('COMMIT');
      console.log(`✓ Applied migration: ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackLastMigration(): Promise<void> {
    const result = await pool.query<AppliedMigration>(
      'SELECT filename FROM schema_migrations ORDER BY filename DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = result.rows[0].filename;
    const downFilename = lastMigration.replace('.sql', '.down.sql');
    const downFilepath = path.join(this.migrationsDir, downFilename);

    if (!fs.existsSync(downFilepath)) {
      throw new Error(`Rollback file not found: ${downFilename}`);
    }

    const sql = fs.readFileSync(downFilepath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Execute rollback SQL
      await client.query(sql);

      // Remove from schema_migrations
      await client.query(
        'DELETE FROM schema_migrations WHERE filename = $1',
        [lastMigration]
      );

      await client.query('COMMIT');
      console.log(`✓ Rolled back migration: ${lastMigration}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{ applied: string[]; pending: Migration[] }> {
    await this.ensureMigrationsTable();

    const appliedSet = await this.getAppliedMigrations();
    const allMigrations = this.readMigrationFiles();

    const applied = Array.from(appliedSet).sort();
    const pending = allMigrations.filter(m => !appliedSet.has(m.name));

    return { applied, pending };
  }

  /**
   * Run all pending migrations
   */
  async runPending(): Promise<number> {
    console.log('Checking for pending migrations...');

    await this.ensureMigrationsTable();

    const appliedMigrations = await this.getAppliedMigrations();
    const allMigrations = this.readMigrationFiles();
    const pendingMigrations = allMigrations.filter(m => !appliedMigrations.has(m.name));

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return 0;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s)`);

    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }

    console.log(`Successfully applied ${pendingMigrations.length} migration(s)`);
    return pendingMigrations.length;
  }
}

// Export singleton instance
export const migrationRunner = new MigrationRunner();

// CLI support - run migrations if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'run';

  (async () => {
    try {
      switch (command) {
        case 'run':
          await migrationRunner.runPending();
          break;

        case 'rollback':
          await migrationRunner.rollbackLastMigration();
          break;

        case 'status': {
          const status = await migrationRunner.getStatus();
          console.log('\nApplied Migrations:');
          status.applied.forEach(name => console.log(`  ✓ ${name}`));

          if (status.pending.length > 0) {
            console.log('\nPending Migrations:');
            status.pending.forEach(m => console.log(`  ○ ${m.name}`));
          } else {
            console.log('\nNo pending migrations');
          }
          break;
        }

        default:
          console.error(`Unknown command: ${command}`);
          console.log('Usage: node migrationRunner.js [run|rollback|status]');
          process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
  })();
}
