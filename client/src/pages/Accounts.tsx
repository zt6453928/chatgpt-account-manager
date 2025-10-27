import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Edit, Eye, EyeOff, RefreshCw, CheckCircle2, Key, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import ChatGPTLogin from "./ChatGPTLogin";

export default function Accounts() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});

  // 表单状态
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    accountType: "free" as "free" | "plus" | "pro",
    status: "inactive" as "active" | "inactive" | "expired" | "banned",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.chatgpt.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.chatgpt.create.useMutation({
    onSuccess: () => {
      toast.success("账号添加成功");
      setIsAddDialogOpen(false);
      setFormData({
        email: "",
        password: "",
        accountType: "free",
        status: "inactive",
        notes: "",
      });
      utils.chatgpt.list.invalidate();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.chatgpt.update.useMutation({
    onSuccess: () => {
      toast.success("账号更新成功");
      setIsEditDialogOpen(false);
      setEditingAccount(null);
      utils.chatgpt.list.invalidate();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.chatgpt.delete.useMutation({
    onSuccess: () => {
      toast.success("账号删除成功");
      utils.chatgpt.list.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const verifyMutation = trpc.chatgpt.verify.useMutation({
    onSuccess: (result) => {
      if (result.isValid) {
        toast.success(`验证成功! 账号类型: ${result.accountType?.toUpperCase()}`);
      } else {
        toast.error(`验证失败: ${result.error || "账号不可用"}`);
      }
      utils.chatgpt.list.invalidate();
    },
    onError: (error) => {
      toast.error(`验证失败: ${error.message}`);
    },
  });

  const verifyAllMutation = trpc.chatgpt.verifyAll.useMutation({
    onSuccess: (results) => {
      const successCount = results.filter((r: any) => r.success).length;
      toast.success(`批量验证完成: ${successCount}/${results.length} 个账号验证成功`);
      utils.chatgpt.list.invalidate();
    },
    onError: (error) => {
      toast.error(`批量验证失败: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    updateMutation.mutate({
      id: editingAccount.id,
      email: editingAccount.email,
      password: editingAccount.password,
      accountType: editingAccount.accountType,
      status: editingAccount.status,
      notes: editingAccount.notes,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个账号吗?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleVerify = (id: number) => {
    verifyMutation.mutate({ id });
  };

  const handleVerifyAll = () => {
    if (confirm("确定要验证所有账号吗?（这可能需要一些时间）")) {
      verifyAllMutation.mutate();
    }
  };

  const handleLoginSuccess = async (sessionToken: string, email: string) => {
    // 使用session token作为密码添加账号
    try {
      const account = await createMutation.mutateAsync({
        email,
        password: sessionToken,
        accountType: "free", // 默认为free，验证时会自动更新
        status: "inactive", // 默认为inactive，验证时会自动更新
        notes: "通过Session Token添加",
      });
      
      // 添加成功后立即验证账号
      if (account && account.id) {
        toast.info("正在验证账号...");
        setTimeout(() => {
          verifyMutation.mutate({ id: account.id });
        }, 500);
      }
      
      setIsLoginDialogOpen(false);
    } catch (error) {
      console.error("添加账号失败:", error);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "可用" },
      inactive: { variant: "secondary", label: "不可用" },
      expired: { variant: "destructive", label: "已过期" },
      banned: { variant: "destructive", label: "被封禁" },
    };
    const config = variants[status] || variants.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      free: { variant: "outline", label: "Free" },
      plus: { variant: "default", label: "Plus" },
      pro: { variant: "default", label: "Pro" },
    };
    const config = variants[type] || variants.free;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
            <CardDescription>请先登录以管理您的ChatGPT账号</CardDescription>
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
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                {APP_TITLE}
              </a>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ChatGPT账号管理</h1>
            <p className="text-muted-foreground mt-1">
              管理您的所有ChatGPT账号，查看状态和类型
            </p>
          </div>
          <div className="flex gap-2">
            {accounts && accounts.length > 0 && (
              <Button
                variant="outline"
                onClick={handleVerifyAll}
                disabled={verifyAllMutation.isPending}
              >
                {verifyAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                批量验证
              </Button>
            )}
            <Button onClick={() => setIsLoginDialogOpen(true)}>
              <Key className="h-4 w-4 mr-2" />
              登录添加
            </Button>
            <Button variant="outline" asChild>
              <Link href="/quick-add">
                <a className="flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  移动端
                </a>
              </Link>
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  手动添加
                </Button>
              </DialogTrigger>
              <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>添加新账号</DialogTitle>
                  <DialogDescription>
                    添加一个新的ChatGPT账号到您的列表
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">密码</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="accountType">账号类型</Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, accountType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="plus">Plus</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">状态</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">可用</SelectItem>
                        <SelectItem value="inactive">不可用</SelectItem>
                        <SelectItem value="expired">已过期</SelectItem>
                        <SelectItem value="banned">被封禁</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">备注</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="可选的备注信息"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    添加
                  </Button>
                </DialogFooter>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{account.email}</CardTitle>
                      <CardDescription className="mt-1 flex gap-2">
                        {getTypeBadge(account.accountType)}
                        {getStatusBadge(account.status)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground w-20">
                        密码:
                      </Label>
                      <div className="flex-1 flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                          {showPassword[account.id]
                            ? account.password
                            : "••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(account.id)}
                        >
                          {showPassword[account.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {account.notes && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          备注:
                        </Label>
                        <p className="text-sm mt-1">{account.notes}</p>
                      </div>
                    )}
                    {account.lastVerified && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          最后验证:
                        </Label>
                        <p className="text-sm mt-1">
                          {new Date(account.lastVerified).toLocaleString(
                            "zh-CN"
                          )}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(account.id)}
                        disabled={verifyMutation.isPending}
                        className="flex-1"
                      >
                        {verifyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        验证
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                还没有添加任何账号，点击上方"添加账号"按钮开始
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>编辑账号</DialogTitle>
              <DialogDescription>修改账号信息</DialogDescription>
            </DialogHeader>
            {editingAccount && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">邮箱</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingAccount.email}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-password">密码</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editingAccount.password}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-accountType">账号类型</Label>
                  <Select
                    value={editingAccount.accountType}
                    onValueChange={(value: any) =>
                      setEditingAccount({
                        ...editingAccount,
                        accountType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="plus">Plus</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">状态</Label>
                  <Select
                    value={editingAccount.status}
                    onValueChange={(value: any) =>
                      setEditingAccount({ ...editingAccount, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">可用</SelectItem>
                      <SelectItem value="inactive">不可用</SelectItem>
                      <SelectItem value="expired">已过期</SelectItem>
                      <SelectItem value="banned">被封禁</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">备注</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingAccount.notes || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        notes: e.target.value,
                      })
                    }
                    placeholder="可选的备注信息"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ChatGPT登录对话框 */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>通过ChatGPT登录添加账号</DialogTitle>
            <DialogDescription>
              登录后系统将自动获取账号信息并验证账号类型
            </DialogDescription>
          </DialogHeader>
          <ChatGPTLogin
            onSuccess={handleLoginSuccess}
            onCancel={() => setIsLoginDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

