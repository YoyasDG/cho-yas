import { Download, Save, X } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { MonacoPane } from './MonacoPane';

interface PreviewModalProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onDownload: () => void;
  saving: boolean;
}

export function PreviewModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
  onDownload,
  saving,
}: PreviewModalProps) {
  const { t } = useLanguage();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{t.modal.badge}</p>
            <h2 className="text-xl font-semibold text-slate-900">{t.modal.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 p-5">
          <div className="h-full overflow-hidden rounded-3xl border border-slate-200">
            <MonacoPane value={value} onChange={onChange} language="chordpro" height="100%" />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {t.modal.cancel}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            <Download className="h-4 w-4" />
            {t.modal.download}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? t.modal.saving : t.modal.save}
          </button>
        </div>
      </div>
    </div>
  );
}
