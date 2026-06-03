import { useMemo } from 'react';
import { renderChordProPreview } from '../lib/chordproPreview';

interface ChordProPreviewProps {
  value: string;
  emptyMessage: string;
}

export function ChordProPreview({ value, emptyMessage }: ChordProPreviewProps) {
  const content = useMemo(() => {
    if (!value.trim()) {
      return '';
    }

    try {
      return renderChordProPreview(value);
    } catch (error) {
      return `<div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">${error instanceof Error ? error.message : 'Preview failed.'}</div>`;
    }
  }, [value]);

  return (
    <div className="h-full overflow-auto bg-slate-50 p-5">
      {content ? (
        <div className="chordpro-preview" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
