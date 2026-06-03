import { ArrowLeft, Download, Eraser, FileDown, FileMusic, FileText, Music4, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChordProPreview } from '../components/ChordProPreview';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { MetadataModal, type ChordProMetadata } from '../components/MetadataModal';
import { MonacoPane } from '../components/MonacoPane';
import { StatusBanner } from '../components/StatusBanner';
import { convertTxt, downloadCho, downloadPdf, generatePdf, uploadCho, type PdfColumnCount, type SessionSong } from '../lib/api';
import { useLanguage } from '../lib/i18n';

type Banner = {
  tone: 'error' | 'success' | 'info';
  text: string;
};

type WorkflowMode = 'txt' | 'cho';

export function ConvertPage() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const workflow = (searchParams.get('mode') === 'cho' ? 'cho' : 'txt') as WorkflowMode;

  const [banner, setBanner] = useState<Banner | null>(null);
  const [working, setWorking] = useState(false);
  const [song, setSong] = useState<SessionSong | null>(null);
  const [choContent, setChoContent] = useState('');
  const [pdfColumns, setPdfColumns] = useState<PdfColumnCount>(1);
  const [inputVersion, setInputVersion] = useState(0);
  const [txtFile, setTxtFile] = useState<File | null>(null);
  const [choFile, setChoFile] = useState<File | null>(null);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [metadata, setMetadata] = useState<ChordProMetadata>({
    title: '',
    author: '',
    key: '',
    tempo: '',
  });

  const copy = useMemo(
    () =>
      language === 'es'
        ? {
            back: 'Volver al inicio',
            titleTxt: 'TXT → CHO → PDF',
            titleCho: 'CHO → PDF',
            subtitleTxt:
              'Sube un TXT, conviértelo con el motor existente, ajusta el ChordPro y descarga el .cho o el PDF sin guardar nada en servidor.',
            subtitleCho:
              'Sube un archivo CHO, revísalo en pantalla, corrígelo si hace falta y genera un PDF al momento.',
            txtUploadLabel: 'Subir TXT',
            choUploadLabel: 'Subir CHO',
            selectedTxt: 'TXT seleccionado',
            selectedCho: 'CHO seleccionado',
            convertButton: 'Convertir TXT',
            openChoButton: 'Abrir CHO',
            working: 'Procesando...',
            sourceTitle: 'Original',
            editorTitle: 'Editor CHO',
            previewTitle: 'Vista previa renderizada',
            editorEmpty: 'El editor aparecerá aquí cuando conviertas o abras una canción.',
            sourceEmptyTxt: 'Sube un archivo TXT para comenzar la conversión.',
            sourceEmptyCho: 'Sube un archivo CHO para previsualizarlo y generar PDF.',
            previewEmpty: 'La vista previa aparecerá aquí cuando exista contenido ChordPro.',
            actionTitle: 'Acciones de la sesión',
            actionDescription: 'Todo ocurre en esta sesión: descarga el .cho, genera el PDF y limpia la pantalla cuando termines.',
            pdfLayoutLabel: 'Columnas del PDF',
            pdfLayoutOne: '1 columna',
            pdfLayoutTwo: '2 columnas',
            downloadCho: 'Descargar CHO',
            generatePdf: 'Generar PDF',
            clearSession: 'Limpiar sesión',
            noFile: 'Ningún archivo seleccionado',
            banners: {
              chooseTxt: 'Elige un archivo TXT antes de convertir.',
              chooseCho: 'Elige un archivo CHO antes de abrirlo.',
              converted: 'CHO generado correctamente. Ya puedes editarlo y descargar el resultado.',
              choOpened: 'Archivo CHO cargado correctamente.',
              pdfGenerated: 'PDF generado correctamente.',
              sessionCleared: 'La sesión se limpió. No se guardó ningún archivo.',
            },
          }
        : {
            back: 'Return to home',
            titleTxt: 'TXT → CHO → PDF',
            titleCho: 'CHO → PDF',
            subtitleTxt:
              'Upload a TXT file, convert it with the existing engine, adjust the ChordPro output, and download the .cho or PDF without saving anything on the server.',
            subtitleCho:
              'Upload a CHO file, review it on screen, correct it if needed, and generate a PDF on the spot.',
            txtUploadLabel: 'Upload TXT',
            choUploadLabel: 'Upload CHO',
            selectedTxt: 'Selected TXT',
            selectedCho: 'Selected CHO',
            convertButton: 'Convert TXT',
            openChoButton: 'Open CHO',
            working: 'Processing...',
            sourceTitle: 'Original',
            editorTitle: 'CHO Editor',
            previewTitle: 'Rendered Preview',
            editorEmpty: 'The editor will appear here once you convert or open a song.',
            sourceEmptyTxt: 'Upload a TXT file to start the conversion flow.',
            sourceEmptyCho: 'Upload a CHO file to preview it and generate a PDF.',
            previewEmpty: 'The preview will appear here when ChordPro content is available.',
            actionTitle: 'Session actions',
            actionDescription: 'Everything happens in this session: download the .cho, generate the PDF, and clear the screen when you are done.',
            pdfLayoutLabel: 'PDF columns',
            pdfLayoutOne: '1 column',
            pdfLayoutTwo: '2 columns',
            downloadCho: 'Download CHO',
            generatePdf: 'Generate PDF',
            clearSession: 'Clear session',
            noFile: 'No file selected',
            banners: {
              chooseTxt: 'Choose a TXT file before converting.',
              chooseCho: 'Choose a CHO file before opening it.',
              converted: 'CHO generated successfully. You can now edit it and download the result.',
              choOpened: 'CHO file loaded successfully.',
              pdfGenerated: 'PDF generated successfully.',
              sessionCleared: 'The session was cleared. No files were stored.',
            },
          },
    [language],
  );

  function resetSession() {
    setSong(null);
    setChoContent('');
    setPdfColumns(1);
    setTxtFile(null);
    setChoFile(null);
    setInputVersion((current) => current + 1);
    setMetadata({
      title: '',
      author: '',
      key: '',
      tempo: '',
    });
    setMetadataOpen(false);
    setBanner({ tone: 'info', text: copy.banners.sessionCleared });
  }

  async function handleTxtConvert() {
    if (!txtFile) {
      setBanner({ tone: 'error', text: copy.banners.chooseTxt });
      return;
    }

    setMetadataOpen(true);
  }

  async function confirmTxtConvert() {
    if (!txtFile) {
      setMetadataOpen(false);
      setBanner({ tone: 'error', text: copy.banners.chooseTxt });
      return;
    }

    try {
      setWorking(true);
      setMetadataOpen(false);
      const converted = await convertTxt(txtFile, metadata);
      setSong(converted);
      setChoContent(converted.choContent);
      setBanner({ tone: 'success', text: copy.banners.converted });
    } catch (error) {
      setBanner({ tone: 'error', text: error instanceof Error ? error.message : 'Conversion failed.' });
    } finally {
      setWorking(false);
    }
  }

  async function handleChoOpen() {
    if (!choFile) {
      setBanner({ tone: 'error', text: copy.banners.chooseCho });
      return;
    }

    try {
      setWorking(true);
      const opened = await uploadCho(choFile);
      setSong(opened);
      setChoContent(opened.choContent);
      setBanner({ tone: 'success', text: copy.banners.choOpened });
    } catch (error) {
      setBanner({ tone: 'error', text: error instanceof Error ? error.message : 'Open failed.' });
    } finally {
      setWorking(false);
    }
  }

  async function handleGeneratePdf() {
    if (!song) {
      return;
    }

    try {
      setWorking(true);
      const pdfBlob = await generatePdf(choContent, song.pdfFilename, pdfColumns);
      downloadPdf(pdfBlob, song.pdfFilename);
      setBanner({ tone: 'success', text: copy.banners.pdfGenerated });
    } catch (error) {
      setBanner({ tone: 'error', text: error instanceof Error ? error.message : 'PDF generation failed.' });
    } finally {
      setWorking(false);
    }
  }

  const sourceContent = song?.originalContent ?? '';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(191,219,254,0.45),_transparent_34%),linear-gradient(180deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                {copy.back}
              </Link>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {workflow === 'txt' ? copy.titleTxt : copy.titleCho}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {workflow === 'txt' ? copy.subtitleTxt : copy.subtitleCho}
              </p>
            </div>
            <LanguageSwitch />
          </div>
        </section>

        {banner ? <StatusBanner tone={banner.tone} message={banner.text} /> : null}

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-panel">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_220px] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {workflow === 'txt' ? copy.txtUploadLabel : copy.choUploadLabel}
              </span>
              <input
                key={`upload-${workflow}-${inputVersion}`}
                type="file"
                accept={workflow === 'txt' ? '.txt,text/plain' : '.cho,.chordpro,text/plain'}
                onChange={(event) => {
                  if (workflow === 'txt') {
                    setTxtFile(event.target.files?.[0] ?? null);
                  } else {
                    setChoFile(event.target.files?.[0] ?? null);
                  }
                }}
                className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600"
              />
            </label>

            <button
              type="button"
              onClick={() => void (workflow === 'txt' ? handleTxtConvert() : handleChoOpen())}
              disabled={working}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workflow === 'txt' ? <Sparkles className="h-4 w-4" /> : <FileMusic className="h-4 w-4" />}
              {working ? copy.working : workflow === 'txt' ? copy.convertButton : copy.openChoButton}
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {workflow === 'txt' ? copy.selectedTxt : copy.selectedCho}
              </p>
              <p className="mt-2 truncate text-sm font-medium text-slate-700">
                {workflow === 'txt' ? txtFile?.name ?? copy.noFile : choFile?.name ?? copy.noFile}
              </p>
            </div>
          </div>
        </section>

        {song ? (
          <section className="rounded-[32px] border border-blue-100 bg-white/90 p-6 shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  <Music4 className="h-3.5 w-3.5" />
                  {copy.actionTitle}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy.actionDescription}</p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {copy.pdfLayoutLabel}
                  </span>
                  <div className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
                    <button
                      type="button"
                      onClick={() => setPdfColumns(1)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        pdfColumns === 1 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {copy.pdfLayoutOne}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfColumns(2)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        pdfColumns === 2 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {copy.pdfLayoutTwo}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCho(choContent, song.choFilename)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  {copy.downloadCho}
                </button>
                <button
                  type="button"
                  onClick={() => void handleGeneratePdf()}
                  disabled={working}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileDown className="h-4 w-4" />
                  {copy.generatePdf}
                </button>
                <button
                  type="button"
                  onClick={resetSession}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  <Eraser className="h-4 w-4" />
                  {copy.clearSession}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-panel">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <FileText className="h-4 w-4 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">{copy.sourceTitle}</h2>
            </div>
            <div className="min-h-0 flex-1">
              <MonacoPane
                value={sourceContent || (workflow === 'txt' ? copy.sourceEmptyTxt : copy.sourceEmptyCho)}
                readOnly
                language="plaintext"
              />
            </div>
          </div>

          <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-panel">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <Sparkles className="h-4 w-4 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">{copy.editorTitle}</h2>
            </div>
            <div className="min-h-0 flex-1">
              <MonacoPane value={song ? choContent : ''} onChange={setChoContent} language="chordpro" />
              {!song ? (
                <div className="pointer-events-none absolute inset-x-0 top-[70px] mx-6 rounded-2xl border border-dashed border-slate-300 bg-white/90 px-4 py-6 text-sm text-slate-500">
                  {copy.editorEmpty}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-[32px] border border-blue-100 bg-white/90 shadow-panel">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <Music4 className="h-4 w-4 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">{copy.previewTitle}</h2>
            </div>
            <div className="min-h-0 flex-1">
              <ChordProPreview value={choContent} emptyMessage={copy.previewEmpty} />
            </div>
          </div>
        </section>
      </div>

      <MetadataModal
        open={metadataOpen}
        metadata={metadata}
        onChange={(field, value) => setMetadata((current) => ({ ...current, [field]: value }))}
        onClose={() => setMetadataOpen(false)}
        onConfirm={() => void confirmTxtConvert()}
        confirming={working}
      />
    </main>
  );
}
