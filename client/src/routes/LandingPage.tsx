import { FileMusic, FileText } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { useLanguage } from '../lib/i18n';

export function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const copy = useMemo(
    () =>
      language === 'es'
        ? {
            badge: 'Herramienta en línea',
            title: 'Convierte canciones TXT a ChordPro y PDF en una sola sesión',
            description:
              'Sube un archivo TXT de LaCuerda, CifraClub o un archivo CHO existente, revísalo, ajústalo si hace falta y descarga el resultado. No se guarda historial ni biblioteca: sube, convierte y obtén tus archivos.',
            txtTitle: 'TXT → CHO → PDF',
            txtDescription:
              'Convierte un cifrado de texto a ChordPro, edita el resultado y genera un PDF listo para imprimir.',
            txtFlow: 'TXT → Convertir → Editar CHO → Descargar CHO → Generar PDF',
            txtButton: 'Convertir TXT',
            choTitle: 'CHO → PDF',
            choDescription:
              'Sube un archivo ChordPro existente, visualízalo correctamente y genera un PDF sin pasos extra.',
            choFlow: 'CHO → Vista previa → Ajustar → Generar PDF',
            choButton: 'Abrir CHO',
          }
        : {
            badge: 'Online tool',
            title: 'Convert TXT songs to ChordPro and PDF in a single session',
            description:
              'Upload a TXT file from LaCuerda, CifraClub, or an existing CHO file, review it, adjust it if needed, and download the result. No history and no song library: upload, convert, and get your files.',
            txtTitle: 'TXT → CHO → PDF',
            txtDescription:
              'Convert a plain text chord sheet to ChordPro, edit the result, and generate a printable PDF.',
            txtFlow: 'TXT → Convert → Edit CHO → Download CHO → Generate PDF',
            txtButton: 'Convert TXT',
            choTitle: 'CHO → PDF',
            choDescription:
              'Upload an existing ChordPro file, preview it properly, and generate a PDF without extra steps.',
            choFlow: 'CHO → Preview → Adjust → Generate PDF',
            choButton: 'Open CHO',
          },
    [language],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.35),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">{copy.badge}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">{copy.description}</p>
            </div>
            <LanguageSwitch />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-panel">
            <div className="inline-flex rounded-full bg-blue-100 p-3 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">{copy.txtTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{copy.txtDescription}</p>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {copy.txtFlow}
            </div>
            <button
              type="button"
              onClick={() => navigate('/convert?mode=txt')}
              className="mt-6 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              {copy.txtButton}
            </button>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-panel">
            <div className="inline-flex rounded-full bg-blue-100 p-3 text-blue-600">
              <FileMusic className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">{copy.choTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{copy.choDescription}</p>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {copy.choFlow}
            </div>
            <button
              type="button"
              onClick={() => navigate('/convert?mode=cho')}
              className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.choButton}
            </button>
          </article>
        </section>
      </div>
    </main>
  );
}
