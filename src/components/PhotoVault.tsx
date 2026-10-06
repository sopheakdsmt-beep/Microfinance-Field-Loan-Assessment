import { useEffect, useRef, useState } from "react";
import { COLLATERAL_CATEGORIES, categoryLabel, type CollateralCategory } from "../domain/cambodia";
import { formatTimestamp } from "../domain/dates";
import type { Lang } from "../db/types";
import type { PhotoRecord } from "../db/types";
import { t } from "../i18n";
import { readGps, stampPhoto } from "../photo/stamp";
import { Icon, paths } from "./Icons";

export function PhotoVault({
  lang,
  borrowerName,
  officer,
  photos,
  onAdd,
  onDelete,
}: {
  lang: Lang;
  borrowerName: string;
  officer: string;
  photos: PhotoRecord[];
  onAdd: (photo: Omit<PhotoRecord, "id" | "updatedAt" | "syncStatus"> & { id?: string }) => void | Promise<void>;
  onDelete: (id: string) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const gpsRef = useRef<ReturnType<typeof readGps> | null>(null);
  const [category, setCategory] = useState<CollateralCategory>("hard_title");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = photos.find((photo) => photo.id === openId) ?? null;

  const beginPick = (input: HTMLInputElement | null) => {
    gpsRef.current = readGps();
    input?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const gps = (await gpsRef.current) ?? (await readGps(4000));
      const capturedAt = Date.now();
      const stamped = await stampPhoto(file, {
        borrowerName,
        categoryLabel: categoryLabel(category, lang),
        capturedAt,
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
        accuracy: gps?.accuracy ?? null,
        officer,
        lang,
      });
      await onAdd({
        borrowerId: "",
        category,
        note,
        image: stamped,
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
        accuracy: gps?.accuracy ?? null,
        gpsStatus: gps ? "captured" : "unavailable",
        capturedAt,
      });
      setNote("");
    } catch {
      setError(t(lang, "photoFailed"));
    } finally {
      setBusy(false);
      gpsRef.current = null;
      if (cameraRef.current) cameraRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <section className="vault" data-testid="photo-vault">
      <div className="section-label">
        <h2>{t(lang, "collateral")}</h2>
      </div>
      <p className="fine">{t(lang, "photoHelp")}</p>
      <div className="vault-controls">
        <label>
          {t(lang, "category")}
          <select value={category} onChange={(event) => setCategory(event.target.value as CollateralCategory)} data-testid="photo-category">
            {COLLATERAL_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {lang === "km" ? item.km : item.en}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t(lang, "note")}
          <input
            value={note}
            placeholder={t(lang, "notePlaceholder")}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div className="vault-actions">
          <button type="button" className="primary" onClick={() => beginPick(cameraRef.current)} disabled={busy}>
            <Icon d={paths.camera} />
            {t(lang, "takePhoto")}
          </button>
          <button type="button" className="ghost" onClick={() => beginPick(fileRef.current)} disabled={busy} data-testid="choose-photo">
            {t(lang, "choosePhoto")}
          </button>
        </div>
        <input
          ref={cameraRef}
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <input
          ref={fileRef}
          className="sr-only"
          data-testid="photo-input"
          type="file"
          accept="image/*"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </div>
      {busy && <p className="fine">{t(lang, "stamping")}</p>}
      {error && <p className="form-error">{error}</p>}
      {photos.length === 0 && <p className="vault-empty">{t(lang, "noPhotos")}</p>}
      <div className="photo-grid">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} lang={lang} onOpen={() => setOpenId(photo.id)} />
        ))}
      </div>
      {open && (
        <PhotoDialog
          photo={open}
          lang={lang}
          onClose={() => setOpenId(null)}
          onDelete={() => {
            onDelete(open.id);
            setOpenId(null);
          }}
        />
      )}
    </section>
  );
}

function PhotoCard({ photo, lang, onOpen }: { photo: PhotoRecord; lang: Lang; onOpen: () => void }) {
  const url = useObjectUrl(photo.image);
  return (
    <button type="button" className="photo-card" onClick={onOpen}>
      {url && <img src={url} alt={categoryLabel(photo.category, lang)} />}
      <span>
        <strong>{categoryLabel(photo.category, lang)}</strong>
        <small>{photo.gpsStatus === "captured" ? `${photo.latitude?.toFixed(5)}, ${photo.longitude?.toFixed(5)}` : t(lang, "gpsMissing")}</small>
      </span>
    </button>
  );
}

function PhotoDialog({
  photo,
  lang,
  onClose,
  onDelete,
}: {
  photo: PhotoRecord;
  lang: Lang;
  onClose: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const url = useObjectUrl(photo.image);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const map =
    photo.latitude != null && photo.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${photo.latitude}&mlon=${photo.longitude}#map=17/${photo.latitude}/${photo.longitude}`
      : null;
  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <div className="dialog-card photo-dialog">
        <header className="dialog-head">
          <h2>{categoryLabel(photo.category, lang)}</h2>
          <button type="button" className="ghost" onClick={onClose}>
            {t(lang, "close")}
          </button>
        </header>
        {url && <img className="lightbox" src={url} alt={categoryLabel(photo.category, lang)} />}
        <p>{photo.note}</p>
        <p className="fine">
          {formatTimestamp(photo.capturedAt, lang)}
          {" · "}
          {photo.gpsStatus === "captured"
            ? `${photo.latitude?.toFixed(6)}, ${photo.longitude?.toFixed(6)} · ±${Math.round(photo.accuracy ?? 0)}m`
            : t(lang, "gpsMissing")}
        </p>
        <footer className="dialog-actions">
          <button type="button" className="danger" onClick={onDelete}>
            {t(lang, "deletePhoto")}
          </button>
          <span className="spacer" />
          {map ? (
            <a className="ghost linkish" href={map} target="_blank" rel="noreferrer">
              <Icon d={paths.pin} />
              {t(lang, "openMap")}
            </a>
          ) : (
            <span className="fine">{t(lang, "mapOffline")}</span>
          )}
        </footer>
      </div>
    </dialog>
  );
}

function useObjectUrl(blob: Blob): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
