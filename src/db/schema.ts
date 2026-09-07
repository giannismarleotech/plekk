import { pgTable, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/** Openingsuren per weekdag (0 = zondag … 6 = zaterdag). Meerdere blokken per dag mogelijk (bv. 09–12 en 13–18). */
export type OpeningHours = Record<string, { open: string; close: string }[]>;

export type OrgSettings = {
  slotIntervalMin: number; // raster voor tijdsloten (15)
  leadTimeMin: number; // minimum tijd tussen nu en het slot
  horizonDays: number; // hoe ver vooruit boekbaar
  cancelHoursBefore: number; // tot hoeveel uur vooraf klant zelf mag annuleren
  // restaurant
  seatMinutesByParty?: { upTo: number; minutes: number }[];
  maxCoversPerSlot?: number; // pacing
  depositCentsPerPerson?: number;
  depositFromPartySize?: number;
  // takeaway
  prepMinutes?: number;
  maxOrdersPerSlot?: number;
  prepayRequired?: boolean;
  ownerNotifications?: boolean; // mail naar de zaak bij elke nieuwe boeking (standaard aan)
};

export const organisations = pgTable("organisations", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  mode: text("mode").$type<"salon" | "restaurant" | "takeaway">().notNull(),
  tagline: text("tagline"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  brandColor: text("brand_color").default("#5B2A86").notNull(),
  openingHours: jsonb("opening_hours").$type<OpeningHours>().notNull(),
  settings: jsonb("settings").$type<OrgSettings>().notNull(),
  plan: text("plan").default("founders").notNull(),
  locale: text("locale").$type<"nl" | "fr" | "en" | "de">().default("nl").notNull(),
  publicBaseUrl: text("public_base_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("organisations_slug_idx").on(t.slug)]);

/** Wat geboekt wordt: een medewerker (salon), een tafel (restaurant) of de keuken (takeaway). */
export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").$type<"staff" | "table" | "kitchen">().notNull(),
  capacity: integer("capacity").default(1).notNull(), // tafel: zitplaatsen; keuken: bestellingen per slot
  minParty: integer("min_party").default(1).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [index("resources_org_idx").on(t.orgId)]);

export type OfferingOption = { name: string; required?: boolean; multi?: boolean; choices: { name: string; priceCents: number }[] };

/** Wat de klant kiest: een dienst (salon), een shift (restaurant) of een menu-item (takeaway). */
export const offerings = pgTable("offerings", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"service" | "shift" | "menu_item">().notNull(),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  durationMin: integer("duration_min"), // service
  priceCents: integer("price_cents").default(0).notNull(),
  startTime: text("start_time"), // shift: "12:00"
  endTime: text("end_time"), // shift: "14:00"
  options: jsonb("options").$type<OfferingOption[]>(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => [index("offerings_org_idx").on(t.orgId)]);

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("customers_org_idx").on(t.orgId), index("customers_org_email_idx").on(t.orgId, t.email)]);

export type BookingStatus =
  | "requested" | "confirmed" | "arrived" | "completed" | "no_show" | "cancelled" // afspraak / reservatie
  | "new" | "preparing" | "ready" | "picked_up"; // bestelling

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"appointment" | "reservation" | "order">().notNull(),
  resourceId: text("resource_id").references(() => resources.id, { onDelete: "set null" }),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  partySize: integer("party_size").default(1).notNull(),
  status: text("status").$type<BookingStatus>().notNull(),
  notes: text("notes"),
  totalCents: integer("total_cents").default(0).notNull(),
  depositCents: integer("deposit_cents").default(0).notNull(),
  paymentStatus: text("payment_status").$type<"none" | "pending" | "paid" | "failed" | "refunded">().default("none").notNull(),
  paymentRef: text("payment_ref"),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  source: text("source").default("online").notNull(), // online | phone | walkin
  reference: text("reference").notNull(), // korte code voor de klant, bv. PK-4F7Q
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("bookings_org_start_idx").on(t.orgId, t.startsAt), index("bookings_resource_start_idx").on(t.resourceId, t.startsAt)]);

export const bookingItems = pgTable("booking_items", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  offeringId: text("offering_id").references(() => offerings.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unitPriceCents: integer("unit_price_cents").default(0).notNull(),
  options: jsonb("options").$type<{ name: string; choice: string; priceCents: number }[]>(),
}, (t) => [index("booking_items_booking_idx").on(t.bookingId)]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isPlatformAdmin: boolean("is_platform_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

export const memberships = pgTable("memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  role: text("role").$type<"owner" | "staff">().default("owner").notNull(),
}, (t) => [uniqueIndex("memberships_user_org_idx").on(t.userId, t.orgId)]);

export const organisationsRelations = relations(organisations, ({ many }) => ({
  resources: many(resources), offerings: many(offerings), bookings: many(bookings), customers: many(customers),
}));
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  org: one(organisations, { fields: [bookings.orgId], references: [organisations.id] }),
  resource: one(resources, { fields: [bookings.resourceId], references: [resources.id] }),
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  items: many(bookingItems),
}));
export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, { fields: [bookingItems.bookingId], references: [bookings.id] }),
}));
export const resourcesRelations = relations(resources, ({ one }) => ({ org: one(organisations, { fields: [resources.orgId], references: [organisations.id] }) }));
export const offeringsRelations = relations(offerings, ({ one }) => ({ org: one(organisations, { fields: [offerings.orgId], references: [organisations.id] }) }));
export const customersRelations = relations(customers, ({ one, many }) => ({ org: one(organisations, { fields: [customers.orgId], references: [organisations.id] }), bookings: many(bookings) }));
export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  org: one(organisations, { fields: [memberships.orgId], references: [organisations.id] }),
}));

export type Organisation = typeof organisations.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Offering = typeof offerings.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingItem = typeof bookingItems.$inferSelect;
export type User = typeof users.$inferSelect;
