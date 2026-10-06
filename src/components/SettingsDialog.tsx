import { useEffect, useRef, useState } from "react";
import type { FieldSettings } from "../db/types";
import { t } from "../i18n";
import { NumericField } from "./NumericField";

export function SettingsDialog({
  open,
  settings,
  onClose,
  onSave,
}: {
  open: boolean;
  settings: FieldSettings;
  onClose: () => void;
  onSave: (settings: FieldSettings) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(settings);
  const lang = settings.lang;

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <form
        className="dialog-card"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <header className="dialog-head">
          <h2>{t(lang, "settings")}</h2>
          <button type="button" className="ghost" onClick={onClose}>
            {t(lang, "close")}
          </button>
        </header>
        <div className="form-grid">
          <label>
            {t(lang, "officer")} · ខ្មែរ
            <input value={draft.officerNameKm} onChange={(event) => setDraft({ ...draft, officerNameKm: event.target.value })} />
          </label>
          <label>
            {t(lang, "officer")} · Latin
            <input value={draft.officerNameEn} onChange={(event) => setDraft({ ...draft, officerNameEn: event.target.value })} />
          </label>
          <label>
            {t(lang, "branch")}
            <input value={draft.branch} onChange={(event) => setDraft({ ...draft, branch: event.target.value })} />
          </label>
          <label>
            {t(lang, "exchange")}
            <NumericField
              label={t(lang, "exchange")}
              min={1}
              value={draft.khrPerUsd}
              onChange={(value) => setDraft({ ...draft, khrPerUsd: value })}
            />
          </label>
        </div>
        <p className="fine">{t(lang, "settingsRateHint")}</p>
        <footer className="dialog-actions">
          <span className="spacer" />
          <button type="button" className="ghost" onClick={onClose}>
            {t(lang, "cancel")}
          </button>
          <button type="submit" className="primary">
            {t(lang, "save")}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
