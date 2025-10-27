import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ChatGPTLoginProps {
  onSuccess: (sessionToken: string, email: string) => void;
  onCancel: () => void;
}

export default function ChatGPTLogin({ onSuccess, onCancel }: ChatGPTLoginProps) {
  const [sessionToken, setSessionToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleVerify = async () => {
    if (!sessionToken.trim()) {
      toast.error("请输入Session Token");
      return;
    }

    setIsVerifying(true);
    try {
      // 验证session token
      const response = await fetch("https://chat.openai.com/api/auth/session", {
        headers: {
          Cookie: `__Secure-next-auth.session-token=${sessionToken}`,
        },
      });

      if (!response.ok) {
        toast.error("Session Token无效或已过期");
        setIsVerifying(false);
        return;
      }

      const data = await response.json();
      if (data.user && data.user.email) {
        toast.success("验证成功!");
        onSuccess(sessionToken, data.user.email);
      } else {
        toast.error("无法获取账号信息");
      }
    } catch (error) {
      toast.error("验证失败，请检查Token是否正确");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyInstruction = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>获取ChatGPT Session Token</CardTitle>
          <CardDescription>
            请按照以下步骤获取您的Session Token以验证账号
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showInstructions && (
            <Alert>
              <AlertDescription className="space-y-3">
                <div className="font-semibold">操作步骤：</div>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    在新标签页中打开{" "}
                    <a
                      href="https://chat.openai.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      ChatGPT官网
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>登录您的ChatGPT账号</li>
                  <li>按 F12 打开浏览器开发者工具</li>
                  <li>切换到 "Application" 或 "应用" 标签</li>
                  <li>
                    在左侧找到 "Cookies" → "https://chat.openai.com"
                  </li>
                  <li>
                    找到名为{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      __Secure-next-auth.session-token
                    </code>{" "}
                    的Cookie
                  </li>
                  <li>复制它的值并粘贴到下方输入框</li>
                </ol>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(false)}
                  className="mt-2"
                >
                  我知道了
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!showInstructions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(true)}
            >
              显示操作步骤
            </Button>
          )}

          <div className="space-y-2">
            <Label htmlFor="sessionToken">Session Token</Label>
            <div className="flex gap-2">
              <Input
                id="sessionToken"
                type="password"
                placeholder="粘贴您的Session Token"
                value={sessionToken}
                onChange={(e) => setSessionToken(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Session Token通常很长（约200-300个字符），请确保完整复制
            </p>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              <div className="font-semibold mb-1">⚠️ 安全提示：</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Session Token具有完整的账号访问权限</li>
                <li>请勿与他人分享您的Token</li>
                <li>Token会被加密存储在数据库中</li>
                <li>建议定期更换Token以确保安全</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={handleVerify} disabled={isVerifying || !sessionToken}>
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  验证并保存
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

