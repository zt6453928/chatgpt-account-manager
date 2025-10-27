# Session Token 验证指南

## 什么是Session Token?

Session Token是ChatGPT用于维持登录状态的认证凭证。通过Session Token,应用可以:

- ✅ 验证账号是否有效
- ✅ 自动识别账号类型(Free/Plus/Pro)
- ✅ 获取账号邮箱和用户名
- ✅ 检查订阅过期时间

## 如何获取Session Token?

### 方法一: 使用应用内登录(推荐)

1. 点击"登录添加账号"按钮
2. 按照界面提示操作:
   - 在新标签页打开 https://chat.openai.com
   - 登录您的ChatGPT账号
   - 按F12打开开发者工具
   - 找到Cookie中的session token
   - 复制并粘贴到应用中
3. 点击"验证并保存"
4. 系统自动验证并添加账号

### 方法二: 手动获取

#### Chrome/Edge浏览器

1. 访问 https://chat.openai.com 并登录
2. 按 `F12` 打开开发者工具
3. 切换到 `Application` 标签
4. 左侧展开 `Storage` → `Cookies` → `https://chat.openai.com`
5. 找到名为 `__Secure-next-auth.session-token` 的Cookie
6. 双击值列,复制整个值

#### Firefox浏览器

1. 访问 https://chat.openai.com 并登录
2. 按 `F12` 打开开发者工具
3. 切换到 `存储` 标签
4. 左侧选择 `Cookie` → `https://chat.openai.com`
5. 找到 `__Secure-next-auth.session-token`
6. 复制其值

#### Safari浏览器

1. 启用开发者菜单: `Safari` → `偏好设置` → `高级` → 勾选"在菜单栏中显示开发菜单"
2. 访问 https://chat.openai.com 并登录
3. 菜单栏选择 `开发` → `显示Web检查器`
4. 切换到 `存储` 标签
5. 选择 `Cookies` → `https://chat.openai.com`
6. 找到并复制session token

## Session Token格式

Session Token通常是一个很长的字符串(200-300个字符),格式类似:

```
eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..xxxxxxxxxxxxx...
```

⚠️ **注意**: 请确保复制完整的token,不要遗漏任何字符。

## 验证原理

应用使用Session Token调用ChatGPT的官方API:

```typescript
// 1. 获取session信息
GET https://chat.openai.com/api/auth/session
Cookie: __Secure-next-auth.session-token={YOUR_TOKEN}

// 2. 返回的数据包含:
{
  "user": {
    "id": "user-xxx",
    "name": "Your Name",
    "email": "your@email.com",
    "groups": ["chatgpt_plus"]  // 或 ["chatgpt_pro"]
  },
  "expires": "2025-02-27T..."
}

// 3. 根据groups字段判断账号类型:
// - 包含 "chatgpt_pro" → Pro账号
// - 包含 "chatgpt_plus" → Plus账号  
// - 其他 → Free账号
```

## 安全性说明

### Session Token的权限

⚠️ **重要**: Session Token具有**完整的账号访问权限**,相当于您的账号密码。

拥有您的Session Token的人可以:
- 访问您的ChatGPT账号
- 查看您的对话历史
- 使用您的账号发送消息
- 修改账号设置

### 安全建议

1. **不要分享**: 永远不要将Session Token分享给他人
2. **定期更换**: 建议每月更换一次Session Token
3. **安全存储**: 应用会加密存储Token,但仍建议定期检查
4. **及时撤销**: 如果怀疑Token泄露,立即退出ChatGPT账号(会使Token失效)

### 如何撤销Session Token?

如果您的Token可能已泄露:

1. 访问 https://chat.openai.com
2. 点击右下角头像 → `Log out`
3. 重新登录并获取新的Session Token
4. 在本应用中更新账号的Token

## Token过期处理

Session Token会在以下情况下失效:

- 主动退出ChatGPT账号
- Token自然过期(通常30天)
- 修改账号密码
- ChatGPT安全策略触发

当Token失效时:

1. 应用会显示"账号不可用"或"已过期"
2. 重新获取新的Session Token
3. 编辑账号,更新Token
4. 点击"验证"按钮重新验证

## 常见问题

### Q: Token在哪里存储?

A: Token加密存储在应用数据库的`password`字段中。虽然字段名是password,但实际存储的是Session Token。

### Q: 为什么验证失败?

可能的原因:
- Token复制不完整
- Token已过期
- ChatGPT服务器限流
- 网络连接问题

### Q: 可以同时使用多个设备的Token吗?

A: 可以。同一个ChatGPT账号可以在多个设备登录,每个设备有独立的Session Token。

### Q: Token会被其他用户看到吗?

A: 不会。应用使用了以下安全措施:
- 数据库中加密存储
- 前端默认隐藏显示(密码框)
- 每个用户只能访问自己的账号

### Q: 验证频率建议?

建议验证频率:
- **新添加账号**: 立即验证
- **Free账号**: 每周验证一次
- **Plus/Pro账号**: 每月验证一次
- **出现问题时**: 随时手动验证

## 技术实现

### 后端验证流程

```typescript
// server/chatgpt-auth.ts
export async function verifyAccountWithSession(sessionToken: string) {
  // 1. 调用ChatGPT session API
  const response = await fetch('https://chat.openai.com/api/auth/session', {
    headers: {
      Cookie: `__Secure-next-auth.session-token=${sessionToken}`
    }
  });
  
  // 2. 解析返回数据
  const data = await response.json();
  
  // 3. 检测账号类型
  const accountType = detectAccountType(data);
  
  // 4. 返回验证结果
  return {
    isValid: true,
    accountType,
    email: data.user.email,
    expiresAt: new Date(data.expires)
  };
}
```

### 前端使用

```typescript
// 添加账号时自动验证
const handleLoginSuccess = async (sessionToken, email) => {
  const account = await createMutation.mutateAsync({
    email,
    password: sessionToken,  // 存储session token
    accountType: "free",
    status: "inactive",
  });
  
  // 立即验证
  verifyMutation.mutate({ id: account.id });
};
```

## 替代方案

如果您不想使用Session Token,可以:

1. **手动添加**: 手动输入账号信息和类型
2. **定期手动更新**: 手动检查并更新账号状态
3. **使用官方API**: 如果有OpenAI API key,可以使用官方API验证

## 相关链接

- [ChatGPT官网](https://chat.openai.com)
- [OpenAI API文档](https://platform.openai.com/docs)
- [项目GitHub](https://github.com/zt6453928/chatgpt-account-manager)

## 获取帮助

如有问题,请:
1. 查看应用内的操作提示
2. 阅读本文档
3. 在GitHub提Issue: https://github.com/zt6453928/chatgpt-account-manager/issues

