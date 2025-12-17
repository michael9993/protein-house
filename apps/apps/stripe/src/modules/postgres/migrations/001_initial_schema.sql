-- Auth Data Table (APL - Application Persistence Layer)
CREATE TABLE IF NOT EXISTS auth_data (
  saleor_api_url VARCHAR(255) PRIMARY KEY,
  app_id VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  jwks TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_data_app_id ON auth_data(app_id);

-- Stripe Configurations Table
CREATE TABLE IF NOT EXISTS stripe_configs (
  id SERIAL PRIMARY KEY,
  saleor_api_url VARCHAR(255) NOT NULL,
  app_id VARCHAR(255) NOT NULL,
  config_id VARCHAR(255) NOT NULL,
  config_name VARCHAR(255) NOT NULL,
  stripe_pk TEXT NOT NULL,
  stripe_rk TEXT NOT NULL, -- encrypted
  stripe_wh_secret TEXT NOT NULL, -- encrypted
  stripe_wh_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(saleor_api_url, app_id, config_id)
);

CREATE INDEX IF NOT EXISTS idx_stripe_configs_lookup ON stripe_configs(saleor_api_url, app_id);
CREATE INDEX IF NOT EXISTS idx_stripe_configs_config_id ON stripe_configs(config_id);

-- Channel to Config Mappings Table
CREATE TABLE IF NOT EXISTS channel_config_mappings (
  id SERIAL PRIMARY KEY,
  saleor_api_url VARCHAR(255) NOT NULL,
  app_id VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  config_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(saleor_api_url, app_id, channel_id),
  FOREIGN KEY (saleor_api_url, app_id, config_id) 
    REFERENCES stripe_configs(saleor_api_url, app_id, config_id) 
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_channel_mappings_lookup ON channel_config_mappings(saleor_api_url, app_id);
CREATE INDEX IF NOT EXISTS idx_channel_mappings_channel_id ON channel_config_mappings(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_mappings_config_id ON channel_config_mappings(config_id);

-- Recorded Transactions Table
CREATE TABLE IF NOT EXISTS recorded_transactions (
  id SERIAL PRIMARY KEY,
  saleor_api_url VARCHAR(255) NOT NULL,
  app_id VARCHAR(255) NOT NULL,
  payment_intent_id VARCHAR(255) NOT NULL,
  saleor_transaction_id VARCHAR(255) NOT NULL,
  saleor_transaction_flow VARCHAR(50) NOT NULL,
  resolved_transaction_flow VARCHAR(50) NOT NULL,
  selected_payment_method VARCHAR(50) NOT NULL,
  saleor_schema_version_major INTEGER NOT NULL,
  saleor_schema_version_minor INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(saleor_api_url, app_id, payment_intent_id)
);

CREATE INDEX IF NOT EXISTS idx_recorded_transactions_lookup ON recorded_transactions(saleor_api_url, app_id, payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_recorded_transactions_payment_intent ON recorded_transactions(payment_intent_id);
