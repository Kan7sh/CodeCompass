CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar,
	"imageUrl" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"githubId" varchar,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
