ALTER TABLE "goals" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
-- La app nunca archivaba metas; por si alguna quedó así, vuelve a activa antes de quitar el valor.
UPDATE "goals" SET "status" = 'active' WHERE "status" = 'archived';--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."goal_status";--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('active', 'completed');--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."goal_status";--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "status" SET DATA TYPE "public"."goal_status" USING "status"::"public"."goal_status";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "icon";