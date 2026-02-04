CREATE TABLE "habit_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" uuid NOT NULL,
	"completed_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE cascade;

CREATE UNIQUE INDEX "habit_completions_habit_day_unique" ON "habit_completions" ("habit_id","completed_on");
