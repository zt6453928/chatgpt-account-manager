/**
 * 测试脚本 - 验证ChatGPT账号管理API
 * 运行: pnpm tsx test-api.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { chatgptAccounts, users } from "./drizzle/schema";

async function testAPI() {
  console.log("🧪 开始测试API功能...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL 未设置");
    return;
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // 1. 测试数据库连接
    console.log("1️⃣ 测试数据库连接...");
    const userCount = await db.select().from(users);
    console.log(`✅ 数据库连接成功，当前用户数: ${userCount.length}\n`);

    // 2. 创建测试账号
    console.log("2️⃣ 测试创建ChatGPT账号...");
    const testAccount = {
      userId: 1, // 假设用户ID为1
      email: "test@example.com",
      password: "encrypted_password_123",
      accountType: "plus" as const,
      status: "active" as const,
      notes: "测试账号",
    };

    const insertResult = await db.insert(chatgptAccounts).values(testAccount);
    const insertedId = Number(insertResult[0].insertId);
    console.log(`✅ 账号创建成功，ID: ${insertedId}\n`);

    // 3. 查询账号
    console.log("3️⃣ 测试查询账号...");
    const accounts = await db
      .select()
      .from(chatgptAccounts)
      .where(eq(chatgptAccounts.id, insertedId));

    if (accounts.length > 0) {
      console.log("✅ 账号查询成功:");
      console.log(`   - 邮箱: ${accounts[0].email}`);
      console.log(`   - 类型: ${accounts[0].accountType}`);
      console.log(`   - 状态: ${accounts[0].status}\n`);
    }

    // 4. 更新账号
    console.log("4️⃣ 测试更新账号...");
    await db
      .update(chatgptAccounts)
      .set({ status: "inactive", notes: "已更新的测试账号" })
      .where(eq(chatgptAccounts.id, insertedId));

    const updatedAccounts = await db
      .select()
      .from(chatgptAccounts)
      .where(eq(chatgptAccounts.id, insertedId));

    if (updatedAccounts[0].status === "inactive") {
      console.log("✅ 账号更新成功\n");
    }

    // 5. 删除账号
    console.log("5️⃣ 测试删除账号...");
    await db.delete(chatgptAccounts).where(eq(chatgptAccounts.id, insertedId));

    const deletedAccounts = await db
      .select()
      .from(chatgptAccounts)
      .where(eq(chatgptAccounts.id, insertedId));

    if (deletedAccounts.length === 0) {
      console.log("✅ 账号删除成功\n");
    }

    console.log("🎉 所有测试通过!");
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

testAPI();

