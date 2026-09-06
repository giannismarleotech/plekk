ALTER TABLE "bookings" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "locale" text DEFAULT 'nl' NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "public_base_url" text;