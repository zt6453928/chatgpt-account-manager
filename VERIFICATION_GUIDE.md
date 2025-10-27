# ChatGPT账号自动验证功能说明

## 功能概述

本应用现已支持**自动验证ChatGPT账号**的状态和类型,无需手动输入。系统会自动检测:

- ✅ 账号是否可用(登录验证)
- ✅ 账号类型(Free/Plus/Pro)
- ✅ 账号状态(可用/不可用/已过期/被封禁)
- ✅ 订阅过期时间(Plus/Pro账号)

## 使用方法

### 方式一: 单个账号验证

1. 在账号列表中找到要验证的账号
2. 点击账号卡片底部的**"验证"**按钮
3. 系统会自动检测并更新账号状态和类型
4. 验证结果会显示在通知中

### 方式二: 批量验证

1. 点击页面右上角的**"批量验证"**按钮
2. 确认批量验证操作
3. 系统会依次验证所有账号
4. 完成后显示验证成功的账号数量

## 验证逻辑

### 当前实现(模拟验证)

由于ChatGPT有反爬虫机制,当前版本使用**模拟验证逻辑**进行演示:

```typescript
// 模拟验证规则:
- 邮箱包含"invalid" → 账号不存在
- 邮箱包含"banned" → 账号被封禁
- 邮箱包含"expired" → Plus订阅已过期
- 邮箱包含"pro" → Pro账号
- 邮箱包含"plus" → Plus账号
- 其他 → Free账号
```

### 生产环境实现建议

在实际生产环境中,建议使用以下方式之一:

#### 1. Session Token验证(推荐)

用户从浏览器中复制session token,应用使用token验证账号:

```typescript
// 步骤:
1. 用户访问 https://chat.openai.com
2. 打开浏览器开发者工具 → Application → Cookies
3. 复制 __Secure-next-auth.session-token 的值
4. 在应用中添加账号时,将token作为密码输入
5. 应用使用token调用 https://chat.openai.com/api/auth/session 验证
```

#### 2. 浏览器自动化

使用Puppeteer或Playwright自动登录并检测账号状态:

```typescript
// 需要安装:
npm install puppeteer

// 验证流程:
1. 启动无头浏览器
2. 访问ChatGPT登录页
3. 自动填写账号密码登录
4. 检查登录后的页面信息
5. 提取账号类型和状态
6. 关闭浏览器
```

#### 3. 官方API(如果可用)

如果您有OpenAI API访问权限,可以使用官方API验证:

```typescript
// 使用OpenAI API检查账号信息
const response = await fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});
```

## 验证结果

验证完成后,系统会自动更新以下信息:

| 字段 | 说明 |
|------|------|
| accountType | 账号类型(free/plus/pro) |
| status | 账号状态(active/inactive/expired/banned) |
| lastVerified | 最后验证时间 |
| expiresAt | 过期时间(仅Plus/Pro) |

## 安全提示

⚠️ **重要安全建议:**

1. **不要在公共网络上使用自动验证功能**
2. **Session token具有完整账号权限,请妥善保管**
3. **定期更换session token**
4. **使用HTTPS加密传输**
5. **不要与他人分享您的验证凭证**

## 技术实现

### 后端API

```typescript
// 单个账号验证
POST /api/trpc/chatgpt.verify
{
  "id": 1,
  "useSessionToken": true  // 可选,使用session token验证
}

// 批量验证
POST /api/trpc/chatgpt.verifyAll
```

### 前端调用

```typescript
// 单个验证
const verifyMutation = trpc.chatgpt.verify.useMutation({
  onSuccess: (result) => {
    if (result.isValid) {
      toast.success(`验证成功! 账号类型: ${result.accountType}`);
    }
  }
});

verifyMutation.mutate({ id: accountId });

// 批量验证
const verifyAllMutation = trpc.chatgpt.verifyAll.useMutation({
  onSuccess: (results) => {
    const successCount = results.filter(r => r.success).length;
    toast.success(`验证完成: ${successCount}/${results.length}`);
  }
});

verifyAllMutation.mutate();
```

## 常见问题

### Q: 为什么验证失败?

A: 可能的原因:
- Session token已过期
- 账号密码错误
- ChatGPT服务器限流
- 网络连接问题

### Q: 多久需要重新验证?

A: 建议:
- Free账号: 每周验证一次
- Plus账号: 每月验证一次
- Pro账号: 每月验证一次
- 或在账号出现问题时手动验证

### Q: 验证会消耗ChatGPT额度吗?

A: 不会。验证只是检查账号状态,不会发送消息或消耗对话额度。

### Q: 可以自定义验证逻辑吗?

A: 可以。修改 `server/chatgpt-verifier.ts` 文件中的验证函数即可。

## 未来改进

- [ ] 支持定时自动验证
- [ ] 验证失败时发送通知
- [ ] 支持更多账号类型检测
- [ ] 添加验证历史记录
- [ ] 支持自定义验证规则

## 相关文件

- `server/chatgpt-verifier.ts` - 验证服务实现
- `server/routers.ts` - API路由定义
- `client/src/pages/Accounts.tsx` - 前端界面

## 技术支持

如有问题,请访问: https://github.com/zt6453928/chatgpt-account-manager/issues

