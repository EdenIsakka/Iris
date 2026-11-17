ALTER TABLE "transactions" DROP CONSTRAINT "transactions_wallet_id_wallets_id_fk";
--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "opening_balance_minor" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;