import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface SitePreviewProps {
  html: string;
  url: string;
  prompt: string;
  onClose: () => void;
}

export default function SitePreview({ html, url, prompt, onClose }: SitePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  const widths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md animate-fade-in">
      <div className="flex items-center justify-between px-6 h-16 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <p className="text-sm font-semibold">Ваш сайт готов!</p>
            <p className="text-xs text-muted-foreground truncate max-w-[300px]">«{prompt}»</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 glass rounded-lg p-1">
          {([
            { mode: "desktop" as const, icon: "Monitor" },
            { mode: "tablet" as const, icon: "Tablet" },
            { mode: "mobile" as const, icon: "Smartphone" },
          ]).map((v) => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              className={`p-2 rounded-md transition-colors ${
                viewMode === v.mode ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={v.icon} size={16} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {url && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyLink}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name={copied ? "Check" : "Copy"} size={16} className="mr-1.5" />
                {copied ? "Скопировано" : "Копировать ссылку"}
              </Button>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-gradient-primary text-background font-semibold hover:opacity-90">
                  <Icon name="ExternalLink" size={16} className="mr-1.5" />
                  Открыть сайт
                </Button>
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 overflow-auto">
        <div
          className="glass rounded-xl overflow-hidden transition-all duration-300 h-full"
          style={{ width: widths[viewMode], maxWidth: "100%" }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 mx-3">
              <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-muted-foreground truncate">
                {url || "Предпросмотр"}
              </div>
            </div>
          </div>
          <iframe
            srcDoc={html}
            title="Предпросмотр сайта"
            className="w-full bg-white"
            style={{ height: "calc(100vh - 160px)" }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}