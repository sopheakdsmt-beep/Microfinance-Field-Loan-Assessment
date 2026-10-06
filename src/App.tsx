import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState } from "react";
import { BorrowerDialog } from "./components/BorrowerDialog";
import { BorrowerRail } from "./components/BorrowerRail";
import { SettingsDialog } from "./components/SettingsDialog";
import { TopBar } from "./components/TopBar";
import { Workspace } from "./components/Workspace";
import { db } from "./db/db";
import { blankBorrower, blankLoan, deleteBorrower, deletePhoto, addPhoto, saveBorrower, saveLoan, saveSettings } from "./db/repository";
import type { Borrower, FieldSettings, PhotoRecord } from "./db/types";
import { useOnline } from "./hooks/useOnline";
import { t } from "./i18n";
import { flushSync, requestSync } from "./sync/sync";

export function App() {
  const settings = useLiveQuery(() => db.settings.get("profile"));
  const borrowers = useLiveQuery(() => db.borrowers.orderBy("updatedAt").reverse().toArray(), []);
  const loans = useLiveQuery(() => db.loans.toArray(), []);
  const pending = useLiveQuery(() => db.queue.where("status").anyOf(["queued", "error"]).count(), []) ?? 0;
  const syncError = useLiveQuery(async () => {
    const failed = await db.queue.where("status").equals("error").first();
    return failed?.error ?? null;
  }, []);
  const online = useOnline();
  const [selectedId, setSelectedId] = useState<string | null>(() => localStorage.getItem("field-selected"));
  const [railOpen, setRailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creating, setCreating] = useState<Borrower | null>(null);

  const borrower = useLiveQuery(() => (selectedId ? db.borrowers.get(selectedId) : undefined), [selectedId]);
  const loan = useLiveQuery(async () => {
    if (!selectedId) return null;
    return (await db.loans.where("borrowerId").equals(selectedId).first()) ?? null;
  }, [selectedId]);
  const photos = useLiveQuery(async () => {
    if (!selectedId) return [];
    const rows = await db.photos.where("borrowerId").equals(selectedId).toArray();
    return rows.sort((a, b) => b.capturedAt - a.capturedAt);
  }, [selectedId]);

  useEffect(() => {
    if (!borrowers) return;
    if (selectedId && borrowers.some((item) => item.id === selectedId)) return;
    setSelectedId(borrowers[0]?.id ?? null);
  }, [borrowers, selectedId]);

  useEffect(() => {
    if (selectedId) localStorage.setItem("field-selected", selectedId);
  }, [selectedId]);

  useEffect(() => {
    document.documentElement.lang = settings?.lang === "en" ? "en" : "km";
  }, [settings?.lang]);

  const pause = settings?.pauseSync ?? false;
  useEffect(() => {
    const tick = () => void flushSync(navigator.onLine && !pause);
    tick();
    const id = window.setInterval(tick, 8000);
    window.addEventListener("online", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", tick);
    };
  }, [pause]);

  const persistBorrower = useCallback((value: Borrower) => {
    void saveBorrower(value).then(() => requestSync());
  }, []);
  const persistLoan = useCallback((value: NonNullable<typeof loan>) => {
    void saveLoan(value).then(() => requestSync());
  }, []);
  const persistPhoto = useCallback((value: PhotoRecord) => {
    void addPhoto(value).then(() => requestSync());
  }, []);

  if (!settings || !borrowers || !loans) {
    return <div className="loading">{t("km", "loading")}</div>;
  }

  const lang = settings.lang;
  const officer = lang === "km" ? settings.officerNameKm : settings.officerNameEn;

  return (
    <div className="app">
      <TopBar
        settings={settings}
        online={online}
        pending={pending}
        syncError={syncError ?? null}
        onTogglePause={() => {
          void saveSettings({ ...settings, pauseSync: !settings.pauseSync }).then(() => requestSync());
        }}
        onToggleLang={() => {
          void saveSettings({ ...settings, lang: lang === "km" ? "en" : "km" });
        }}
        onSync={() => void requestSync()}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenBorrowers={() => setRailOpen(true)}
      />
      <p className="phone-hint">{t(lang, "tabletHint")}</p>
      <div className="app-body">
        <BorrowerRail
          lang={lang}
          borrowers={borrowers}
          loans={loans}
          selectedId={selectedId}
          open={railOpen}
          onSelect={(id) => {
            setSelectedId(id);
            setRailOpen(false);
          }}
          onCreate={() => setCreating(blankBorrower())}
        />
        {borrower && loan ? (
          <Workspace
            key={borrower.id}
            lang={lang}
            borrower={borrower}
            loan={loan}
            photos={photos ?? []}
            officer={officer || t(lang, "officer")}
            onSaveBorrower={persistBorrower}
            onSaveLoan={persistLoan}
            onAddPhoto={persistPhoto}
            onDeletePhoto={(id) => void deletePhoto(id).then(() => requestSync())}
            onDeleteBorrower={(id) => {
              void deleteBorrower(id).then(() => requestSync());
              setSelectedId(null);
            }}
          />
        ) : (
          <section className="empty-sheet">
            <h2>{t(lang, "emptyTitle")}</h2>
            <p>{t(lang, "emptyBody")}</p>
            <button type="button" className="primary" onClick={() => setCreating(blankBorrower())}>
              {t(lang, "newBorrower")}
            </button>
          </section>
        )}
      </div>
      {railOpen && <button type="button" className="scrim" aria-label={t(lang, "close")} onClick={() => setRailOpen(false)} />}
      {creating && (
        <BorrowerDialog
          open
          title={t(lang, "newBorrower")}
          initial={creating}
          lang={lang}
          onClose={() => setCreating(null)}
          onSubmit={(draft) => {
            const application = blankLoan(draft.id, settings);
            void saveBorrower(draft)
              .then(() => saveLoan(application))
              .then(() => requestSync());
            setSelectedId(draft.id);
            setCreating(null);
          }}
        />
      )}
      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(next: FieldSettings) => {
          void saveSettings(next);
          setSettingsOpen(false);
        }}
      />
    </div>
  );
}
