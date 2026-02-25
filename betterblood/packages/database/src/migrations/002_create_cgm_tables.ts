import type { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder): void => {
  // CGM readings table - time-series data
  pgm.createTable('cgm_readings', {
    id: {
      type: 'uuid',
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    time: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    device_id: {
      type: 'varchar(255)',
      notNull: true,
    },
    provider: {
      type: 'varchar(50)',
      notNull: true,
    },
    glucose_value_mg_dl: {
      type: 'integer',
      notNull: true,
    },
    filtered_glucose_value_mg_dl: {
      type: 'integer',
      default: null,
    },
    trend_direction: {
      type: 'varchar(20)',
      default: null,
    },
    trend_rate_mg_dl_per_minute: {
      type: 'decimal(5,2)',
      default: null,
    },
    quality: {
      type: 'varchar(20)',
      default: null,
    },
    transmission_id: {
      type: 'varchar(255)',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Convert to TimescaleDB hypertable for time-series optimization
  pgm.sql(`
    SELECT create_hypertable('cgm_readings', 'time',
      chunk_time_interval => INTERVAL '1 week',
      if_not_exists => TRUE
    );
  `);

  // TimescaleDB requires partition column in primary key
  pgm.addConstraint('cgm_readings', 'cgm_readings_pkey', 'PRIMARY KEY (id, time)');

  // Indexes for CGM queries
  pgm.createIndex('cgm_readings', ['user_id', 'time DESC']);
  pgm.createIndex('cgm_readings', ['user_id', 'device_id']);
  pgm.createIndex('cgm_readings', 'glucose_value_mg_dl');

  // User insulin settings - FDA tracked
  pgm.createTable('insulin_settings', {
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
    carb_ratio: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    insulin_sensitivity_factor: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    target_glucose_mg_dl: {
      type: 'integer',
      notNull: true,
    },
    max_dose_limit: {
      type: 'decimal(5,2)',
      default: null,
    },
    insulin_duration_hours: {
      type: 'decimal(3,1)',
      notNull: true,
      default: 4.0,
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    configured_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
    verified_by_provider: {
      type: 'uuid',
      references: 'users(id)',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('insulin_settings', 'user_id');
  pgm.createIndex('insulin_settings', ['user_id', 'active']);

  // Insulin doses - FDA regulated calculations
  pgm.createTable('insulin_doses', {
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
    calculated_at: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    calculation_context: {
      type: 'varchar(50)',
      notNull: true,
    },
    current_glucose_mg_dl: {
      type: 'integer',
      notNull: true,
    },
    target_glucose_mg_dl: {
      type: 'integer',
      notNull: true,
    },
    carbs_in_grams: {
      type: 'decimal(5,1)',
      default: null,
    },
    carb_ratio: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    isf: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    iob: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    carb_dose: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    correction_dose: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    total_recommended_dose: {
      type: 'decimal(5,2)',
      notNull: true,
    },
    warnings: {
      type: 'jsonb',
      notNull: true,
      default: '[]',
    },
    confidence: {
      type: 'decimal(3,2)',
      notNull: true,
    },
    confirmed_by_user: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    confirmed_at: {
      type: 'timestamp with time zone',
      default: null,
    },
    injected_at: {
      type: 'timestamp with time zone',
      default: null,
    },
    algorithm_version: {
      type: 'varchar(20)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('insulin_doses', ['user_id', 'calculated_at DESC']);
  pgm.createIndex('insulin_doses', ['user_id', 'confirmed_by_user']);
  pgm.createIndex('insulin_doses', 'algorithm_version');
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('insulin_doses');
  pgm.dropTable('insulin_settings');
  pgm.dropTable('cgm_readings');
};
