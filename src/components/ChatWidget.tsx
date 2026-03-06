import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/0a9e4563-f0b8-4ecb-abe2-6b9786683463";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Сделай лендинг для кофейни",
  "Какие шаблоны есть?",
  "Как подключить домен?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Привет! Я Коди — AI-ассистент для создания сайтов. Опишите, какой сайт хотите, и я помогу его создать!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Извините, произошла ошибка. Попробуйте ещё раз." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Не удалось подключиться. Проверьте интернет и попробуйте снова." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg glow-primary hover:scale-105 transition-transform"
      >
        <Icon name={open ? "X" : "MessageCircle"} size={24} className="text-background" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] glass rounded-2xl overflow-hidden flex flex-col animate-fade-in" style={{ height: "500px" }}>
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Icon name="Terminal" size={18} className="text-background" />
            </div>
            <div>
              <p className="font-semibold text-sm">Коди</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Онлайн
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary/20 rounded-2xl rounded-br-md"
                      : "bg-white/5 rounded-2xl rounded-bl-md text-muted-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="space-y-2 mt-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="block w-full text-left text-sm px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-primary text-background hover:opacity-90 disabled:opacity-40"
              >
                <Icon name="Send" size={16} />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
