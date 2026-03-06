import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatWidget from "@/components/ChatWidget";

const NAV_LINKS = [
  { label: "Возможности", href: "#features" },
  { label: "Примеры", href: "#projects" },
  { label: "Документация", href: "#docs" },
  { label: "Подписка", href: "#pricing" },
];

const FEATURES = [
  {
    icon: "Wand2",
    title: "AI-генерация",
    desc: "Опишите сайт словами — Коди соберёт его за минуту. Никакого кода, только ваши идеи.",
    gradient: "from-emerald-500/20 to-cyan-500/20",
  },
  {
    icon: "LayoutGrid",
    title: "Библиотека компонентов",
    desc: "Сотни готовых блоков: герои, формы, каталоги, галереи. Перетаскивайте и комбинируйте.",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
  },
  {
    icon: "Palette",
    title: "Шаблоны на старте",
    desc: "Начните с профессионального шаблона и адаптируйте под себя — цвета, шрифты, контент.",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    icon: "Rocket",
    title: "Мгновенная публикация",
    desc: "Один клик — и ваш сайт в интернете. Домен, хостинг и SSL уже настроены.",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
];

const PROJECTS = [
  {
    img: "https://cdn.poehali.dev/projects/9025ff69-0865-4c0e-8e78-dabadc9f3d57/files/a9ee61bb-b917-427c-aac6-af359378da74.jpg",
    title: "Дашборд SaaS-сервиса",
    tag: "Веб-приложение",
  },
  {
    img: "https://cdn.poehali.dev/projects/9025ff69-0865-4c0e-8e78-dabadc9f3d57/files/82addd13-b262-41c4-949f-52fbc4224d21.jpg",
    title: "Интернет-магазин",
    tag: "E-commerce",
  },
  {
    img: "https://cdn.poehali.dev/projects/9025ff69-0865-4c0e-8e78-dabadc9f3d57/files/ec4e8bfd-7338-4018-85f4-9d94d9a779fc.jpg",
    title: "Портфолио агентства",
    tag: "Лендинг",
  },
];

const DOCS = [
  { icon: "BookOpen", title: "Быстрый старт", desc: "Создайте первый сайт за 5 минут" },
  { icon: "Code2", title: "API-справочник", desc: "Интеграция с внешними сервисами" },
  { icon: "Blocks", title: "Компоненты", desc: "Каталог всех доступных блоков" },
  { icon: "Paintbrush", title: "Кастомизация", desc: "Темы, цвета и типографика" },
];

const PLANS = [
  {
    name: "Старт",
    price: "0",
    energy: "50 энергии / мес",
    features: ["3 проекта", "Базовые шаблоны", "Публикация на поддомене", "Поддержка сообщества"],
    popular: false,
  },
  {
    name: "Про",
    price: "990",
    energy: "500 энергии / мес",
    features: ["Безлимит проектов", "Все шаблоны и компоненты", "Свой домен + SSL", "Приоритетная поддержка", "AI-генерация без ограничений"],
    popular: true,
  },
  {
    name: "Бизнес",
    price: "2 990",
    energy: "∞ энергии",
    features: ["Всё из Про", "Командная работа", "Белая метка", "Персональный менеджер", "SLA 99.9%"],
    popular: false,
  },
];

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Icon name="Terminal" size={18} className="text-background" />
          </div>
          <span className="text-lg font-bold tracking-tight">Коди</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Войти
          </Button>
          <Button size="sm" className="bg-gradient-primary text-background font-semibold hover:opacity-90 transition-opacity">
            Начать бесплатно
          </Button>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "X" : "Menu"} size={24} />
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-white/10 px-6 py-4 space-y-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Button className="w-full bg-gradient-primary text-background font-semibold mt-2">
            Начать бесплатно
          </Button>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 opacity-0 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">AI-ассистент нового поколения</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          Создавай сайты{" "}
          <span className="text-gradient">голосом разума</span>
          <span className="font-handwritten text-primary text-4xl sm:text-5xl lg:text-6xl ml-2 inline-block animate-float">✦</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          Коди — ваш AI-ассистент, который превращает идеи в готовые сайты.
          Просто опишите, что хотите — и получите результат за считанные минуты.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <div className="relative w-full sm:w-auto">
            <Input
              placeholder="Опишите ваш сайт..."
              className="w-full sm:w-[400px] h-12 pl-12 pr-4 bg-white/5 border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-primary/50"
            />
            <Icon name="Sparkles" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
          </div>
          <Button size="lg" className="bg-gradient-primary text-background font-bold px-8 h-12 rounded-xl hover:opacity-90 transition-opacity glow-primary">
            Создать сайт
            <Icon name="ArrowRight" size={18} className="ml-2" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <span className="flex items-center gap-1.5">
            <Icon name="Check" size={14} className="text-primary" /> Бесплатный старт
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="Check" size={14} className="text-primary" /> Без кода
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="Check" size={14} className="text-primary" /> Публикация в 1 клик
          </span>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">О Коди</span>
            <h2 className="text-4xl font-bold mt-3 mb-6">
              Ваш личный{" "}
              <span className="text-gradient">AI-разработчик</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Коди — это не просто конструктор сайтов. Это интеллектуальный ассистент,
              который понимает ваш замысел и воплощает его в профессиональный веб-продукт.
            </p>
            <div className="space-y-4">
              {[
                "Понимает описание на русском языке",
                "Генерирует адаптивный дизайн под любое устройство",
                "Подключает базы данных и API автоматически",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="Check" size={14} className="text-primary" />
                  </div>
                  <span className="text-foreground/80">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-xs text-muted-foreground ml-2">Коди — чат</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-primary/20 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm">Сделай лендинг для кофейни с онлайн-заказом ☕</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-muted-foreground">
                      Отличная идея! Создаю лендинг с hero-секцией, меню напитков,
                      формой онлайн-заказа и контактами. Подключаю тёмную тему с
                      тёплыми акцентами...
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/20 rounded-full blur-[60px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Возможности</span>
          <h2 className="text-4xl font-bold mt-3">
            Всё для создания <span className="text-gradient">идеального сайта</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group glass rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5`}>
                <Icon name={f.icon} size={22} className="text-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Projects() {
  return (
    <section id="projects" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Примеры</span>
          <h2 className="text-4xl font-bold mt-3">
            Сделано с <span className="text-gradient">Коди</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PROJECTS.map((p, i) => (
            <div
              key={i}
              className="group glass rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {p.tag}
                </span>
                <h3 className="text-lg font-semibold mt-3">{p.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Docs() {
  return (
    <section id="docs" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Документация</span>
          <h2 className="text-4xl font-bold mt-3">
            Разберётесь за <span className="text-gradient">5 минут</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DOCS.map((d, i) => (
            <a
              key={i}
              href="#"
              className="group glass rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon name={d.icon} size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{d.title}</h3>
              <p className="text-sm text-muted-foreground">{d.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Читать <Icon name="ArrowRight" size={14} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Подписка</span>
          <h2 className="text-4xl font-bold mt-3">
            Энергия для ваших <span className="text-gradient">проектов</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Каждое действие Коди расходует энергию. Выберите план, который подходит под ваши задачи.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`relative glass rounded-2xl p-8 flex flex-col ${
                plan.popular
                  ? "border-primary/40 glow-primary scale-[1.02]"
                  : "hover:border-white/20"
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-background text-xs font-bold px-4 py-1 rounded-full">
                  Популярный
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.energy}</p>
              </div>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-muted-foreground">₽/мес</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm">
                    <Icon name="Check" size={16} className="text-primary flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full h-11 rounded-xl font-semibold ${
                  plan.popular
                    ? "bg-gradient-primary text-background hover:opacity-90"
                    : "bg-white/5 hover:bg-white/10 text-foreground"
                } transition-all`}
              >
                {plan.price === "0" ? "Начать бесплатно" : "Подключить"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Icon name="Terminal" size={15} className="text-background" />
            </div>
            <span className="font-bold">Коди</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Возможности</a>
            <a href="#projects" className="hover:text-foreground transition-colors">Примеры</a>
            <a href="#docs" className="hover:text-foreground transition-colors">Документация</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Подписка</a>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Коди. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground noise">
      <Header />
      <Hero />
      <About />
      <Features />
      <Projects />
      <Docs />
      <Pricing />
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Index;