"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, EyeOff, Key, RotateCcw, Save, Upload } from "lucide-react";

import { admin, setAuthToken, BACKEND_URL } from "@/lib/api";
import { optimizeImage, getCompressionRatio } from "@/lib/imageOptimizer";

function resolveMediaUrls(value) {
  if (typeof value === "string") {
    return value.startsWith("/api/media/") ? `${BACKEND_URL}${value}` : value;
  }
  if (Array.isArray(value)) return value.map(resolveMediaUrls);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = resolveMediaUrls(value[k]);
    return out;
  }
  return value;
}
import {
  brand,
  dummyImages,
  hero,
  nav,
  portfolio,
  processSteps,
  seo,
  servicesSection,
} from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

const TOKEN_KEY = "fursova_admin_token";

// Save button with visual feedback
function SaveButton({ onClick, label = "Сохранить", testId }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleClick = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onClick();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      className={`min-w-[140px] transition-all ${saved ? "bg-green-600 hover:bg-green-600" : "m3-btn-primary"}`}
      onClick={handleClick}
      disabled={saving}
      data-testid={testId}
    >
      {saving ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Сохранение...
        </>
      ) : saved ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Сохранено!
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}

function getInitialContent() {
  return {
    brand,
    nav,
    hero,
    servicesSection: {
      ...servicesSection,
      // defaults for pricing options
      priceOptions: [
        { key: "studio", label: "Студия" },
        { key: "1k", label: "1-комнатная" },
        { key: "2k", label: "2-комнатная" },
        { key: "3k", label: "3-комнатная" },
      ],
      prices: servicesSection.prices || {
        new: { studio: "", "1k": "", "2k": "", "3k": "" },
        old: { studio: "", "1k": "", "2k": "", "3k": "" },
        online: { studio: "", "1k": "", "2k": "", "3k": "" },
      },
    },
    portfolio,
    processSteps,
    dummyImages,
    seo,
  };
}

