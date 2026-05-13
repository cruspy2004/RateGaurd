CREATE TABLE rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  limit_count INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  strategy VARCHAR(20) NOT NULL DEFAULT 'sliding',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_log (
  id SERIAL PRIMARY KEY,
  node_id VARCHAR(50) NOT NULL,
  rule_name VARCHAR(100) NOT NULL,
  client_key VARCHAR(255) NOT NULL,
  decision VARCHAR(10) NOT NULL,
  remaining INTEGER,
  lamport_ts BIGINT NOT NULL,
  wall_ts TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rules_name ON rules(name);
CREATE INDEX idx_event_log_rule_wall ON event_log(rule_name, wall_ts);
CREATE INDEX idx_event_log_client_wall ON event_log(client_key, wall_ts);
CREATE INDEX idx_event_log_lamport ON event_log(lamport_ts);
