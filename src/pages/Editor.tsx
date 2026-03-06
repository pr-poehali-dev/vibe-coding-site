import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sitesApi, type Site } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";

export default function Editor() {
  const { siteId } = useParams<{ siteId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Settings form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  // HTML editor
  const [html, setHtml] = useState("");
  const [savingHtml, setSavingHtml] = useState(false);
  const [htmlMessage, setHtmlMessage] = useState("");

  // Regenerate
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenMessage, setRegenMessage] = useState("");

  // Iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  // Fetch site data
  useEffect(() => {
    if (!siteId || !user) return;
    setLoading(true);
    sitesApi
      .get(siteId)
      .then((data) => {
        setSite(data);
        setTitle(data.title || "");
        setSlug(data.slug || "");
        setMetaTitle(data.meta_title || "");
        setMetaDesc(data.meta_description || "");
        setHtml(data.html || "");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Ошибка загрузки сайта");
      })
      .finally(() => setLoading(false));
  }, [siteId, user]);

  // Update iframe preview
  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  const handleSaveSettings = async () => {
    if (!siteId) return;
    setSavingSettings(true);
    setSettingsMessage("");
    try {
      await sitesApi.update({
        site_id: siteId,
        title,
        slug,
        meta_title: metaTitle,
        meta_description: metaDesc,
      });
      setSettingsMessage("Настройки сохранены");
      setTimeout(() => setSettingsMessage(""), 3000);
    } catch (err: unknown) {
      setSettingsMessage(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveHtml = async () => {
    if (!siteId) return;
    setSavingHtml(true);
    setHtmlMessage("");
    try {
      await sitesApi.update({
        site_id: siteId,
        html,
      });
      setHtmlMessage("HTML сохранен");
      setTimeout(() => setHtmlMessage(""), 3000);
    } catch (err: unknown) {
      setHtmlMessage(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSavingHtml(false);
    }
  };

  const handleRegenerate = async () => {
    if (!siteId || !regenPrompt.trim()) return;
    setRegenerating(true);
    setRegenMessage("");
    try {
      const res = await sitesApi.regenerate({
        site_id: siteId,
        prompt: regenPrompt.trim(),
      });
      if (res.html) {
        setHtml(res.html);
      }
      setRegenMessage("Сайт перегенерирован");
      setRegenPrompt("");
      setTimeout(() => setRegenMessage(""), 3000);
    } catch (err: unknown) {
      setRegenMessage(err instanceof Error ? err.message : "Ошибка регенерации");
    } finally {
      setRegenerating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
          <p className="text-muted-foreground mb-4">{error || "Сайт не найден"}</p>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад к дашборду
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass shrink-0">
        <div className="max-w-full mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <Icon name="ArrowLeft" size={16} className="mr-1.5" />
              Назад
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <span className="font-semibold text-sm truncate max-w-[200px]">
              {site.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {site.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(site.url, "_blank")}
              >
                <Icon name="ExternalLink" size={14} className="mr-1.5" />
                Открыть
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel - Settings */}
        <div className="w-full lg:w-[380px] shrink-0 border-r border-white/10 overflow-y-auto">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="w-full rounded-none border-b border-white/10 bg-transparent h-11">
              <TabsTrigger value="settings" className="flex-1 rounded-none data-[state=active]:bg-white/5">
                <Icon name="Settings" size={14} className="mr-1.5" />
                Настройки
              </TabsTrigger>
              <TabsTrigger value="code" className="flex-1 rounded-none data-[state=active]:bg-white/5">
                <Icon name="Code" size={14} className="mr-1.5" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 rounded-none data-[state=active]:bg-white/5">
                <Icon name="Sparkles" size={14} className="mr-1.5" />
                AI
              </TabsTrigger>
            </TabsList>

            {/* Settings tab */}
            <TabsContent value="settings" className="p-4 space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="ed-title">Название</Label>
                <Input
                  id="ed-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ed-slug">Slug</Label>
                <Input
                  id="ed-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="ed-meta-title">Meta Title</Label>
                <Input
                  id="ed-meta-title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO заголовок"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ed-meta-desc">Meta Description</Label>
                <Textarea
                  id="ed-meta-desc"
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  placeholder="SEO описание"
                  rows={3}
                  className="bg-white/5 border-white/10 resize-none"
                />
              </div>

              {settingsMessage && (
                <p className="text-sm text-primary">{settingsMessage}</p>
              )}

              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full bg-gradient-primary text-background font-semibold hover:opacity-90 transition-opacity"
              >
                {savingSettings ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Сохраняю...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить настройки
                  </>
                )}
              </Button>
            </TabsContent>

            {/* HTML code tab */}
            <TabsContent value="code" className="p-4 space-y-4 mt-0">
              <div className="space-y-2">
                <Label>HTML-код сайта</Label>
                <Textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={20}
                  className="bg-white/5 border-white/10 font-mono text-xs resize-none"
                  placeholder="<!DOCTYPE html>..."
                />
              </div>

              {htmlMessage && (
                <p className="text-sm text-primary">{htmlMessage}</p>
              )}

              <Button
                onClick={handleSaveHtml}
                disabled={savingHtml}
                className="w-full bg-gradient-primary text-background font-semibold hover:opacity-90 transition-opacity"
              >
                {savingHtml ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Сохраняю...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить HTML
                  </>
                )}
              </Button>
            </TabsContent>

            {/* AI regenerate tab */}
            <TabsContent value="ai" className="p-4 space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="regen-prompt">Промпт для перегенерации</Label>
                <Textarea
                  id="regen-prompt"
                  value={regenPrompt}
                  onChange={(e) => setRegenPrompt(e.target.value)}
                  placeholder="Измени цветовую схему на синюю, добавь секцию с отзывами..."
                  rows={6}
                  className="bg-white/5 border-white/10 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Опишите, что нужно изменить, и AI перегенерирует сайт.
                </p>
              </div>

              {regenMessage && (
                <p className="text-sm text-primary">{regenMessage}</p>
              )}

              <Button
                onClick={handleRegenerate}
                disabled={regenerating || !regenPrompt.trim()}
                className="w-full bg-gradient-primary text-background font-semibold hover:opacity-90 transition-opacity"
              >
                {regenerating ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Перегенерирую...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    Перегенерировать
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel - Preview */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0">
            <div className="flex items-center gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white/5 rounded-md px-4 py-1 text-xs text-muted-foreground max-w-md truncate">
                {site.url || `kodi.site/${site.slug || siteId}`}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white relative">
            <iframe
              ref={iframeRef}
              title="Site Preview"
              className="absolute inset-0 w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}