export default function AdminV2() {
  const [status, setStatus] = useState({ loading: true, password_set: false });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  });

  const [authed, setAuthed] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [content, setContent] = useState(null);
  const [jsonDraft, setJsonDraft] = useState("");

  const [activeServiceKey, setActiveServiceKey] = useState("new");

  // Change password modal state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const priceOptions = useMemo(() => {
    return (
      content?.servicesSection?.priceOptions || [
        { key: "studio", label: "Студия" },
        { key: "1k", label: "1-комнатная" },
        { key: "2k", label: "2-комнатная" },
        { key: "3k", label: "3-комнатная" },
      ]
    );
  }, [content?.servicesSection?.priceOptions]);

  const refreshStatus = async () => {
    setStatus((s) => ({ ...s, loading: true }));
    try {
      const res = await admin.status();
      setStatus({ loading: false, password_set: Boolean(res.data?.password_set) });
    } catch {
      setStatus({ loading: false, password_set: false });
      toast.error("Не удалось получить статус админки");
    }
  };

  const loadContent = async () => {
    try {
      const res = await admin.getContent();
      const rawContent = res.data?.content || {};
      setContent(resolveMediaUrls(rawContent));
      setJsonDraft(JSON.stringify(rawContent, null, 2));
    } catch (err) {
      // If unauthorized, clear token and show login
      if (err.response?.status === 401) {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
        setToken("");
        setAuthed(false);
        toast.error("Сессия истекла. Войдите снова.");
      } else {
        toast.error("Не удалось загрузить контент");
      }
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (!token) {
      setAuthed(false);
      setAuthToken(null);
      return;
    }
    setAuthToken(token);
    setAuthed(true);
    loadContent();
  }, [token]);

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken("");
    setAuthed(false);
    setContent(null);
    toast.success("Вы вышли");
  };

  const doChangePassword = async () => {
    if (newPassword.length < 4) {
      toast.error("Новый пароль должен быть минимум 4 символа");
      return;
    }
    if (newPassword !== newPassword2) {
      toast.error("Новые пароли не совпадают");
      return;
    }

    setChangingPassword(true);
    try {
      await admin.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Пароль успешно изменён");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e) {
      if (e.response?.status === 401) {
        toast.error("Неверный текущий пароль");
      } else {
        toast.error("Не удалось изменить пароль");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const doBootstrap = async () => {
    if (!email.trim()) {
      toast.error("Введите email");
      return;
    }
    if (password.length < 4) {
      toast.error("Пароль должен быть минимум 4 символа");
      return;
    }
    if (password !== password2) {
      toast.error("Пароли не совпадают");
      return;
    }

    try {
      await admin.bootstrap({ email: email.trim(), password, initial_content: getInitialContent() });
      toast.success("Админка инициализирована");
      await refreshStatus();
      // auto login
      const res = await admin.login({ email: email.trim(), password });
      const t = res.data?.access_token;
      if (t) {
        localStorage.setItem(TOKEN_KEY, t);
        setToken(t);
      }
    } catch (e) {
      toast.error("Не удалось инициализировать админку");
    }
  };

  const doLogin = async () => {
    try {
      const res = await admin.login({ email: email.trim(), password });
      const t = res.data?.access_token;
      if (!t) throw new Error("no token");
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setEmail("");
      setPassword("");
      toast.success("Вход выполнен");
    } catch {
      toast.error("Неверный email или пароль");
    }
  };

  const patch = async (patchObj) => {
    try {
      await admin.patchContent({ patch: patchObj });
      await loadContent();
      toast.success("Сохранено");
    } catch {
      toast.error("Не удалось сохранить");
    }
  };

  const uploadHero = async (file) => {
    if (!file) return;
    try {
      await admin.uploadHero(file);
      await loadContent();
      toast.success("Фото обновлено");
    } catch {
      toast.error("Не удалось загрузить фото");
    }
  };

  const uploadPortfolio = async (idx, which, file) => {
    if (!file) return;
    try {
      if (which === "before") await admin.uploadPortfolioBefore(idx, file);
      else await admin.uploadPortfolioAfter(idx, file);
      await loadContent();
      toast.success("Фото портфолио обновлено");
    } catch {
      toast.error("Не удалось загрузить фото");
    }
  };

  const applyJson = async () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      await admin.putContent({ content: parsed });
      await loadContent();
      toast.success("JSON применён");
    } catch {
      toast.error("Ошибка JSON или сохранения");
    }
  };

  // ---- UI ----
  if (status.loading) {
    return (
      <div className="min-h-screen m3-page">
        <div className="mx-auto max-w-xl px-5 py-10 text-white/80">Загрузка…</div>
      </div>
    );
  }

  if (!authed) {
    const isBootstrap = !status.password_set;

    return (
      <div className="min-h-screen m3-page">
        <div className="mx-auto max-w-xl px-5 py-10">
          <Card className="m3-card p-6">
            <div className="m3-title-large text-[rgb(var(--ink-strong))]">
              Админ‑панель
            </div>
            <div className="mt-2 m3-body-small text-[rgb(var(--ink-muted))]">
              {isBootstrap
                ? "Первый вход: задайте email и пароль администратора."
                : "Введите email и пароль для входа."}
            </div>

            <div className="mt-6 space-y-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="m3-field"
                data-testid="admin-email"
              />

              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isBootstrap ? "Придумайте пароль" : "Пароль"}
                  className="m3-field"
                  data-testid="admin-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--ink-muted))]"
                  onClick={() => setShowPass((v) => !v)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {isBootstrap ? (
                <Input
                  type={showPass ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Повторите пароль"
                  className="m3-field"
                />
              ) : null}

              <Button 
                className="w-full m3-btn-primary" 
                onClick={isBootstrap ? doBootstrap : doLogin}
                data-testid="admin-submit"
              >
                {isBootstrap ? "Сохранить" : "Войти"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen m3-page">
        <div className="mx-auto max-w-xl px-5 py-10 text-white/80">Загрузка контента…</div>
      </div>
    );
  }

  const servicesCards = content.servicesSection?.cards || [];
  const portfolioCards = (content.portfolio?.cards || []).slice(0, 4);

  return (
    <div className="min-h-screen m3-page">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="m3-headline-small text-[rgb(var(--ink-strong))]">Админ‑панель</div>
            <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
              Контент • Медиа • Цены • SEO
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
              <DialogTrigger asChild>
                <Button className="m3-btn-dark" data-testid="change-password-btn">
                  <Key className="mr-2 h-4 w-4" />
                  Сменить пароль
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#222222] text-white">
                <DialogHeader>
                  <DialogTitle>Смена пароля</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Введите текущий пароль и новый пароль
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="m3-label-medium text-white/70">Текущий пароль</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1 m3-field"
                      data-testid="current-password-input"
                    />
                  </div>
                  <div>
                    <label className="m3-label-medium text-white/70">Новый пароль</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 m3-field"
                      data-testid="new-password-input"
                    />
                  </div>
                  <div>
                    <label className="m3-label-medium text-white/70">Повторите новый пароль</label>
                    <Input
                      type="password"
                      value={newPassword2}
                      onChange={(e) => setNewPassword2(e.target.value)}
                      className="mt-1 m3-field"
                      data-testid="new-password-confirm-input"
                    />
                  </div>
                  <Button
                    className="w-full m3-btn-primary"
                    onClick={doChangePassword}
                    disabled={changingPassword}
                    data-testid="change-password-submit"
                  >
                    {changingPassword ? "Сохранение..." : "Сохранить новый пароль"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              className="m3-btn-dark"
              onClick={async () => {
                try {
                  const res = await api.post("/admin/migrate-media-urls");
                  const d = res.data;
                  if (d.changes?.length > 0) {
                    toast.success(`Исправлено ${d.changes.length} URL. Перезагружаю страницу...`);
                    setTimeout(() => window.location.reload(), 1500);
                  } else {
                    toast.info("Railway URL не найдены — всё уже в порядке");
                  }
                } catch {
                  toast.error("Ошибка миграции");
                }
              }}
            >
              Восстановить фото
            </Button>
            <Button className="m3-btn-dark" onClick={logout}>
              Выйти
            </Button>
            <Button
              className="m3-btn-dark"
              onClick={async () => {
                await patch(getInitialContent());
                toast.success("Сброшено к значениям по умолчанию");
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Сброс
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="texts">
            <TabsList className="bg-[#E6E1D7] text-[#333333] flex-wrap">
              <TabsTrigger value="texts">Тексты</TabsTrigger>
              <TabsTrigger value="services">Услуги</TabsTrigger>
              <TabsTrigger value="contacts">Контакты</TabsTrigger>
              <TabsTrigger value="portfolio">Портфолио</TabsTrigger>
              <TabsTrigger value="process">Процесс</TabsTrigger>
              <TabsTrigger value="media">Медиа</TabsTrigger>
              <TabsTrigger value="pricing">Цены</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
              <TabsTrigger value="blog">Блог</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="texts" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="m3-title-large text-[rgb(var(--ink-strong))]">Главный экран</div>
                  <SaveButton
                    onClick={async () => {
                      await patch({ hero: content.hero });
                      toast.success("Тексты сохранены");
                    }}
                    testId="save-texts-btn"
                  />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">H1 (главный заголовок)</div>
                    <Textarea
                      className="mt-2 m3-field min-h-[140px]"
                      value={content.hero?.h1 || ""}
                      onChange={(e) => setContent((c) => ({ ...c, hero: { ...(c.hero || {}), h1: e.target.value } }))}
                    />
                    <div className="mt-3 m3-label-medium text-[rgb(var(--ink-muted))]">Размер H1</div>
                    <Select
                      value={content.hero?.h1Size || "default"}
                      onValueChange={(val) => setContent((c) => ({ ...c, hero: { ...(c.hero || {}), h1Size: val } }))}
                    >
                      <SelectTrigger className="mt-2 m3-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#333333] text-white">
                        <SelectItem value="small">Маленький (text-3xl)</SelectItem>
                        <SelectItem value="default">Стандартный (text-4xl)</SelectItem>
                        <SelectItem value="large">Большой (text-5xl)</SelectItem>
                        <SelectItem value="xlarge">Очень большой (text-6xl)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Подстрока</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.hero?.subline || ""}
                      onChange={(e) => setContent((c) => ({ ...c, hero: { ...(c.hero || {}), subline: e.target.value } }))}
                    />
                    <div className="mt-3 m3-label-medium text-[rgb(var(--ink-muted))]">Размер подстроки</div>
                    <Select
                      value={content.hero?.sublineSize || "default"}
                      onValueChange={(val) => setContent((c) => ({ ...c, hero: { ...(c.hero || {}), sublineSize: val } }))}
                    >
                      <SelectTrigger className="mt-2 m3-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#333333] text-white">
                        <SelectItem value="small">Маленький (text-base)</SelectItem>
                        <SelectItem value="default">Стандартный (text-lg)</SelectItem>
                        <SelectItem value="large">Большой (text-xl)</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="mt-4 m3-label-medium text-[rgb(var(--ink-muted))]">Абзацы «Обо мне»</div>
                    {(content.hero?.about || []).slice(0, 2).map((val, idx) => (
                      <Textarea
                        key={idx}
                        className="mt-2 m3-field min-h-[92px]"
                        value={val}
                        onChange={(e) => {
                          const next = [...(content.hero?.about || [])];
                          next[idx] = e.target.value;
                          setContent((c) => ({ ...c, hero: { ...(c.hero || {}), about: next } }));
                        }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="m3-title-large text-[rgb(var(--ink-strong))]">Контакты</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      Телефон, мессенджеры и социальные сети.
                    </div>
                  </div>
                  <SaveButton
                    onClick={async () => {
                      await patch({ brand: content.brand });
                      toast.success("Контакты сохранены");
                    }}
                    testId="save-contacts-btn"
                  />
                </div>

                <div className="mt-5 space-y-6">
                  {/* Phone */}
                  <div className="rounded-lg border border-black/10 bg-white p-4">
                    <div className="m3-title-small text-[rgb(var(--ink-strong))]">Телефон</div>
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Номер в шапке (для звонков)</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="+7 (999) 123-45-67"
                          value={content.brand?.headerPhoneDisplay || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), headerPhoneDisplay: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Номер в шапке (raw)</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="+79991234567"
                          value={content.brand?.headerPhoneRaw || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), headerPhoneRaw: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Номер контактов (для "Давайте подготовим")</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="+7 (999) 123-45-67"
                          value={content.brand?.contactPhoneDisplay || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), contactPhoneDisplay: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Номер контактов (raw)</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="+79991234567"
                          value={content.brand?.contactPhoneRaw || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), contactPhoneRaw: e.target.value } }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Telegram */}
                  <div className="rounded-lg border border-black/10 bg-white p-4">
                    <div className="m3-title-small text-[rgb(var(--ink-strong))]">Telegram</div>
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Ссылка на личный Telegram</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="https://t.me/username"
                          value={content.brand?.telegramUrl || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), telegramUrl: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Handle канала (без @)</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="channel_name"
                          value={content.brand?.telegramHandle || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), telegramHandle: e.target.value } }))}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Ссылка на Telegram-канал</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="https://t.me/channel_name"
                          value={content.brand?.telegramChannelUrl || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), telegramChannelUrl: e.target.value } }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="rounded-lg border border-black/10 bg-white p-4">
                    <div className="m3-title-small text-[rgb(var(--ink-strong))]">WhatsApp</div>
                    <div className="mt-3">
                      <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Ссылка на WhatsApp</div>
                      <Input
                        className="mt-2 m3-field"
                        placeholder="https://wa.me/79991234567"
                        value={content.brand?.whatsappUrl || ""}
                        onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), whatsappUrl: e.target.value } }))}
                      />
                    </div>
                  </div>

                  {/* Other social */}
                  <div className="rounded-lg border border-black/10 bg-white p-4">
                    <div className="m3-title-small text-[rgb(var(--ink-strong))]">Другие соцсети</div>
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Instagram</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="https://instagram.com/..."
                          value={content.brand?.instagramUrl || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), instagramUrl: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">VK</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="https://vk.com/..."
                          value={content.brand?.vkUrl || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), vkUrl: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">YouTube</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="https://youtube.com/..."
                          value={content.brand?.youtubeUrl || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), youtubeUrl: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Дзен</div>
                        <Input
                          className="mt-2 m3-field"
                          placeholder="https://dzen.ru/..."
                          value={content.brand?.dzenUrl || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), dzenUrl: e.target.value } }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brand info */}
                  <div className="rounded-lg border border-black/10 bg-white p-4">
                    <div className="m3-title-small text-[rgb(var(--ink-strong))]">Бренд</div>
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Название компании</div>
                        <Input
                          className="mt-2 m3-field"
                          value={content.brand?.name || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), name: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Имя специалиста</div>
                        <Input
                          className="mt-2 m3-field"
                          value={content.brand?.person || ""}
                          onChange={(e) => setContent((c) => ({ ...c, brand: { ...(c.brand || {}), person: e.target.value } }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Services Tab - редактирование карточек услуг */}
            <TabsContent value="services" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="m3-title-large text-[rgb(var(--ink-strong))]">Карточки услуг</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      Редактирование названий, описаний и буллет-поинтов для каждой услуги
                    </div>
                  </div>
                  <SaveButton
                    onClick={async () => {
                      await patch({ servicesSection: content.servicesSection });
                      toast.success("Услуги сохранены");
                    }}
                    testId="save-services-btn"
                  />
                </div>

                <div className="mt-6 space-y-6">
                  {(content.servicesSection?.cards || []).map((card, idx) => (
                    <div key={idx} className="rounded-md border border-black/10 bg-white p-5">
                      <div className="m3-title-small text-[rgb(var(--ink-strong))]">Услуга {idx + 1}</div>
                      
                      <div className="mt-4 grid gap-4">
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Название услуги</div>
                          <Input
                            className="mt-2 m3-field"
                            value={card.title || ""}
                            onChange={(e) => {
                              const cards = [...(content.servicesSection?.cards || [])];
                              cards[idx] = { ...cards[idx], title: e.target.value };
                              setContent((c) => ({ ...c, servicesSection: { ...(c.servicesSection || {}), cards } }));
                            }}
                          />
                        </div>
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Описание услуги</div>
                          <Textarea
                            className="mt-2 m3-field min-h-[100px]"
                            value={card.desc || ""}
                            onChange={(e) => {
                              const cards = [...(content.servicesSection?.cards || [])];
                              cards[idx] = { ...cards[idx], desc: e.target.value };
                              setContent((c) => ({ ...c, servicesSection: { ...(c.servicesSection || {}), cards } }));
                            }}
                          />
                        </div>
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">
                            Буллет-поинты (каждый пункт с новой строки)
                          </div>
                          <Textarea
                            className="mt-2 m3-field min-h-[120px]"
                            value={(card.bullets || []).join("\n")}
                            onChange={(e) => {
                              const cards = [...(content.servicesSection?.cards || [])];
                              cards[idx] = { ...cards[idx], bullets: e.target.value.split("\n") };
                              setContent((c) => ({ ...c, servicesSection: { ...(c.servicesSection || {}), cards } }));
                            }}
                            placeholder="Первый пункт&#10;Второй пункт&#10;Третий пункт"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="m3-title-large text-[rgb(var(--ink-strong))]">Портфолио</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      Редактирование текстов карточек портфолио. Фото загружаются во вкладке «Медиа».
                    </div>
                  </div>
                  <SaveButton
                    onClick={async () => {
                      await patch({ portfolio: content.portfolio });
                      toast.success("Портфолио сохранено");
                    }}
                    testId="save-portfolio-btn"
                  />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Заголовок секции</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.portfolio?.title || ""}
                      onChange={(e) => setContent((c) => ({ ...c, portfolio: { ...(c.portfolio || {}), title: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Текст призыва</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.portfolio?.ctaText || ""}
                      onChange={(e) => setContent((c) => ({ ...c, portfolio: { ...(c.portfolio || {}), ctaText: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {portfolioCards.map((card, idx) => (
                    <div key={card.id || idx} className="rounded-md border border-black/10 bg-white p-5">
                      <div className="m3-title-small text-[rgb(var(--ink-strong))]">Карточка {idx + 1}</div>
                      
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Заголовок</div>
                          <Input
                            className="mt-2 m3-field"
                            value={card.title || ""}
                            onChange={(e) => {
                              const cards = [...(content.portfolio?.cards || [])];
                              cards[idx] = { ...cards[idx], title: e.target.value };
                              setContent((c) => ({ ...c, portfolio: { ...(c.portfolio || {}), cards } }));
                            }}
                          />
                        </div>
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Описание</div>
                          <Input
                            className="mt-2 m3-field"
                            value={card.desc || ""}
                            onChange={(e) => {
                              const cards = [...(content.portfolio?.cards || [])];
                              cards[idx] = { ...cards[idx], desc: e.target.value };
                              setContent((c) => ({ ...c, portfolio: { ...(c.portfolio || {}), cards } }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-4 lg:grid-cols-4">
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Бейдж: Срок</div>
                          <Input
                            className="mt-2 m3-field"
                            placeholder="10 дней"
                            value={card.badgeTime || ""}
                            onChange={(e) => {
                              const cards = [...(content.portfolio?.cards || [])];
                              cards[idx] = { ...cards[idx], badgeTime: e.target.value };
                              setContent((c) => ({ ...c, portfolio: { ...(c.portfolio || {}), cards } }));
                            }}
                          />
                        </div>
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Бейдж: Стоимость</div>
                          <Input
                            className="mt-2 m3-field"
                            placeholder="~400 000 ₽"
                            value={card.badgeCost || ""}
                            onChange={(e) => {
                              const cards = [...(content.portfolio?.cards || [])];
                              cards[idx] = { ...cards[idx], badgeCost: e.target.value };
                              setContent((c) => ({ ...c, portfolio: { ...(c.portfolio || {}), cards } }));
                            }}
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Результат (итоговая строка)</div>
                          <Input
                            className="mt-2 m3-field"
                            value={card.payoffLine || ""}
                            onChange={(e) => {
                              const cards = [...(content.portfolio?.cards || [])];
                              cards[idx] = { ...cards[idx], payoffLine: e.target.value };
                              setContent((c) => ({ ...c, portfolio: { ...(c.portfolio || {}), cards } }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="process" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="m3-title-large text-[rgb(var(--ink-strong))]">Как это работает</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      Редактирование шагов процесса работы.
                    </div>
                  </div>
                  <SaveButton
                    onClick={async () => {
                      await patch({ processSteps: content.processSteps });
                      toast.success("Процесс сохранён");
                    }}
                    testId="save-process-btn"
                  />
                </div>

                <div className="mt-6 space-y-4">
                  {(content.processSteps || []).map((step, idx) => (
                    <div key={idx} className="rounded-md border border-black/10 bg-white p-5">
                      <div className="m3-title-small text-[rgb(var(--ink-strong))]">Шаг {idx + 1}</div>
                      
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Заголовок</div>
                          <Input
                            className="mt-2 m3-field"
                            value={step.title || ""}
                            onChange={(e) => {
                              const steps = [...(content.processSteps || [])];
                              steps[idx] = { ...steps[idx], title: e.target.value };
                              setContent((c) => ({ ...c, processSteps: steps }));
                            }}
                          />
                        </div>
                        <div>
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Результат шага</div>
                          <Input
                            className="mt-2 m3-field"
                            value={step.deliverable || ""}
                            onChange={(e) => {
                              const steps = [...(content.processSteps || [])];
                              steps[idx] = { ...steps[idx], deliverable: e.target.value };
                              setContent((c) => ({ ...c, processSteps: steps }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Описание</div>
                        <Textarea
                          className="mt-2 m3-field min-h-[80px]"
                          value={step.desc || ""}
                          onChange={(e) => {
                            const steps = [...(content.processSteps || [])];
                            steps[idx] = { ...steps[idx], desc: e.target.value };
                            setContent((c) => ({ ...c, processSteps: steps }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Logo upload */}
                <Card className="m3-card p-6">
                  <div className="m3-title-large text-[rgb(var(--ink-strong))]">Логотип сайта</div>
                  <div className="mt-3 flex items-center justify-center h-32 overflow-hidden rounded-md border border-black/10 bg-white p-4">
                    {content.brand?.logoUrl ? (
                      <img src={content.brand.logoUrl} alt="logo" className="max-h-full max-w-full object-contain" style={{ filter: "invert(1)" }} />
                    ) : (
                      <div className="text-[rgb(var(--ink-muted))]">Логотип не загружен</div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="m3-field" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          await api.post("/admin/upload/logo", formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                          });
                          toast.success("Логотип загружен");
                          refetch();
                        } catch (err) {
                          console.error("Upload error:", err);
                          toast.error("Не удалось загрузить логотип");
                        }
                      }} 
                    />
                    <div className="mt-2 m3-body-small text-[rgb(var(--ink-muted))]">PNG с прозрачным фоном, рекомендуемый размер 200x200px</div>
                  </div>
                </Card>

                {/* Hero photo */}
                <Card className="m3-card p-6">
                  <div className="m3-title-large text-[rgb(var(--ink-strong))]">Фото в шапке</div>
                  <div className="mt-3 overflow-hidden rounded-md border border-black/10 bg-white">
                    <img src={content.hero?.photoUrl} alt="hero" className="w-full object-contain" style={{ maxHeight: '300px' }} />
                  </div>
                  <div className="mt-4">
                    <Input type="file" accept="image/*" className="m3-field" onChange={(e) => uploadHero(e.target.files?.[0])} />
                    <div className="mt-2 m3-body-small text-[rgb(var(--ink-muted))]">Загрузка сохраняется в MongoDB (GridFS).</div>
                  </div>
                </Card>

                <Card className="m3-card p-6 lg:col-span-2">
                  <div className="m3-title-large text-[rgb(var(--ink-strong))]">Портфолио (4 карточки)</div>
                  <div className="mt-4 space-y-4">
                    {portfolioCards.map((c, idx) => (
                      <div key={c.id || idx} className="rounded-md border border-black/10 bg-white p-4">
                        <div className="m3-title-small text-[rgb(var(--ink-strong))]">Карточка {idx + 1}</div>

                        {/* Before / After — для главной страницы */}
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="m3-label-medium text-[rgb(var(--ink-muted))]">До (для главной)</div>
                            <div className="mt-2 h-24 overflow-hidden rounded-md border border-black/10 bg-white">
                              <img src={c.beforeUrl || dummyImages.beforeUrl} alt="before" className="h-full w-full object-cover" />
                            </div>
                            <Input type="file" accept="image/*" className="mt-2 m3-field" onChange={(e) => uploadPortfolio(idx, "before", e.target.files?.[0])} />
                          </div>
                          <div>
                            <div className="m3-label-medium text-[rgb(var(--ink-muted))]">После (для главной)</div>
                            <div className="mt-2 h-24 overflow-hidden rounded-md border border-black/10 bg-white">
                              <img src={c.afterUrl || dummyImages.afterUrl} alt="after" className="h-full w-full object-cover" />
                            </div>
                            <Input type="file" accept="image/*" className="mt-2 m3-field" onChange={(e) => uploadPortfolio(idx, "after", e.target.files?.[0])} />
                          </div>
                        </div>

                        {/* Галерея до 6 фото — для страницы портфолио */}
                        <div className="mt-4 rounded-lg border border-black/10 bg-black/2 p-3">
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Галерея страницы портфолио (до 6 фото)</div>
                          <div className="mt-2 grid gap-2 grid-cols-3 sm:grid-cols-6">
                            {(c.photos || []).map((photoUrl, photoIdx) => (
                              <div key={photoIdx} className="relative">
                                <div className="relative overflow-hidden rounded border border-black/10 bg-white" style={{ aspectRatio: '1' }}>
                                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute top-0.5 right-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white leading-none"
                                    onClick={async () => {
                                      const cards = [...(content.portfolio?.cards || [])];
                                      const updatedPhotos = [...(cards[idx].photos || [])];
                                      updatedPhotos.splice(photoIdx, 1);
                                      cards[idx] = { ...cards[idx], photos: updatedPhotos };
                                      setContent((ct) => ({ ...ct, portfolio: { ...(ct.portfolio || {}), cards } }));
                                      await patch({ portfolio: { ...(content.portfolio || {}), cards } });
                                      toast.success("Фото удалено");
                                    }}
                                  >✕</button>
                                </div>
                              </div>
                            ))}
                            {(c.photos || []).length < 6 && (
                              <label className="flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-black/20 text-[10px] text-[rgb(var(--ink-muted))] hover:border-black/40 transition-colors" style={{ aspectRatio: '1' }}>
                                <Upload className="h-3 w-3 mb-0.5" />
                                добавить
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const res = await admin.uploadMedia(file);
                                      const url = BACKEND_URL + res.data.url;
                                      const cards = [...(content.portfolio?.cards || [])];
                                      const updatedPhotos = [...(cards[idx].photos || []), url];
                                      cards[idx] = { ...cards[idx], photos: updatedPhotos };
                                      setContent((ct) => ({ ...ct, portfolio: { ...(ct.portfolio || {}), cards } }));
                                      await patch({ portfolio: { ...(content.portfolio || {}), cards } });
                                      toast.success("Фото загружено");
                                    } catch (err) {
                                      toast.error("Ошибка загрузки");
                                    }
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="m3-title-large text-[rgb(var(--ink-strong))]">Цены по услугам</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">Отдельные цены по каждому типу квартиры.</div>
                  </div>

                  <SaveButton
                    onClick={async () => {
                      await patch({ servicesSection: content.servicesSection });
                      toast.success("Цены сохранены");
                    }}
                    testId="save-pricing-btn"
                  />
                </div>

                <div className="mt-4 w-full sm:w-[360px]">
                  <Select value={activeServiceKey} onValueChange={setActiveServiceKey}>
                    <SelectTrigger className="m3-field">
                      <SelectValue placeholder="Выберите услугу" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#333333] text-white">
                      {servicesCards.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-5 overflow-hidden rounded-md border border-black/10 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тип</TableHead>
                        <TableHead>Цена</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceOptions.map((opt) => {
                        const prices = content.servicesSection?.prices || {};
                        const servicePrices = prices[activeServiceKey] || {};
                        const val = servicePrices[opt.key] || "";

                        return (
                          <TableRow key={opt.key}>
                            <TableCell className="font-medium">{opt.label}</TableCell>
                            <TableCell>
                              <Input
                                className="m3-field"
                                placeholder="например: 120 000 ₽"
                                value={val}
                                onChange={(e) => {
                                  const next = {
                                    ...(content.servicesSection?.prices || {}),
                                    [activeServiceKey]: {
                                      ...(servicePrices || {}),
                                      [opt.key]: e.target.value,
                                    },
                                  };
                                  setContent((c) => ({ ...c, servicesSection: { ...(c.servicesSection || {}), prices: next } }));
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="m3-title-large text-[rgb(var(--ink-strong))]">SEO</div>
                  <SaveButton
                    onClick={async () => {
                      await patch({ seo: content.seo });
                      toast.success("SEO сохранено");
                    }}
                    testId="save-seo-btn"
                  />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Title</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.seo?.title || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), title: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Canonical</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.seo?.canonical || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), canonical: e.target.value } }))}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Description</div>
                    <Textarea
                      className="mt-2 m3-field min-h-[110px]"
                      value={content.seo?.description || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), description: e.target.value } }))}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Keywords</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.seo?.keywords || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), keywords: e.target.value } }))}
                    />
                  </div>

                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">OG Title</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.seo?.ogTitle || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), ogTitle: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">OG Image URL</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.seo?.ogImage || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), ogImage: e.target.value } }))}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">OG Description</div>
                    <Textarea
                      className="mt-2 m3-field min-h-[110px]"
                      value={content.seo?.ogDescription || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), ogDescription: e.target.value } }))}
                    />
                  </div>

                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Yandex verification</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.seo?.yandexVerification || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), yandexVerification: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Google verification</div>
                    <Input
                      className="mt-2 m3-field"
                      value={content.seo?.googleVerification || ""}
                      onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), googleVerification: e.target.value } }))}
                    />
                  </div>

                  {/* Indexing Control */}
                  <div className="lg:col-span-2 mt-4 pt-4 border-t border-black/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="m3-label-medium text-[rgb(var(--ink-strong))]">Разрешить индексацию</div>
                        <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                          Разрешить индексацию сайта в Яндексе и Google
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContent((c) => ({ 
                          ...c, 
                          seo: { 
                            ...(c.seo || {}), 
                            indexingEnabled: !(c.seo?.indexingEnabled !== false)
                          } 
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          content.seo?.indexingEnabled !== false ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                        data-testid="indexing-toggle"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            content.seo?.indexingEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* SEO Text Block */}
                  <div className="lg:col-span-2 mt-4 pt-4 border-t border-black/10">
                    <div className="m3-label-medium text-[rgb(var(--ink-strong))]">SEO текстовый блок</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      Текст для SEO-блока на главной странице (например: «Хоум стейджинг в Москве — подготовка квартиры к продаже»)
                    </div>
                    <div className="mt-3">
                      <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Заголовок SEO блока</div>
                      <Input
                        className="mt-2 m3-field"
                        value={content.seo?.blockTitle || ""}
                        onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), blockTitle: e.target.value } }))}
                        placeholder="Хоум стейджинг в Москве — подготовка квартиры к продаже"
                      />
                    </div>
                    <div className="mt-3">
                      <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Текст SEO блока</div>
                      <Textarea
                        className="mt-2 m3-field min-h-[150px]"
                        value={content.seo?.blockContent || ""}
                        onChange={(e) => setContent((c) => ({ ...c, seo: { ...(c.seo || {}), blockContent: e.target.value } }))}
                        placeholder="Подготовка квартиры к продаже или аренде — это комплекс мероприятий..."
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="m3-title-large text-[rgb(var(--ink-strong))]">Настройки</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      Общие настройки сайта и уведомлений.
                    </div>
                  </div>
                  <SaveButton
                    onClick={async () => {
                      await patch({ settings: content.settings });
                      toast.success("Настройки сохранены");
                    }}
                    testId="save-settings-btn"
                  />
                </div>

                <div className="mt-6 space-y-6">
                  {/* Email notifications */}
                  <div className="rounded-lg border border-black/10 bg-white p-5">
                    <div className="m3-title-small text-[rgb(var(--ink-strong))]">Email-уведомления о заявках</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      На этот адрес будут приходить уведомления о новых заявках с сайта.
                    </div>
                    <Input
                      type="email"
                      className="mt-4 m3-field"
                      placeholder="example@email.com"
                      value={content.settings?.notifyEmail || ""}
                      onChange={(e) => setContent((c) => ({
                        ...c,
                        settings: { ...(c.settings || {}), notifyEmail: e.target.value }
                      }))}
                      data-testid="notify-email-input"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="blog" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="m3-title-large text-[rgb(var(--ink-strong))]">Блог</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      Управление страницей блога и статьями.
                    </div>
                  </div>
                  <SaveButton
                    onClick={async () => {
                      await patch({ blog: content.blog });
                      toast.success("Блог сохранён");
                    }}
                    testId="save-blog-btn"
                  />
                </div>

                {/* Blog visibility toggle */}
                <div className="mt-6 flex items-center gap-4 rounded-lg border border-black/10 bg-white p-4">
                  <div className="flex-1">
                    <div className="m3-title-small text-[rgb(var(--ink-strong))]">Показывать блог на сайте</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">
                      Когда включено, ссылка «Блог» появится в меню и страница станет доступна.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContent((c) => ({ ...c, blog: { ...(c.blog || {}), enabled: !(c.blog?.enabled) } }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${content.blog?.enabled ? "bg-[#D6AF6F]" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${content.blog?.enabled ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                {/* Blog posts */}
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="m3-title-small text-[rgb(var(--ink-strong))]">Статьи</div>
                    <Button
                      variant="outline"
                      className="m3-btn-outline"
                      onClick={() => {
                        const posts = content.blog?.posts || [];
                        const newPost = {
                          id: `post_${Date.now()}`,
                          title: "Новая статья",
                          slug: `novaya-statya-${posts.length + 1}`,
                          excerpt: "",
                          content: "",
                          publishedAt: new Date().toISOString().split("T")[0],
                          published: false,
                        };
                        setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts: [...posts, newPost] } }));
                      }}
                    >
                      + Добавить статью
                    </Button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {(content.blog?.posts || []).length === 0 && (
                      <div className="rounded-md border border-dashed border-black/20 bg-white/50 p-8 text-center">
                        <div className="m3-body-medium text-[rgb(var(--ink-muted))]">Статей пока нет</div>
                        <div className="mt-1 m3-body-small text-[rgb(var(--ink-soft))]/60">Нажмите «Добавить статью» чтобы создать первую</div>
                      </div>
                    )}

                    {(content.blog?.posts || []).map((post, idx) => (
                      <div key={post.id || idx} className="rounded-md border border-black/10 bg-white p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="m3-title-small text-[rgb(var(--ink-strong))]">Статья {idx + 1}</div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 m3-label-medium text-[rgb(var(--ink-muted))]">
                              <input
                                type="checkbox"
                                checked={post.published || false}
                                onChange={(e) => {
                                  const posts = [...(content.blog?.posts || [])];
                                  posts[idx] = { ...posts[idx], published: e.target.checked };
                                  setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              Опубликовано
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                const posts = (content.blog?.posts || []).filter((_, i) => i !== idx);
                                setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                              }}
                            >
                              Удалить
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div>
                            <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Заголовок</div>
                            <Input
                              className="mt-2 m3-field"
                              value={post.title || ""}
                              onChange={(e) => {
                                const posts = [...(content.blog?.posts || [])];
                                posts[idx] = { ...posts[idx], title: e.target.value };
                                setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                              }}
                            />
                          </div>
                          <div>
                            <div className="m3-label-medium text-[rgb(var(--ink-muted))]">URL (slug)</div>
                            <Input
                              className="mt-2 m3-field"
                              placeholder="moya-statya"
                              value={post.slug || ""}
                              onChange={(e) => {
                                const posts = [...(content.blog?.posts || [])];
                                posts[idx] = { ...posts[idx], slug: e.target.value };
                                setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 grid gap-4 lg:grid-cols-2">
                          <div>
                            <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Дата публикации</div>
                            <Input
                              type="date"
                              className="mt-2 m3-field"
                              value={post.publishedAt || ""}
                              onChange={(e) => {
                                const posts = [...(content.blog?.posts || [])];
                                posts[idx] = { ...posts[idx], publishedAt: e.target.value };
                                setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                              }}
                            />
                          </div>
                          <div>
                            <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Краткое описание</div>
                            <Input
                              className="mt-2 m3-field"
                              placeholder="Описание для превью"
                              value={post.excerpt || ""}
                              onChange={(e) => {
                                const posts = [...(content.blog?.posts || [])];
                                posts[idx] = { ...posts[idx], excerpt: e.target.value };
                                setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Содержимое статьи</div>
                          <Textarea
                            className="mt-2 m3-field min-h-[150px]"
                            placeholder="Текст статьи..."
                            value={post.content || ""}
                            onChange={(e) => {
                              const posts = [...(content.blog?.posts || [])];
                              posts[idx] = { ...posts[idx], content: e.target.value };
                              setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                            }}
                          />
                        </div>

                        {/* Photos section */}
                        <div className="mt-4 rounded-lg border border-black/10 bg-black/2 p-4">
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Фотографии статьи</div>
                          <div className="mt-2 grid gap-3 sm:grid-cols-3">
                            {(post.photos || []).map((photoUrl, photoIdx) => (
                              <div key={photoIdx} className="relative">
                                <div className="relative h-24 overflow-hidden rounded border border-black/10">
                                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                                    onClick={async () => {
                                      const posts = [...(content.blog?.posts || [])];
                                      const updatedPhotos = [...(posts[idx].photos || [])];
                                      updatedPhotos.splice(photoIdx, 1);
                                      posts[idx] = { ...posts[idx], photos: updatedPhotos };
                                      setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                                      await patch({ blog: { ...(content.blog || {}), posts } });
                                      toast.success("Фото удалено");
                                    }}
                                  >✕ удалить</button>
                                </div>
                              </div>
                            ))}
                            {/* Add photo button */}
                            <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-black/20 text-xs text-[rgb(var(--ink-muted))] hover:border-black/40 hover:bg-black/2 transition-colors">
                              <Upload className="mb-1 h-4 w-4" />
                              добавить фото
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await admin.uploadMedia(file);
                                    const url = BACKEND_URL + res.data.url;
                                    const posts = [...(content.blog?.posts || [])];
                                    const updatedPhotos = [...(posts[idx].photos || []), url];
                                    posts[idx] = { ...posts[idx], photos: updatedPhotos };
                                    setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                                    await patch({ blog: { ...(content.blog || {}), posts } });
                                    toast.success("Фото загружено");
                                  } catch (err) {
                                    toast.error("Ошибка загрузки: " + (err.message || err));
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Social links section */}
                        <div className="mt-3 rounded-lg border border-black/10 bg-black/2 p-4">
                          <div className="m3-label-medium text-[rgb(var(--ink-muted))]">Ссылки на соцсети</div>
                          <div className="mt-2 grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="m3-label-small text-[rgb(var(--ink-soft))]/60">Telegram</label>
                              <Input
                                className="mt-1 m3-field"
                                placeholder="https://t.me/..."
                                value={post.socialLinks?.telegram || ""}
                                onChange={(e) => {
                                  const posts = [...(content.blog?.posts || [])];
                                  posts[idx] = { ...posts[idx], socialLinks: { ...(posts[idx].socialLinks || {}), telegram: e.target.value } };
                                  setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="m3-label-small text-[rgb(var(--ink-soft))]/60">WhatsApp</label>
                              <Input
                                className="mt-1 m3-field"
                                placeholder="https://wa.me/..."
                                value={post.socialLinks?.whatsapp || ""}
                                onChange={(e) => {
                                  const posts = [...(content.blog?.posts || [])];
                                  posts[idx] = { ...posts[idx], socialLinks: { ...(posts[idx].socialLinks || {}), whatsapp: e.target.value } };
                                  setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="m3-label-small text-[rgb(var(--ink-soft))]/60">Instagram</label>
                              <Input
                                className="mt-1 m3-field"
                                placeholder="https://instagram.com/..."
                                value={post.socialLinks?.instagram || ""}
                                onChange={(e) => {
                                  const posts = [...(content.blog?.posts || [])];
                                  posts[idx] = { ...posts[idx], socialLinks: { ...(posts[idx].socialLinks || {}), instagram: e.target.value } };
                                  setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="m3-label-small text-[rgb(var(--ink-soft))]/60">VK</label>
                              <Input
                                className="mt-1 m3-field"
                                placeholder="https://vk.com/..."
                                value={post.socialLinks?.vk || ""}
                                onChange={(e) => {
                                  const posts = [...(content.blog?.posts || [])];
                                  posts[idx] = { ...posts[idx], socialLinks: { ...(posts[idx].socialLinks || {}), vk: e.target.value } };
                                  setContent((c) => ({ ...c, blog: { ...(c.blog || {}), posts } }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <Card className="m3-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="m3-title-large text-[rgb(var(--ink-strong))]">JSON</div>
                    <div className="mt-1 m3-body-small text-[rgb(var(--ink-muted))]">Полная замена контента.</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="m3-btn-outline" onClick={() => setJsonDraft(JSON.stringify(content, null, 2))}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Сбросить
                    </Button>
                    <Button className="m3-btn-primary" onClick={applyJson}>
                      <Save className="mr-2 h-4 w-4" />
                      Применить
                    </Button>
                  </div>
                </div>

                <Textarea
                  className="mt-4 m3-field min-h-[420px] font-mono text-xs"
                  value={jsonDraft}
                  onChange={(e) => setJsonDraft(e.target.value)}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
