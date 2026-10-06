import { useEffect, useState } from "react";

export function NumericField({
  value,
  onChange,
  min,
  max,
  id,
  label,
  testId,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  id?: string;
  label: string;
  testId?: string;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const commit = (nextText: string) => {
    if (nextText.trim() === "" || nextText === "-" || nextText === ".") return;
    const parsed = Number(nextText.replace(/,/g, ""));
    if (!Number.isFinite(parsed)) return;
    let next = parsed;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    onChange(next);
  };

  return (
    <input
      id={id}
      className="num"
      aria-label={label}
      data-testid={testId}
      inputMode="decimal"
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const parsed = Number(text.replace(/,/g, ""));
        if (!Number.isFinite(parsed)) {
          setText(String(value));
          return;
        }
        let next = parsed;
        if (min != null) next = Math.max(min, next);
        if (max != null) next = Math.min(max, next);
        setText(String(next));
        if (next !== value) onChange(next);
      }}
      onChange={(event) => {
        setText(event.target.value);
        commit(event.target.value);
      }}
    />
  );
}
