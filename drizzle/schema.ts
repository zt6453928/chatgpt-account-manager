import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * ChatGPT账号表
 * 存储用户添加的ChatGPT账号信息
 */
export const chatgptAccounts = mysqlTable("chatgptAccounts", {
  id: int("id").autoincrement().primaryKey(),
  /** 所属用户ID */
  userId: int("userId").notNull(),
  /** 账号邮箱或用户名 */
  email: varchar("email", { length: 320 }).notNull(),
  /** 账号密码(加密存储) */
  password: text("password").notNull(),
  /** 账号类型: free, plus, pro */
  accountType: mysqlEnum("accountType", ["free", "plus", "pro"]).default("free").notNull(),
  /** 账号状态: active(可用), inactive(不可用), expired(已过期), banned(被封禁) */
  status: mysqlEnum("status", ["active", "inactive", "expired", "banned"]).default("inactive").notNull(),
  /** 备注信息 */
  notes: text("notes"),
  /** 最后验证时间 */
  lastVerified: timestamp("lastVerified"),
  /** 过期时间(仅对Plus/Pro账号) */
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatGPTAccount = typeof chatgptAccounts.$inferSelect;
export type InsertChatGPTAccount = typeof chatgptAccounts.$inferInsert;