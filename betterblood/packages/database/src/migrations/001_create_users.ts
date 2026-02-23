import type { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder): void => {
  // Users table - core user management
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'patient',
    },
    verification_status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'pending',
    },
    profile: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    settings: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    cgm_connection: {
      type: 'jsonb',
      default: null,
    },
    mfa_enabled: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    mfa_secret: {
      type: 'varchar(255)',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Indexes
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');
  pgm.createIndex('users', 'verification_status');
  pgm.createIndex('users', 'created_at');

  // Trigger for updated_at
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
    },
    `
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('users', 'update_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });

  // Refresh tokens table
  pgm.createTable('refresh_tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    token_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    revoked_at: {
      type: 'timestamp with time zone',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
    ip_address: {
      type: 'varchar(45)',
      default: null,
    },
    user_agent: {
      type: 'text',
      default: null,
    },
  });

  pgm.createIndex('refresh_tokens', 'user_id');
  pgm.createIndex('refresh_tokens', 'token_hash');
  pgm.createIndex('refresh_tokens', 'expires_at');
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('refresh_tokens');
  pgm.dropTrigger('users', 'update_users_updated_at');
  pgm.dropFunction('update_updated_at_column', []);
  pgm.dropTable('users');
};
