CREATE TABLE "monitoringRepo" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"repoName" varchar NOT NULL,
	"branchName" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monitoringRepo" ADD CONSTRAINT "monitoringRepo_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;