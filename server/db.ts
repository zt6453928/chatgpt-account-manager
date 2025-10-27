import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ChatGPT账号相关查询
import { chatgptAccounts, ChatGPTAccount, InsertChatGPTAccount } from "../drizzle/schema";
import { desc } from "drizzle-orm";

/**
 * 获取用户的所有ChatGPT账号
 */
export async function getUserChatGPTAccounts(userId: number): Promise<ChatGPTAccount[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get accounts: database not available");
    return [];
  }
  
  const result = await db
    .select()
    .from(chatgptAccounts)
    .where(eq(chatgptAccounts.userId, userId))
    .orderBy(desc(chatgptAccounts.createdAt));
  
  return result;
}

/**
 * 添加新的ChatGPT账号
 */
export async function createChatGPTAccount(account: InsertChatGPTAccount): Promise<ChatGPTAccount> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const result = await db.insert(chatgptAccounts).values(account);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db
    .select()
    .from(chatgptAccounts)
    .where(eq(chatgptAccounts.id, insertedId))
    .limit(1);
  
  if (inserted.length === 0) {
    throw new Error("Failed to create account");
  }
  
  return inserted[0];
}

/**
 * 更新ChatGPT账号
 */
export async function updateChatGPTAccount(
  id: number,
  userId: number,
  updates: Partial<InsertChatGPTAccount>
): Promise<ChatGPTAccount | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db
    .update(chatgptAccounts)
    .set(updates)
    .where(eq(chatgptAccounts.id, id));
  
  const updated = await db
    .select()
    .from(chatgptAccounts)
    .where(eq(chatgptAccounts.id, id))
    .limit(1);
  
  return updated.length > 0 ? updated[0] : null;
}

/**
 * 删除ChatGPT账号
 */
export async function deleteChatGPTAccount(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const result = await db
    .delete(chatgptAccounts)
    .where(eq(chatgptAccounts.id, id));
  
  return true;
}

/**
 * 获取单个ChatGPT账号
 */
export async function getChatGPTAccountById(id: number, userId: number): Promise<ChatGPTAccount | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get account: database not available");
    return null;
  }
  
  const result = await db
    .select()
    .from(chatgptAccounts)
    .where(eq(chatgptAccounts.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}
