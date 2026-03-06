import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sitesApi, type Submission } from "@/lib/api";
import { Button } from "@/components/ui/button";
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

export default function Submissions() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await sitesApi.submissions(undefined, p);
      setSubmissions(res.submissions || []);
      setTotal(res.total || 0);
      setPage(p);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleDelete = async (id: number) => {
    try {
      await sitesApi.deleteSubmission(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setTotal((prev) => prev - 1);
      setSelectedSub(null);
    } catch {
      // silently fail
    }
  };

  const totalPages = Math.ceil(total / 50);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Icon name="Terminal" size={18} className="text-background" />
            </div>
            <span className="text-lg font-bold tracking-tight">Коди</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Кабинет
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Заявки с сайтов</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} {declension(total, ["заявка", "заявки", "заявок"])} всего
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={32} className="animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Icon name="Inbox" size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Пока нет заявок</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Когда посетители заполнят формы на ваших сайтах, заявки появятся здесь
            </p>
            <Link to="/dashboard">
              <Button className="bg-gradient-primary text-background font-semibold hover:opacity-90">
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                К сайтам
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 animate-fade-in">
              {submissions.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  onClick={() => setSelectedSub(sub)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchData(page - 1)}
                >
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchData(page + 1)}
                >
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="FileText" size={18} />
              Заявка #{selectedSub?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedSub?.site_title} &middot; {selectedSub?.form_name} &middot;{" "}
              {selectedSub?.created_at ? formatDate(selectedSub.created_at) : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedSub && (
            <div className="space-y-4">
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-3">
                {Object.entries(selectedSub.data).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {key}
                    </span>
                    <p className="text-sm mt-0.5 break-words">{String(value)}</p>
                  </div>
                ))}
              </div>

              {selectedSub.sender_ip && (
                <p className="text-xs text-muted-foreground">
                  IP: {selectedSub.sender_ip}
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedSub.id)}
                >
                  <Icon name="Trash2" size={14} className="mr-1.5" />
                  Удалить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionCard({
  submission,
  onClick,
}: {
  submission: Submission;
  onClick: () => void;
}) {
  const preview = Object.entries(submission.data).slice(0, 3);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {submission.site_title}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {submission.form_name}
            </Badge>
          </div>
          <div className="space-y-1">
            {preview.map(([key, value]) => (
              <p key={key} className="text-sm truncate">
                <span className="text-muted-foreground">{key}:</span>{" "}
                {String(value)}
              </p>
            ))}
            {Object.keys(submission.data).length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{Object.keys(submission.data).length - 3} поля
              </p>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
          {formatDate(submission.created_at)}
        </span>
      </div>
    </button>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function declension(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}
