import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sitesApi, type Site, type SiteStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";

export default function Dashboard() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrompt, setCreatePrompt] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const fetchData = useCallback(async () => {
    try {
      const [sitesRes, statsRes] = await Promise.all([
        sitesApi.list(),
        sitesApi.stats(),
      ]);
      setSites(sitesRes.sites || []);
      setStats(statsRes);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPrompt.trim() || !createTitle.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const payload: { prompt: string; title: string; slug?: string } = {
        prompt: createPrompt.trim(),
        title: createTitle.trim(),
      };
      if (createSlug.trim()) {
        payload.slug = createSlug.trim();
      }
      const newSite = await sitesApi.create(payload);
      setSites((prev) => [newSite, ...prev]);
      setCreateOpen(false);
      setCreatePrompt("");
      setCreateTitle("");
      setCreateSlug("");
      // Refresh stats
      sitesApi.stats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Ошибка создания сайта");
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Icon name="Terminal" size={18} className="text-background" />
            </div>
            <span className="text-lg font-bold tracking-tight">Коди</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in">
          <StatsCard
            icon="Globe"
            label="Всего сайтов"
            value={stats?.total_sites ?? 0}
            gradient="from-emerald-500/20 to-cyan-500/20"
          />
          <StatsCard
            icon="Eye"
            label="Всего просмотров"
            value={stats?.total_views ?? 0}
            gradient="from-violet-500/20 to-fuchsia-500/20"
          />
          <StatsCard
            icon="Send"
            label="Всего заявок"
            value={stats?.total_submissions ?? 0}
            gradient="from-amber-500/20 to-orange-500/20"
          />
        </div>

        <Separator className="mb-8" />

        {/* Header row */}
        <div className="flex items-center justify-between mb-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <h2 className="text-2xl font-bold">Мои сайты</h2>
          <div className="flex items-center gap-3">
            <Link to="/submissions">
              <Button variant="outline" size="sm">
                <Icon name="Inbox" size={16} className="mr-2" />
                Заявки
                {(stats?.total_submissions ?? 0) > 0 && (
                  <Badge className="ml-2 bg-gradient-primary text-background text-xs">
                    {stats.total_submissions}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-primary text-background font-semibold hover:opacity-90 transition-opacity"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Создать сайт
            </Button>
          </div>
        </div>

        {/* Sites grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={32} className="animate-spin text-primary" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Icon name="Globe" size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Пока нет сайтов</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Создайте свой первый сайт с помощью AI
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-primary text-background font-semibold hover:opacity-90"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Создать сайт
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {sites.map((site) => (
              <SiteCard key={site.id || site.site_id} site={site} />
            ))}
          </div>
        )}
      </main>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Создать новый сайт</DialogTitle>
            <DialogDescription>
              Опишите, какой сайт вы хотите создать, и AI сгенерирует его за вас.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={16} />
              {createError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Название сайта *</Label>
              <Input
                id="create-title"
                placeholder="Мой крутой сайт"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                required
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-prompt">Описание для AI *</Label>
              <Textarea
                id="create-prompt"
                placeholder="Создай лендинг для фитнес-студии с блоками: герой, преимущества, расписание, отзывы, контакты..."
                value={createPrompt}
                onChange={(e) => setCreatePrompt(e.target.value)}
                required
                rows={4}
                className="bg-white/5 border-white/10 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-slug">
                Slug (необязательно)
              </Label>
              <Input
                id="create-slug"
                placeholder="my-site"
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-muted-foreground">
                URL-адрес сайта. Если не указать, будет сгенерирован автоматически.
              </p>
            </div>

            <Button
              type="submit"
              disabled={creating || !createPrompt.trim() || !createTitle.trim()}
              className="w-full bg-gradient-primary text-background font-semibold hover:opacity-90 transition-opacity h-11"
            >
              {creating ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Создаю сайт...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={18} className="mr-2" />
                  Создать
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: string;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div className="glass rounded-xl p-5 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Icon name={icon} size={20} className="text-foreground" />
          </div>
        </div>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function SiteCard({ site }: { site: Site }) {
  const navigate = useNavigate();
  const siteId = site.site_id || site.id;
  const dateStr = site.created_at
    ? new Date(site.created_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base truncate">{site.title}</h3>
          {site.slug && (
            <p className="text-sm text-primary truncate mt-0.5">/{site.slug}</p>
          )}
        </div>
        {site.status && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            {site.status}
          </Badge>
        )}
      </div>

      {site.prompt && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {site.prompt}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
        {site.views !== undefined && (
          <span className="flex items-center gap-1">
            <Icon name="Eye" size={14} />
            {site.views}
          </span>
        )}
        {dateStr && (
          <span className="flex items-center gap-1">
            <Icon name="Calendar" size={14} />
            {dateStr}
          </span>
        )}
      </div>

      <Separator />

      <div className="flex items-center gap-2">
        {site.url && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => window.open(site.url, "_blank")}
          >
            <Icon name="ExternalLink" size={14} className="mr-1.5" />
            Открыть
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/editor/${siteId}`)}
        >
          <Icon name="Pencil" size={14} className="mr-1.5" />
          Редактировать
        </Button>
      </div>
    </div>
  );
}