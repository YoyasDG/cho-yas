import { Languages } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm">
      <span className="inline-flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        <Languages className="h-3.5 w-3.5" />
        {t.switchLabel}
      </span>
      <div className="inline-flex rounded-full bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setLanguage('es')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            language === 'es' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            language === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
