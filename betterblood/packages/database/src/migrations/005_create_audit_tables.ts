import type { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder): void => {
  // Audit logs for FDA compliance
  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      default: null,
    },
    action: {
      type: 'varchar(100)',
      notNull: true,
    },
    resource: {
      type: 'varchar(100)',
      notNull: true,
    },
    resource_id: {
      type: 'uuid',
      default: null,
    },
    timestamp: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    actor: {
      type: 'varchar(255)',
      notNull: true,
    },
    actor_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    ip_address: {
      type: 'varchar(45)',
      default: null,
    },
    user_agent: {
      type: 'text',
      default: null,
    },
    before_values: {
      type: 'jsonb',
      default: null,
    },
    after_values: {
      type: 'jsonb',
      default: null,
    },
    fda_relevant: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    fda_category: {
      type: 'varchar(50)',
      default: null,
    },
    software_version: {
      type: 'varchar(50)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Partition by month for audit logs
  pgm.createIndex('audit_logs', ['user_id', 'timestamp DESC']);
  pgm.createIndex('audit_logs', ['resource', 'timestamp DESC']);
  pgm.createIndex('audit_logs', ['action', 'timestamp DESC']);
  pgm.createIndex('audit_logs', 'fda_relevant');
  pgm.createIndex('audit_logs', 'software_version');

  // Notifications table
  pgm.createTable('notifications', {
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
    type: {
      type: 'varchar(20)',
      notNull: true,
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    body: {
      type: 'text',
      notNull: true,
    },
    context: {
      type: 'jsonb',
      default: null,
    },
    delivery_status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
    },
    delivered_at: {
      type: 'timestamp with time zone',
      default: null,
    },
    failure_reason: {
      type: 'text',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('notifications', ['user_id', 'created_at DESC']);
  pgm.createIndex('notifications', ['user_id', 'delivery_status']);
  pgm.createIndex('notifications', ['delivery_status', 'created_at']);

  // ML Models tracking
  pgm.createTable('ml_models', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    model_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    model_version: {
      type: 'varchar(20)',
      notNull: true,
    },
    trained_on_date: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    training_data_size: {
      type: 'integer',
      default: null,
    },
    accuracy: {
      type: 'decimal(5,4)',
      default: null,
    },
    precision: {
      type: 'decimal(5,4)',
      default: null,
    },
    recall: {
      type: 'decimal(5,4)',
      default: null,
    },
    f1_score: {
      type: 'decimal(5,4)',
      default: null,
    },
    model_path: {
      type: 'text',
      notNull: true,
    },
    deployed_at: {
      type: 'timestamp with time zone',
      default: null,
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('ml_models', ['model_name', 'model_version'], { unique: true });
  pgm.createIndex('ml_models', ['model_name', 'active']);
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('ml_models');
  pgm.dropTable('notifications');
  pgm.dropTable('audit_logs');
};
