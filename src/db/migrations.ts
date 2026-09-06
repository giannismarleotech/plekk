// Gegenereerd door scripts/embed-migrations.mjs — niet handmatig bewerken. Draai `npm run db:generate`.
export const migrations: { name: string; statements: string[] }[] = [
  {
    "name": "0000_chubby_red_ghost",
    "statements": [
      "CREATE TABLE \"booking_items\" (\n\t\"id\" text PRIMARY KEY NOT NULL,\n\t\"booking_id\" text NOT NULL,\n\t\"offering_id\" text,\n\t\"name\" text NOT NULL,\n\t\"quantity\" integer DEFAULT 1 NOT NULL,\n\t\"unit_price_cents\" integer DEFAULT 0 NOT NULL,\n\t\"options\" jsonb\n);",
      "CREATE TABLE \"bookings\" (\n\t\"id\" text PRIMARY KEY NOT NULL,\n\t\"org_id\" text NOT NULL,\n\t\"kind\" text NOT NULL,\n\t\"resource_id\" text,\n\t\"customer_id\" text,\n\t\"starts_at\" timestamp with time zone NOT NULL,\n\t\"ends_at\" timestamp with time zone NOT NULL,\n\t\"party_size\" integer DEFAULT 1 NOT NULL,\n\t\"status\" text NOT NULL,\n\t\"notes\" text,\n\t\"total_cents\" integer DEFAULT 0 NOT NULL,\n\t\"deposit_cents\" integer DEFAULT 0 NOT NULL,\n\t\"payment_status\" text DEFAULT 'none' NOT NULL,\n\t\"payment_ref\" text,\n\t\"source\" text DEFAULT 'online' NOT NULL,\n\t\"reference\" text NOT NULL,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n);",
      "CREATE TABLE \"customers\" (\n\t\"id\" text PRIMARY KEY NOT NULL,\n\t\"org_id\" text NOT NULL,\n\t\"name\" text NOT NULL,\n\t\"email\" text,\n\t\"phone\" text,\n\t\"notes\" text,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n);",
      "CREATE TABLE \"memberships\" (\n\t\"id\" text PRIMARY KEY NOT NULL,\n\t\"user_id\" text NOT NULL,\n\t\"org_id\" text NOT NULL,\n\t\"role\" text DEFAULT 'owner' NOT NULL\n);",
      "CREATE TABLE \"offerings\" (\n\t\"id\" text PRIMARY KEY NOT NULL,\n\t\"org_id\" text NOT NULL,\n\t\"kind\" text NOT NULL,\n\t\"name\" text NOT NULL,\n\t\"category\" text,\n\t\"description\" text,\n\t\"duration_min\" integer,\n\t\"price_cents\" integer DEFAULT 0 NOT NULL,\n\t\"start_time\" text,\n\t\"end_time\" text,\n\t\"options\" jsonb,\n\t\"active\" boolean DEFAULT true NOT NULL,\n\t\"sort_order\" integer DEFAULT 0 NOT NULL\n);",
      "CREATE TABLE \"organisations\" (\n\t\"id\" text PRIMARY KEY NOT NULL,\n\t\"slug\" text NOT NULL,\n\t\"name\" text NOT NULL,\n\t\"mode\" text NOT NULL,\n\t\"tagline\" text,\n\t\"description\" text,\n\t\"phone\" text,\n\t\"email\" text,\n\t\"address\" text,\n\t\"city\" text,\n\t\"brand_color\" text DEFAULT '#5B2A86' NOT NULL,\n\t\"opening_hours\" jsonb NOT NULL,\n\t\"settings\" jsonb NOT NULL,\n\t\"plan\" text DEFAULT 'founders' NOT NULL,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n);",
      "CREATE TABLE \"resources\" (\n\t\"id\" text PRIMARY KEY NOT NULL,\n\t\"org_id\" text NOT NULL,\n\t\"name\" text NOT NULL,\n\t\"kind\" text NOT NULL,\n\t\"capacity\" integer DEFAULT 1 NOT NULL,\n\t\"min_party\" integer DEFAULT 1 NOT NULL,\n\t\"active\" boolean DEFAULT true NOT NULL,\n\t\"sort_order\" integer DEFAULT 0 NOT NULL\n);",
      "CREATE TABLE \"users\" (\n\t\"id\" text PRIMARY KEY NOT NULL,\n\t\"email\" text NOT NULL,\n\t\"name\" text NOT NULL,\n\t\"password_hash\" text NOT NULL,\n\t\"is_platform_admin\" boolean DEFAULT false NOT NULL,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n);",
      "ALTER TABLE \"booking_items\" ADD CONSTRAINT \"booking_items_booking_id_bookings_id_fk\" FOREIGN KEY (\"booking_id\") REFERENCES \"public\".\"bookings\"(\"id\") ON DELETE cascade ON UPDATE no action;",
      "ALTER TABLE \"booking_items\" ADD CONSTRAINT \"booking_items_offering_id_offerings_id_fk\" FOREIGN KEY (\"offering_id\") REFERENCES \"public\".\"offerings\"(\"id\") ON DELETE set null ON UPDATE no action;",
      "ALTER TABLE \"bookings\" ADD CONSTRAINT \"bookings_org_id_organisations_id_fk\" FOREIGN KEY (\"org_id\") REFERENCES \"public\".\"organisations\"(\"id\") ON DELETE cascade ON UPDATE no action;",
      "ALTER TABLE \"bookings\" ADD CONSTRAINT \"bookings_resource_id_resources_id_fk\" FOREIGN KEY (\"resource_id\") REFERENCES \"public\".\"resources\"(\"id\") ON DELETE set null ON UPDATE no action;",
      "ALTER TABLE \"bookings\" ADD CONSTRAINT \"bookings_customer_id_customers_id_fk\" FOREIGN KEY (\"customer_id\") REFERENCES \"public\".\"customers\"(\"id\") ON DELETE set null ON UPDATE no action;",
      "ALTER TABLE \"customers\" ADD CONSTRAINT \"customers_org_id_organisations_id_fk\" FOREIGN KEY (\"org_id\") REFERENCES \"public\".\"organisations\"(\"id\") ON DELETE cascade ON UPDATE no action;",
      "ALTER TABLE \"memberships\" ADD CONSTRAINT \"memberships_user_id_users_id_fk\" FOREIGN KEY (\"user_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE cascade ON UPDATE no action;",
      "ALTER TABLE \"memberships\" ADD CONSTRAINT \"memberships_org_id_organisations_id_fk\" FOREIGN KEY (\"org_id\") REFERENCES \"public\".\"organisations\"(\"id\") ON DELETE cascade ON UPDATE no action;",
      "ALTER TABLE \"offerings\" ADD CONSTRAINT \"offerings_org_id_organisations_id_fk\" FOREIGN KEY (\"org_id\") REFERENCES \"public\".\"organisations\"(\"id\") ON DELETE cascade ON UPDATE no action;",
      "ALTER TABLE \"resources\" ADD CONSTRAINT \"resources_org_id_organisations_id_fk\" FOREIGN KEY (\"org_id\") REFERENCES \"public\".\"organisations\"(\"id\") ON DELETE cascade ON UPDATE no action;",
      "CREATE INDEX \"booking_items_booking_idx\" ON \"booking_items\" USING btree (\"booking_id\");",
      "CREATE INDEX \"bookings_org_start_idx\" ON \"bookings\" USING btree (\"org_id\",\"starts_at\");",
      "CREATE INDEX \"bookings_resource_start_idx\" ON \"bookings\" USING btree (\"resource_id\",\"starts_at\");",
      "CREATE INDEX \"customers_org_idx\" ON \"customers\" USING btree (\"org_id\");",
      "CREATE INDEX \"customers_org_email_idx\" ON \"customers\" USING btree (\"org_id\",\"email\");",
      "CREATE UNIQUE INDEX \"memberships_user_org_idx\" ON \"memberships\" USING btree (\"user_id\",\"org_id\");",
      "CREATE INDEX \"offerings_org_idx\" ON \"offerings\" USING btree (\"org_id\");",
      "CREATE UNIQUE INDEX \"organisations_slug_idx\" ON \"organisations\" USING btree (\"slug\");",
      "CREATE INDEX \"resources_org_idx\" ON \"resources\" USING btree (\"org_id\");",
      "CREATE UNIQUE INDEX \"users_email_idx\" ON \"users\" USING btree (\"email\");"
    ]
  },
  {
    "name": "0001_launch",
    "statements": [
      "ALTER TABLE \"bookings\" ADD COLUMN \"reminder_sent_at\" timestamp with time zone;",
      "ALTER TABLE \"organisations\" ADD COLUMN \"locale\" text DEFAULT 'nl' NOT NULL;",
      "ALTER TABLE \"organisations\" ADD COLUMN \"public_base_url\" text;"
    ]
  }
];
