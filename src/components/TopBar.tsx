import { useEffect, useState } from "react";
import type { FieldSettings } from "../db/types";
import { fill, t } from "../i18n";
import { subscribeSync } from "../sync/sync";
import { formatTimestamp } from "../domain/dates";
import { Icon, paths } from "./Icons";

export function TopBar({
  settings,
  online,
  pending,
  syncError,
  onTogglePause,
  onToggleLang,
  onSync,
  onOpenSettings,
  onOpenBorrowers,
}: {
  settings: FieldSettings;
  online: boolean;
  pending: number;
  syncError: string | null;
  onTogglePause: () => void;
  onToggleLang: () => void;
  onSync: () => void;
  onOpenSettings: () => void;
  onOpenBorrowers: () => void;
}) {
  const lang = settings.lang;
  const [syncing, setSyncing] = useState(false);
  useEffect(() => subscribeSync(setSyncing), []);
  const paused = settings.pauseSync || !online;
  let pill = t(lang, "synced");
  let tone = "ok";
  if (!online) {
    pill = t(lang, "noNetwork");
    tone = "offline";
  } else if (settings.pauseSync) {
    pill = t(lang, "paused");
    tone = "offline";
  } else if (syncing) {
    pill = t(lang, "syncing");
    tone = "syncing";
  } else if (pending > 0) {
    pill = fill(t(lang, "waiting"), { count: pending });
    tone = "pending";
  } else if (settings.lastSyncAt) {
    pill = `${t(lang, "synced")} · ${formatTimestamp(settings.lastSyncAt, lang)}`;
  }

  const officer = lang === "km" ? settings.officerNameKm : settings.officerNameEn;

  return (
    <header className="topbar">
      <div className="brand">
        <button type="button" className="nav-borrowers" onClick={onOpenBorrowers} aria-label={t(lang, "borrowers")}>
          <Icon d={paths.user} />
        </button>
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <rect x="5" y="4" width="22" height="24" rx="3" />
            <path d="M9 11h14M9 16h14M9 21h9" />
          </svg>
        </span>
        <div>
          <strong>{t(lang, "appTitle")}</strong>
          <span>{t(lang, "appSubtitle")}</span>
        </div>
      </div>
      <div className="top-actions">
        <button
          type="button"
          className={`pill ${tone}`}
          data-testid="sync-status"
          title={syncError ?? t(lang, "savedLocal")}
          onClick={onSync}
          disabled={paused}
        >
          <span className="dot" />
          {pill}
        </button>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.pauseSync}
            onChange={onTogglePause}
            data-testid="offline-toggle"
          />
          <span>{t(lang, "pauseSync")}</span>
        </label>
        <button type="button" className="ghost lang-btn" onClick={onToggleLang}>
          {t(lang, "language")}
        </button>
        <button type="button" className="officer-btn" onClick={onOpenSettings}>
          <Icon d={paths.user} />
          <span>
            <strong>{officer || t(lang, "officer")}</strong>
            <small>{settings.branch}</small>
          </span>
        </button>
      </div>
    </header>
  );
}
