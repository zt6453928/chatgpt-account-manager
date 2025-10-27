/**
 * ChatGPT账号真实验证服务
 * 通过ChatGPT官方API获取账号信息
 */

export interface ChatGPTSessionInfo {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    picture?: string;
    groups?: string[];
  };
  expires: string;
  accessToken?: string;
}

export interface AccountVerificationResult {
  isValid: boolean;
  accountType: "free" | "plus" | "pro" | null;
  status: "active" | "inactive" | "expired" | "banned";
  email?: string;
  name?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * 通过session token获取ChatGPT账号信息
 */
export async function getSessionInfo(
  sessionToken: string
): Promise<ChatGPTSessionInfo | null> {
  try {
    const response = await fetch("https://chat.openai.com/api/auth/session", {
      headers: {
        Cookie: `__Secure-next-auth.session-token=${sessionToken}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error("Session API返回错误:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("获取session信息失败:", error);
    return null;
  }
}

/**
 * 检测账号类型
 */
function detectAccountType(sessionInfo: ChatGPTSessionInfo): "free" | "plus" | "pro" {
  const groups = sessionInfo.user?.groups || [];
  
  // 检查是否是Pro账号
  if (groups.includes("chatgpt_pro") || groups.includes("pro")) {
    return "pro";
  }
  
  // 检查是否是Plus账号
  if (groups.includes("chatgpt_plus") || groups.includes("plus")) {
    return "plus";
  }
  
  // 默认为Free账号
  return "free";
}

/**
 * 验证ChatGPT账号（通过session token）
 */
export async function verifyAccountWithSession(
  sessionToken: string
): Promise<AccountVerificationResult> {
  try {
    const sessionInfo = await getSessionInfo(sessionToken);

    if (!sessionInfo || !sessionInfo.user) {
      return {
        isValid: false,
        accountType: null,
        status: "inactive",
        error: "Session token无效或已过期",
      };
    }

    // 检测账号类型
    const accountType = detectAccountType(sessionInfo);

    // 检查session是否过期
    const expiresAt = new Date(sessionInfo.expires);
    const isExpired = expiresAt < new Date();

    return {
      isValid: !isExpired,
      accountType,
      status: isExpired ? "expired" : "active",
      email: sessionInfo.user.email,
      name: sessionInfo.user.name,
      expiresAt: expiresAt,
    };
  } catch (error) {
    console.error("验证账号失败:", error);
    return {
      isValid: false,
      accountType: null,
      status: "inactive",
      error: error instanceof Error ? error.message : "验证失败",
    };
  }
}

/**
 * 获取账号详细信息（包括使用情况）
 */
export async function getAccountDetails(sessionToken: string) {
  try {
    // 获取账号基本信息
    const sessionInfo = await getSessionInfo(sessionToken);
    if (!sessionInfo) {
      return null;
    }

    // 尝试获取账号订阅信息
    const accountsResponse = await fetch(
      "https://chat.openai.com/backend-api/accounts/check",
      {
        headers: {
          Cookie: `__Secure-next-auth.session-token=${sessionToken}`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    let accountDetails = null;
    if (accountsResponse.ok) {
      accountDetails = await accountsResponse.json();
    }

    return {
      session: sessionInfo,
      account: accountDetails,
    };
  } catch (error) {
    console.error("获取账号详情失败:", error);
    return null;
  }
}

/**
 * 从浏览器Cookie中提取session token
 * 这个函数用于前端，帮助用户提取token
 */
export function extractSessionTokenFromCookies(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (
      name === "__Secure-next-auth.session-token" ||
      name === "__Secure-next-auth.session-token.0"
    ) {
      return value;
    }
  }

  return null;
}

