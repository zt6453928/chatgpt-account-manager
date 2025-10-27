# ChatGPT Account Manager

一个安全、高效的ChatGPT账号管理平台，帮助您轻松管理多个ChatGPT账号。

## 功能特性

### 核心功能

- **账号管理**: 添加、编辑、删除ChatGPT账号
- **状态监控**: 实时查看账号状态(可用/不可用/已过期/被封禁)
- **类型识别**: 支持Free、Plus、Pro等不同类型账号管理
- **安全存储**: 密码加密存储，支持显示/隐藏切换
- **备注功能**: 为每个账号添加自定义备注信息
- **用户认证**: 基于Manus OAuth的安全登录系统

### 技术特性

- **现代化界面**: React 19 + Tailwind CSS 4 深色主题设计
- **类型安全**: TypeScript + tRPC端到端类型安全
- **响应式设计**: 完美支持桌面和移动设备
- **实时更新**: 乐观更新策略提供流畅用户体验

## 技术栈

### 前端
- **框架**: React 19
- **样式**: Tailwind CSS 4
- **UI组件**: shadcn/ui
- **路由**: wouter
- **状态管理**: TanStack Query (React Query)

### 后端
- **运行时**: Node.js + Express
- **API**: tRPC 11
- **数据库**: MySQL/TiDB + Drizzle ORM
- **认证**: Manus OAuth

## 快速开始

### 环境要求

- Node.js 22+
- pnpm 包管理器
- MySQL/TiDB 数据库

### 安装依赖

```bash
pnpm install
```

### 数据库迁移

```bash
pnpm db:push
```

### 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:3000` 启动。

## 项目结构

```
chatgpt-account-manager/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # UI组件
│   │   └── lib/           # 工具库
├── server/                 # 后端代码
│   ├── routers.ts         # tRPC路由
│   ├── db.ts              # 数据库查询
│   └── _core/             # 核心功能
├── drizzle/               # 数据库schema
│   └── schema.ts          # 表结构定义
└── shared/                # 共享类型和常量
```

## 数据库设计

### chatgptAccounts 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| userId | INT | 所属用户ID |
| email | VARCHAR(320) | 账号邮箱 |
| password | TEXT | 加密密码 |
| accountType | ENUM | 账号类型(free/plus/pro) |
| status | ENUM | 状态(active/inactive/expired/banned) |
| notes | TEXT | 备注信息 |
| lastVerified | TIMESTAMP | 最后验证时间 |
| expiresAt | TIMESTAMP | 过期时间 |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

## API文档

### tRPC路由

#### `chatgpt.list`
获取当前用户的所有ChatGPT账号列表

#### `chatgpt.create`
创建新的ChatGPT账号
- 参数: `{ email, password, accountType, status, notes?, expiresAt? }`

#### `chatgpt.update`
更新账号信息
- 参数: `{ id, email?, password?, accountType?, status?, notes?, expiresAt? }`

#### `chatgpt.delete`
删除账号
- 参数: `{ id }`

#### `chatgpt.getById`
获取单个账号详情
- 参数: `{ id }`

## 部署

### 使用Manus平台部署

1. 创建检查点
```bash
# 检查点已自动创建
```

2. 点击管理面板中的"Publish"按钮发布应用

3. 应用将获得一个公开访问域名

### 环境变量

以下环境变量由平台自动注入，无需手动配置:

- `DATABASE_URL`: 数据库连接字符串
- `JWT_SECRET`: JWT密钥
- `VITE_APP_ID`: OAuth应用ID
- `OAUTH_SERVER_URL`: OAuth服务器地址
- `VITE_OAUTH_PORTAL_URL`: OAuth登录门户

## 安全说明

- 密码采用加密存储，不以明文保存
- 所有API操作需要用户认证
- 用户只能访问和管理自己的账号
- 支持密码显示/隐藏切换，防止肩窥

## 开发指南

### 添加新功能

1. 在 `drizzle/schema.ts` 中更新数据库schema
2. 运行 `pnpm db:push` 推送schema变更
3. 在 `server/db.ts` 中添加数据库查询函数
4. 在 `server/routers.ts` 中添加tRPC路由
5. 在前端页面中使用 `trpc.*` hooks调用API

### 测试

运行API测试:
```bash
pnpm tsx test-api.ts
```

## 许可证

MIT License

## 作者

Created with Manus AI

## 链接

- **GitHub仓库**: https://github.com/zt6453928/chatgpt-account-manager
- **在线演示**: [待发布后更新]

## 更新日志

### v1.0.0 (2025-01-27)

- ✨ 初始版本发布
- ✅ 完整的账号管理功能
- ✅ 现代化深色主题界面
- ✅ 完整的测试覆盖
- ✅ GitHub仓库创建

