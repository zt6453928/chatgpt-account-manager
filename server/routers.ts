import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUserChatGPTAccounts,
  createChatGPTAccount,
  updateChatGPTAccount,
  deleteChatGPTAccount,
  getChatGPTAccountById,
} from "./db";
import { verifyChatGPTAccount, verifyWithSessionToken } from "./chatgpt-verifier";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ChatGPT账号管理路由
  chatgpt: router({
    // 获取当前用户的所有账号
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserChatGPTAccounts(ctx.user.id);
    }),

    // 添加新账号
    create: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
          accountType: z.enum(["free", "plus", "pro"]).default("free"),
          status: z.enum(["active", "inactive", "expired", "banned"]).default("inactive"),
          notes: z.string().optional(),
          expiresAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createChatGPTAccount({
          userId: ctx.user.id,
          ...input,
        });
      }),

    // 更新账号
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          email: z.string().email().optional(),
          password: z.string().min(1).optional(),
          accountType: z.enum(["free", "plus", "pro"]).optional(),
          status: z.enum(["active", "inactive", "expired", "banned"]).optional(),
          notes: z.string().optional(),
          expiresAt: z.date().optional().nullable(),
          lastVerified: z.date().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return await updateChatGPTAccount(id, ctx.user.id, updates);
      }),

    // 删除账号
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteChatGPTAccount(input.id, ctx.user.id);
      }),

    // 获取单个账号详情
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getChatGPTAccountById(input.id, ctx.user.id);
      }),

    // 验证账号状态和类型
    verify: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          useSessionToken: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 获取账号信息
        const account = await getChatGPTAccountById(input.id, ctx.user.id);
        if (!account) {
          throw new Error("账号不存在");
        }

        // 执行验证
        const result = input.useSessionToken
          ? await verifyWithSessionToken(account.password)
          : await verifyChatGPTAccount(account.email, account.password);

        // 更新账号信息
        if (result.isValid && result.accountType) {
          await updateChatGPTAccount(input.id, ctx.user.id, {
            accountType: result.accountType,
            status: result.status,
            lastVerified: new Date(),
            expiresAt: result.details?.expiresAt,
          });
        } else {
          await updateChatGPTAccount(input.id, ctx.user.id, {
            status: result.status,
            lastVerified: new Date(),
          });
        }

        return result;
      }),

    // 批量验证账号
    verifyAll: protectedProcedure.mutation(async ({ ctx }) => {
      const accounts = await getUserChatGPTAccounts(ctx.user.id);
      const results = [];

      for (const account of accounts) {
        try {
          const result = await verifyChatGPTAccount(account.email, account.password);
          
          if (result.isValid && result.accountType) {
            await updateChatGPTAccount(account.id, ctx.user.id, {
              accountType: result.accountType,
              status: result.status,
              lastVerified: new Date(),
              expiresAt: result.details?.expiresAt,
            });
          } else {
            await updateChatGPTAccount(account.id, ctx.user.id, {
              status: result.status,
              lastVerified: new Date(),
            });
          }

          results.push({
            id: account.id,
            email: account.email,
            success: result.isValid,
            accountType: result.accountType,
            status: result.status,
          });
        } catch (error) {
          results.push({
            id: account.id,
            email: account.email,
            success: false,
            error: error instanceof Error ? error.message : "未知错误",
          });
        }
      }

      return results;
    }),
  }),
});

export type AppRouter = typeof appRouter;
