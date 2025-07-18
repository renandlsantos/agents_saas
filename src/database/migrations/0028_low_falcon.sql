ALTER TABLE "agents" ADD COLUMN "category" varchar(50);--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "is_domain" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agents_category" ON "agents" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agents_is_domain" ON "agents" USING btree ("is_domain");