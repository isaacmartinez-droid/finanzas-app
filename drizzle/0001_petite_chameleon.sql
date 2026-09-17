ALTER TABLE "users" ADD COLUMN "auth0_subject" varchar(255);--> statement-breakpoint
UPDATE "users" SET "auth0_subject" = 'legacy:' || "id"::text WHERE "auth0_subject" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "auth0_subject" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth0_subject_unique" UNIQUE("auth0_subject");
