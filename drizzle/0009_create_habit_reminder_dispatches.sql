CREATE TABLE "habit_reminder_dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habit_reminder_dispatches" ADD CONSTRAINT "habit_reminder_dispatches_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "habit_reminder_dispatches_habit_local_date_unique" ON "habit_reminder_dispatches" USING btree ("habit_id","local_date");
