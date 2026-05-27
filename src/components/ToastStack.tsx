"use client";

export type Toast = {
  id: number;
  title: string;
  body?: string;
};

const MAX_VISIBLE = 3;

type ToastStackProps = {
  toasts: Toast[];
};

export function capToasts(toasts: Toast[]): Toast[] {
  return toasts.slice(-MAX_VISIBLE);
}

export default function ToastStack({ toasts }: ToastStackProps) {
  const visible = capToasts(toasts);
  if (visible.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-3 top-[4.5rem] z-50 flex w-[min(100%,16rem)] flex-col gap-1.5 sm:left-4 sm:top-24"
      aria-live="polite"
      aria-relevant="additions"
    >
      {visible.map((t) => (
        <div
          key={t.id}
          className="toast-in rounded-lg border border-amber-800/20 bg-amber-950/90 px-3 py-2 text-left text-white shadow-md backdrop-blur-sm"
        >
          <p className="text-sm font-semibold leading-tight">{t.title}</p>
          {t.body && (
            <p className="mt-0.5 text-[11px] leading-snug text-amber-100/75">
              {t.body}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export { MAX_VISIBLE as MAX_TOASTS };
