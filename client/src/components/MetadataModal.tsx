import { Music4, X } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

export interface ChordProMetadata {
  title: string;
  author: string;
  key: string;
  tempo: string;
}

interface MetadataModalProps {
  open: boolean;
  metadata: ChordProMetadata;
  onChange: (field: keyof ChordProMetadata, value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
}

export function MetadataModal({
  open,
  metadata,
  onChange,
  onClose,
  onConfirm,
  confirming,
}: MetadataModalProps) {
  const { t } = useLanguage();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{t.metadata.badge}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{t.metadata.title}</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">{t.metadata.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t.metadata.fields.title}
            </span>
            <input
              type="text"
              value={metadata.title}
              onChange={(event) => onChange('title', event.target.value)}
              placeholder={t.metadata.placeholders.title}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t.metadata.fields.author}
            </span>
            <input
              type="text"
              value={metadata.author}
              onChange={(event) => onChange('author', event.target.value)}
              placeholder={t.metadata.placeholders.author}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t.metadata.fields.key}
            </span>
            <input
              type="text"
              value={metadata.key}
              onChange={(event) => onChange('key', event.target.value)}
              placeholder={t.metadata.placeholders.key}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t.metadata.fields.tempo}
            </span>
            <input
              type="text"
              value={metadata.tempo}
              onChange={(event) => onChange('tempo', event.target.value)}
              placeholder={t.metadata.placeholders.tempo}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Music4 className="h-4 w-4 text-blue-500" />
            {t.metadata.optionalHint}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              {t.metadata.cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirming}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirming ? t.metadata.confirming : t.metadata.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
