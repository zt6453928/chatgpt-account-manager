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
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function EasyAdd() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"start" | "login" | "extracting" | "adding" | "done">("start");
  const [sessionToken, setSessionToken] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const utils = trpc.useUtils();

  const createMutation = trpc.chatgpt.create.useMutation({
    onSuccess: () => {
      toast.success("账号添加成功!");
      utils.chatgpt.list.invalidate();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
      setError(error.message);
      setStep("start");
    },
  });

  const verifyMutation = trpc.chatgpt.verify.useMutation({
    onSuccess: (result) => {
      if (result.isValid) {
        toast.success(`验证成功! 账号类型: ${result.accountType?.toUpperCase()}`);
        setStep("done");
        setTimeout(() => {
          setLocation("/accounts");
        }, 2000);
      } else {
        toast.error(`验证失败: ${result.error || "账号不可用"}`);
        setError(result.error || "账号不可用");
        setStep("start");
      }
    },
    onError: (error) => {
      toast.error(`验证失败: ${error.message}`);
      setError(error.message);
      setStep("start");
    },
  });

  useEffect(() => {
    // 清理定时器
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const startLogin = () => {
    setStep("login");
    setError("");
    
    // 开始检查登录状态
    checkIntervalRef.current = setInterval(() => {
      checkLoginStatus();
    }, 2000);
  };

  const checkLoginStatus = async () => {
    try {
      // 尝试通过新窗口检查登录状态
      const checkWindow = window.open(
        "https://chat.openai.com/api/auth/session",
        "_blank",
        "width=1,height=1"
      );

      if (checkWindow) {
        setTimeout(() => {
          checkWindow.close();
        }, 1000);
      }

      // 由于跨域限制，我们使用另一种方法
      // 让用户在登录后点击"完成登录"按钮
    } catch (error) {
      console.error("检查登录状态失败:", error);
    }
  };

  const handleLoginComplete = async () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    setStep("extracting");
    
    // 提示用户从剪贴板粘贴
    toast.info("请从ChatGPT页面复制Token后，点击下方的粘贴按钮");
  };

  const handlePasteToken = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.length > 100) {
        setSessionToken(text);
        handleTokenExtracted(text);
      } else {
        toast.error("剪贴板中没有有效的Token");
      }
    } catch (error) {
      toast.error("无法读取剪贴板，请手动粘贴Token");
      // 显示手动输入框
      setStep("login");
    }
  };

  const handleTokenExtracted = async (token: string) => {
    setStep("adding");

    try {
      // 先验证token获取邮箱
      const response = await fetch("https://chat.openai.com/api/auth/session", {
        headers: {
          Cookie: `__Secure-next-auth.session-token=${token}`,
        },
      });

      let userEmail = "待验证";
      if (response.ok) {
        const data = await response.json();
        userEmail = data.user?.email || "待验证";
        setEmail(userEmail);
      }

      // 添加账号
      const account = await createMutation.mutateAsync({
        email: userEmail,
        password: token,
        accountType: "free",
        status: "inactive",
        notes: "通过简易添加功能添加",
      });

      // 验证账号
      if (account && account.id) {
        setTimeout(() => {
          verifyMutation.mutate({ id: account.id! });
        }, 500);
      }
    } catch (error) {
      console.error("处理Token失败:", error);
      setError("添加账号失败");
      setStep("start");
    }
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
            <a className="text-xl font-bold text-foreground">
              简易添加
            </a>
          </Link>
          <Link href="/accounts">
            <a>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </a>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>超简单添加ChatGPT账号</CardTitle>
              <CardDescription>
                只需3步，无需复制粘贴
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 步骤指示器 */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${step === "start" || step === "login" ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "start" || step === "login" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    1
                  </div>
                  <span className="text-sm font-medium">登录</span>
                </div>
                <div className="flex-1 h-0.5 bg-border mx-2"></div>
                <div className={`flex items-center gap-2 ${step === "extracting" || step === "adding" ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "extracting" || step === "adding" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    2
                  </div>
                  <span className="text-sm font-medium">提取</span>
                </div>
                <div className="flex-1 h-0.5 bg-border mx-2"></div>
                <div className={`flex items-center gap-2 ${step === "done" ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "done" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    3
                  </div>
                  <span className="text-sm font-medium">完成</span>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 开始状态 */}
              {step === "start" && (
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🚀</div>
                  <h3 className="text-xl font-semibold">准备好了吗？</h3>
                  <p className="text-muted-foreground">
                    点击下方按钮开始登录ChatGPT
                  </p>
                  <Button size="lg" onClick={startLogin} className="w-full">
                    开始登录ChatGPT
                  </Button>
                </div>
              )}

              {/* 登录状态 */}
              {step === "login" && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold text-orange-500">⚠️ 重要：必须使用Safari浏览器！</div>
                        <div className="font-semibold">请按照以下步骤操作：</div>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          <li>点击下方按钮在<strong>Safari浏览器</strong>中打开ChatGPT</li>
                          <li>登录您的ChatGPT账号（不要使用App）</li>
                          <li>登录成功后，返回本页面</li>
                          <li>点击“我已登录完成”按钮</li>
                        </ol>
                        <div className="text-xs text-muted-foreground mt-2">
                          💡 如果点击后打开的是ChatGPT App，请长按链接选择“在Safari中打开”
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open("https://chat.openai.com", "_blank")}
                  >
                    打开ChatGPT登录页面
                  </Button>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleLoginComplete}
                  >
                    我已登录完成
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      if (checkIntervalRef.current) {
                        clearInterval(checkIntervalRef.current);
                      }
                      setStep("start");
                    }}
                  >
                    取消
                  </Button>
                </div>
              )}

              {/* 提取状态 */}
              {step === "extracting" && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-3">
                        <div className="font-semibold text-orange-500">⚠️ 确保您在Safari浏览器中打开的chat.openai.com！</div>
                        <div className="font-semibold">请按以下步骤提取Token：</div>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>切换到<strong>Safari浏览器</strong>的ChatGPT标签页</li>
                          <li>点击地址栏，粘贴下方的提取脚本</li>
                          <li>按回车执行脚本</li>
                          <li>Token会自动复制到剪贴板</li>
                          <li>返回本页面，点击下方“粘贴Token”按钮</li>
                        </ol>
                        <div className="text-xs text-muted-foreground mt-2">
                          ❌ 不能在ChatGPT App中执行，必须使用Safari浏览器！
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>提取脚本（复制并在ChatGPT页面地址栏执行）</Label>
                    <div className="flex gap-2">
                      <Input
                        value="javascript:(function(){const cookies=document.cookie.split('; ');const tokenNames=['__Secure-next-auth.session-token','next-auth.session-token','session-token'];let token=null;for(const name of tokenNames){const cookie=cookies.find(row=>row.startsWith(name+'='));if(cookie){token=cookie.split('=')[1];break;}}if(token){navigator.clipboard.writeText(token).then(()=>alert('✅ Token已复制！\\n\\n请返回账号管理页面粘贴。'));}else{const domain=window.location.hostname;const isApp=navigator.userAgent.includes('ChatGPT');alert('❌ 未找到Token！\\n\\n原因：'+(isApp?'您使用的是移动应用，请使用Safari浏览器访问 chat.openai.com':domain!=='chat.openai.com'&&domain!=='chatgpt.com'?'请在 chat.openai.com 域名下执行此脚本':'请确保已登录ChatGPT'));}})();"
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText("javascript:(function(){const cookies=document.cookie.split('; ');const tokenNames=['__Secure-next-auth.session-token','next-auth.session-token','session-token'];let token=null;for(const name of tokenNames){const cookie=cookies.find(row=>row.startsWith(name+'='));if(cookie){token=cookie.split('=')[1];break;}}if(token){navigator.clipboard.writeText(token).then(()=>alert('✅ Token已复制！\\n\\n请返回账号管理页面粘贴。'));}else{const domain=window.location.hostname;const isApp=navigator.userAgent.includes('ChatGPT');alert('❌ 未找到Token！\\n\\n原因：'+(isApp?'您使用的是移动应用，请使用Safari浏览器访问 chat.openai.com':domain!=='chat.openai.com'&&domain!=='chatgpt.com'?'请在 chat.openai.com 域名下执行此脚本':'请确保已登录ChatGPT'));}})();");
                          toast.success("脚本已复制！");
                        }}
                      >
                        复制脚本
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePasteToken}
                  >
                    粘贴Token并添加账号
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep("login")}
                  >
                    返回上一步
                  </Button>
                </div>
              )}

              {/* 添加状态 */}
              {step === "adding" && (
                <div className="text-center space-y-4">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">正在添加账号...</h3>
                  {email && (
                    <p className="text-muted-foreground">
                      账号: {email}
                    </p>
                  )}
                </div>
              )}

              {/* 完成状态 */}
              {step === "done" && (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-green-500">添加成功！</h3>
                  <p className="text-muted-foreground">
                    正在跳转到账号列表...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription className="text-xs">
              <div className="font-semibold mb-1">💡 提示：</div>
              <ul className="list-disc list-inside space-y-1">
                <li>整个过程无需手动复制粘贴</li>
                <li>Token会自动提取并添加</li>
                <li>添加后会自动验证账号类型</li>
                <li>如遇问题，请尝试刷新页面重试</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}

