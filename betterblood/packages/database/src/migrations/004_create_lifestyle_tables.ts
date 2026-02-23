import type { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder): void => {
  // Lifestyle recommendations from AI coach
  pgm.createTable('lifestyle_recommendations', {
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
    timestamp: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    category: {
      type: 'varchar(50)',
      notNull: true,
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    content: {
      type: 'text',
      notNull: true,
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
    },
    evidence: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
    },
    dismissed_at: {
      type: 'timestamp with time zone',
      default: null,
    },
    completed_at: {
      type: 'timestamp with time zone',
      default: null,
    },
    result: {
      type: 'jsonb',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('lifestyle_recommendations', ['user_id', 'timestamp DESC']);
  pgm.createIndex('lifestyle_recommendations', ['user_id', 'status']);
  pgm.createIndex('lifestyle_recommendations', ['user_id', 'category']);

  // Users health patterns (ML detected)
  pgm.createTable('health_patterns', {
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
    pattern_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    detected_at: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    confidence: {
      type: 'decimal(3,2)',
      notNull: true,
    },
    pattern_data: {
      type: 'jsonb',
      notNull: true,
    },
    time_window_start: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    time_window_end: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('health_patterns', ['user_id', 'pattern_type']);
  pgm.createIndex('health_patterns', ['user_id', 'detected_at DESC']);

  // Time in Range statistics (calculated periodically)
  pgm.createTable('time_in_range_stats', {
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
    period: {
      type: 'varchar(20)',
      notNull: true,
    },
    period_start: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    period_end: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    total_readings: {
      type: 'integer',
      notNull: true,
    },
    average_glucose_mg_dl: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    std_dev_glucose: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    time_in_ranges: {
      type: 'jsonb',
      notNull: true,
    },
    estimated_a1c: {
      type: 'decimal(3,2)',
      default: null,
    },
    glucose_management_indicator: {
      type: 'decimal(3,2)',
      default: null,
    },
    coefficient_of_variation: {
      type: 'decimal(5,2)',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('time_in_range_stats', ['user_id', 'period_start DESC']);
  pgm.createIndex('time_in_range_stats', ['user_id', 'period']);
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('time_in_range_stats');
  pgm.dropTable('health_patterns');
  pgm.dropTable('lifestyle_recommendations');
};
