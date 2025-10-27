import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle,
  Smartphone,
  Code,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function QuickAdd() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sessionToken, setSessionToken] = useState("");
  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [bookmarkletCode, setBookmarkletCode] = useState("");

  const utils = trpc.useUtils();

  useEffect(() => {
    // 生成书签脚本代码
    const code = generateBookmarklet();
    setBookmarkletCode(code);

    // 监听来自其他页面的消息
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "CHATGPT_TOKEN") {
        setSessionToken(event.data.token);
        setEmail(event.data.email || "");
        toast.success("已自动获取Session Token!");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const createMutation = trpc.chatgpt.create.useMutation({
    onSuccess: () => {
      toast.success("账号添加成功!");
      utils.chatgpt.list.invalidate();
      setTimeout(() => {
        setLocation("/accounts");
      }, 1000);
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
      setIsAdding(false);
    },
  });

  const verifyMutation = trpc.chatgpt.verify.useMutation({
    onSuccess: (result) => {
      if (result.isValid) {
        toast.success(`验证成功! 账号类型: ${result.accountType?.toUpperCase()}`);
      } else {
        toast.error(`验证失败: ${result.error || "账号不可用"}`);
      }
      setIsAdding(false);
    },
    onError: (error) => {
      toast.error(`验证失败: ${error.message}`);
      setIsAdding(false);
    },
  });

  const handleAdd = async () => {
    if (!sessionToken.trim()) {
      toast.error("请先获取Session Token");
      return;
    }

    setIsAdding(true);
    try {
      const account = await createMutation.mutateAsync({
        email: email || "待验证",
        password: sessionToken,
        accountType: "free",
        status: "inactive",
        notes: "通过快速添加功能添加",
      });

      if (account && account.id) {
        toast.info("正在验证账号...");
        setTimeout(() => {
          verifyMutation.mutate({ id: account.id });
        }, 500);
      }
    } catch (error) {
      console.error("添加账号失败:", error);
      setIsAdding(false);
    }
  };

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    toast.success("书签脚本已复制!");
  };

  const copyInstructions = () => {
    const instructions = `
移动端快速添加ChatGPT账号步骤：

方法一：使用书签脚本（推荐）
1. 复制下方的书签脚本代码
2. 在浏览器中添加新书签
3. 将代码粘贴为书签的URL
4. 访问 chat.openai.com 并登录
5. 点击刚才添加的书签
6. 自动跳转回本页面并填充Token

方法二：手动提取
1. 访问 chat.openai.com 并登录
2. 在地址栏输入并执行下方的JavaScript代码
3. 复制返回的Token
4. 返回本页面粘贴Token
    `.trim();

    navigator.clipboard.writeText(instructions);
    toast.success("操作说明已复制!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录{APP_TITLE}账号</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-xl font-bold text-foreground flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              快速添加账号
            </a>
          </Link>
          <Link href="/accounts">
            <a>
              <Button variant="outline" size="sm">
                返回列表
              </Button>
            </a>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                移动端快速添加
              </CardTitle>
              <CardDescription>
                专为手机用户优化的快速添加流程
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <div className="font-semibold mb-2">📱 移动端操作步骤：</div>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>点击下方"打开ChatGPT"按钮</li>
                    <li>在新标签页中登录您的ChatGPT账号</li>
                    <li>登录成功后，点击"提取Token"按钮</li>
                    <li>Token会自动填充到下方输入框</li>
                    <li>点击"添加账号"完成</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  asChild
                  className="flex-1"
                  variant="default"
                >
                  <a
                    href="https://chat.openai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    打开ChatGPT
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const script = `
(function() {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('__Secure-next-auth.session-token='))
    ?.split('=')[1];
  
  if (token) {
    alert('Token已复制到剪贴板!\\n\\n请返回账号管理页面粘贴。\\n\\nToken: ' + token.substring(0, 50) + '...');
    
    // 尝试复制到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token);
    }
    
    // 尝试发送消息给父窗口
    if (window.opener) {
      window.opener.postMessage({
        type: 'CHATGPT_TOKEN',
        token: token
      }, '*');
    }
  } else {
    alert('未找到Session Token!\\n\\n请确保：\\n1. 已登录ChatGPT\\n2. 在chat.openai.com域名下执行');
  }
})();
                    `.trim();

                    // 复制脚本到剪贴板
                    navigator.clipboard.writeText(script);
                    toast.success("提取脚本已复制! 请在ChatGPT页面的地址栏粘贴并执行");
                  }}
                >
                  <Code className="h-4 w-4 mr-2" />
                  复制提取脚本
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionToken">Session Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="sessionToken"
                    type="text"
                    placeholder="Token会自动填充到这里，或手动粘贴"
                    value={sessionToken}
                    onChange={(e) => setSessionToken(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.readText().then((text) => {
                        setSessionToken(text);
                        toast.success("已从剪贴板粘贴");
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {email && (
                <div className="space-y-2">
                  <Label>检测到的邮箱</Label>
                  <Input value={email} disabled />
                </div>
              )}

              <Button
                onClick={handleAdd}
                disabled={isAdding || !sessionToken}
                className="w-full"
                size="lg"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    添加中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    添加账号
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>高级：书签脚本（Bookmarklet）</CardTitle>
              <CardDescription>
                一键提取Token的更便捷方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription className="text-sm space-y-2">
                  <div className="font-semibold">使用方法：</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>点击"复制书签代码"按钮</li>
                    <li>在浏览器中添加新书签（收藏）</li>
                    <li>将复制的代码粘贴为书签的网址/URL</li>
                    <li>访问chat.openai.com并登录</li>
                    <li>点击刚才创建的书签</li>
                    <li>Token会自动提取并复制</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>书签代码</Label>
                <div className="relative">
                  <Input
                    value={bookmarkletCode}
                    readOnly
                    className="font-mono text-xs pr-20"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1"
                    onClick={copyBookmarklet}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function generateBookmarklet(): string {
  const script = `
(function() {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('__Secure-next-auth.session-token='))
    ?.split('=')[1];
  
  if (token) {
    navigator.clipboard.writeText(token).then(() => {
      alert('✅ Session Token已复制到剪贴板!\\n\\n请返回账号管理页面粘贴。');
    });
  } else {
    alert('❌ 未找到Session Token!\\n\\n请确保：\\n1. 已登录ChatGPT\\n2. 在chat.openai.com域名下执行此书签');
  }
})();
  `.trim();

  return `javascript:${encodeURIComponent(script)}`;
}

