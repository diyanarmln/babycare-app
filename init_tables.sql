CREATE TABLE IF NOT EXISTS account (
  account_id SERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  password TEXT,
  creation_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
  profile_id SERIAL PRIMARY KEY,
  baby_name TEXT,
  birth_date DATE,
  gender TEXT,
  filename TEXT,
  account_id INTEGER
);

CREATE TABLE IF NOT EXISTS event (
  event_id SERIAL PRIMARY KEY,
  event_name TEXT
);

CREATE TABLE IF NOT EXISTS log (
  log_id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  date DATE,
  time TIME,
  event_id INTEGER,
  stool_colour TEXT,
  nappy_weight TEXT,
  milk_qty INTEGER,
  end_date DATE,
  end_time TIME
);

INSERT INTO event (event_name) VALUES ('soiled-diaper'),('wet-diaper'),('feed'),('sleep');