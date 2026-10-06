import { useEffect, useRef, useState } from "react";
import { PROVINCES } from "../domain/cambodia";
import type { Borrower, Lang } from "../db/types";
import { t } from "../i18n";
import { NumericField } from "./NumericField";

export function BorrowerDialog({
  open,
  title,
  initial,
  lang,
  allowDelete,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  title: string;
  initial: Borrower;
  lang: Lang;
  allowDelete?: boolean;
  onClose: () => void;
  onSubmit: (borrower: Borrower) => void;
  onDelete?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initial);
  const [armed, setArmed] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setDraft(initial);
      setArmed(false);
    }
    wasOpen.current = open;
  }, [open, initial]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const set = <K extends keyof Borrower>(key: K, value: Borrower[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const nameMissing = draft.fullNameKm.trim() === "" && draft.fullNameEn.trim() === "";

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      aria-labelledby="borrower-dialog-title"
    >
      <form
        className="dialog-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (nameMissing) return;
          onSubmit(draft);
        }}
      >
        <header className="dialog-head">
          <h2 id="borrower-dialog-title">{title}</h2>
          <button type="button" className="ghost" onClick={onClose}>
            {t(lang, "close")}
          </button>
        </header>
        <div className="form-grid">
          <label>
            {t(lang, "nameKm")}
            <input value={draft.fullNameKm} onChange={(event) => set("fullNameKm", event.target.value)} data-testid="name-km" />
          </label>
          <label>
            {t(lang, "nameEn")}
            <input value={draft.fullNameEn} onChange={(event) => set("fullNameEn", event.target.value)} />
          </label>
          <label>
            {t(lang, "phone")}
            <input value={draft.phone} inputMode="tel" onChange={(event) => set("phone", event.target.value)} />
          </label>
          <label>
            {t(lang, "nationalId")}
            <input value={draft.nationalId} onChange={(event) => set("nationalId", event.target.value)} />
          </label>
          <label>
            {t(lang, "village")}
            <input value={draft.village} onChange={(event) => set("village", event.target.value)} />
          </label>
          <label>
            {t(lang, "commune")}
            <input value={draft.commune} onChange={(event) => set("commune", event.target.value)} />
          </label>
          <label>
            {t(lang, "district")}
            <input value={draft.district} onChange={(event) => set("district", event.target.value)} />
          </label>
          <label>
            {t(lang, "province")}
            <select value={draft.province} onChange={(event) => set("province", event.target.value)}>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(lang, "occupation")}
            <input value={draft.occupation} onChange={(event) => set("occupation", event.target.value)} />
          </label>
          <label>
            {t(lang, "household")}
            <NumericField label={t(lang, "household")} min={1} max={30} value={draft.householdSize} onChange={(value) => set("householdSize", Math.round(value))} />
          </label>
        </div>
        {nameMissing && <p className="form-error">{t(lang, "requiredName")}</p>}
        <footer className="dialog-actions">
          {allowDelete && onDelete && (
            <button
              type="button"
              className="danger"
              onClick={() => {
                if (!armed) {
                  setArmed(true);
                  return;
                }
                onDelete();
              }}
            >
              {armed ? t(lang, "deleteConfirm") : t(lang, "deleteBorrower")}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="ghost" onClick={onClose}>
            {t(lang, "cancel")}
          </button>
          <button type="submit" className="primary" disabled={nameMissing} data-testid="save-borrower">
            {t(lang, "save")}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
