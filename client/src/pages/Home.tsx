import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, Zap, Lock } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user?.name || user?.email}
                </span>
                <Button asChild>
                  <Link href="/accounts">
                    <a>管理账号</a>
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => logout()}>
                  退出登录
                </Button>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>登录</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              ChatGPT账号管理平台
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              安全、高效地管理您的所有ChatGPT账号。实时查看账号状态、类型和过期信息，让账号管理变得简单。
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {isAuthenticated ? (
                <>
                  <Button size="lg" asChild>
                    <Link href="/accounts">
                      <a>进入控制台</a>
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/quick-add">
                      <a>📱 移动端快速添加</a>
                    </Link>
                  </Button>
                </>
              ) : (
                <Button size="lg" asChild>
                  <a href={getLoginUrl()}>立即开始</a>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              核心功能
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-card">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>账号状态监控</CardTitle>
                  <CardDescription>
                    实时查看每个账号的状态，包括可用、不可用、已过期和被封禁等状态，一目了然。
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>账号类型管理</CardTitle>
                  <CardDescription>
                    支持Free、Plus、Pro等不同类型的账号管理，清晰标识每个账号的订阅等级。
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>安全加密存储</CardTitle>
                  <CardDescription>
                    账号密码采用加密存储，确保您的账号信息安全。支持密码隐藏和显示切换。
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              准备好开始了吗?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              立即登录，开始管理您的ChatGPT账号
            </p>
            {!isAuthenticated && (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>免费开始</a>
              </Button>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
