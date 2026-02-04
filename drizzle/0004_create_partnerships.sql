CREATE TABLE "partnerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "partnerships_user_pair_unique" ON "partnerships" ("user_a_id","user_b_id");
