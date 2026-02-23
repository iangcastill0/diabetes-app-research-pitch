import type { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder): void => {
  // Food items database
  pgm.createTable('food_items', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    brand: {
      type: 'varchar(255)',
      default: null,
    },
    barcode: {
      type: 'varchar(50)',
      default: null,
    },
    serving_size: {
      type: 'decimal(8,2)',
      notNull: true,
    },
    serving_unit: {
      type: 'varchar(50)',
      notNull: true,
    },
    total_carbohydrates: {
      type: 'decimal(6,2)',
      notNull: true,
    },
    dietary_fiber: {
      type: 'decimal(6,2)',
      default: 0,
    },
    sugars: {
      type: 'decimal(6,2)',
      default: 0,
    },
    protein: {
      type: 'decimal(6,2)',
      default: 0,
    },
    fat: {
      type: 'decimal(6,2)',
      default: 0,
    },
    calories: {
      type: 'integer',
      default: 0,
    },
    glycemic_index: {
      type: 'integer',
      default: null,
    },
    verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    source: {
      type: 'varchar(100)',
      default: 'user',
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

  pgm.createIndex('food_items', 'name');
  pgm.createIndex('food_items', 'barcode');
  pgm.createIndex('food_items', 'verified');
  
  // For search optimization
  pgm.sql(`
    CREATE INDEX idx_food_items_name_trgm ON food_items 
    USING gin (name gin_trgm_ops);
  `);

  // Meal logs - user food consumption
  pgm.createTable('meal_logs', {
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
    total_carbs: {
      type: 'decimal(6,2)',
      notNull: true,
    },
    photo_url: {
      type: 'varchar(500)',
      default: null,
    },
    ai_analysis: {
      type: 'jsonb',
      default: null,
    },
    notes: {
      type: 'text',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('meal_logs', ['user_id', 'timestamp DESC']);
  pgm.createIndex('meal_logs', 'user_id');

  // Meal food items (junction table)
  pgm.createTable('meal_food_items', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    meal_id: {
      type: 'uuid',
      notNull: true,
      references: 'meal_logs(id)',
      onDelete: 'CASCADE',
    },
    food_id: {
      type: 'uuid',
      notNull: true,
      references: 'food_items(id)',
      onDelete: 'CASCADE',
    },
    quantity: {
      type: 'decimal(8,3)',
      notNull: true,
    },
    notes: {
      type: 'text',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('meal_food_items', 'meal_id');
  pgm.createIndex('meal_food_items', 'food_id');

  // Favorite foods per user
  pgm.createTable('user_favorite_foods', {
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
    food_id: {
      type: 'uuid',
      notNull: true,
      references: 'food_items(id)',
      onDelete: 'CASCADE',
    },
    custom_name: {
      type: 'varchar(255)',
      default: null,
    },
    custom_carb_count: {
      type: 'decimal(6,2)',
      default: null,
    },
    times_used: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('user_favorite_foods', ['user_id', 'food_id'], { unique: true });
  pgm.createIndex('user_favorite_foods', ['user_id', 'times_used DESC']);
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('user_favorite_foods');
  pgm.dropTable('meal_food_items');
  pgm.dropTable('meal_logs');
  pgm.dropTable('food_items');
};
