ALTER TABLE "monitoringRepo" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "monitoringRepo" ADD COLUMN "webhookId" integer NOT NULL;