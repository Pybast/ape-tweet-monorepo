import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const userWallets = pgTable("user_wallets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
