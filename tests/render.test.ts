import { describe, expect, it } from 'vitest';
import { renderChordProPreview } from '../client/src/lib/chordproPreview';
import { renderChordProHtml } from '../server/services/pdfService';

describe('ChordPro renderers', () => {
  it('renders chord-only lines as instrumental progressions in the preview', () => {
    const html = renderChordProPreview('{comment: Intro}\n[F#m] [D] [A] [E]');

    expect(html).toContain('<div class="instrumental-line">');
    expect((html.match(/class="chord instrumental-chord"/g) ?? []).length).toBe(4);
    expect(html).toContain('>F#m<');
    expect(html).toContain('>D<');
    expect(html).toContain('>A<');
    expect(html).toContain('>E<');
  });

  it('keeps lyric lines as lyric rows in the preview', () => {
    const html = renderChordProPreview('[F#m]Dios es [D]milagros y [A]amor');

    expect(html).not.toContain('<div class="instrumental-line">');
    expect(html).toContain('<div class="lyrics">Dios es </div>');
    expect(html).toContain('<div class="lyrics">milagros y </div>');
    expect(html).toContain('<div class="lyrics">amor</div>');
  });

  it('renders chord-only lines as instrumental progressions for PDF generation', () => {
    const html = renderChordProHtml('{comment: Instrumental}\n[C] [G] [Am] [F]');

    expect(html).toContain('<div class="instrumental-line">');
    expect((html.match(/class="chord instrumental-chord"/g) ?? []).length).toBe(4);
    expect(html).toContain('>C<');
    expect(html).toContain('>G<');
    expect(html).toContain('>Am<');
    expect(html).toContain('>F<');
  });

  it('does not treat lyric lines as instrumental progressions in PDF rendering', () => {
    const html = renderChordProHtml('[Bm]Incomparable eres [E]Tú');

    expect(html).not.toContain('<div class="instrumental-line">');
    expect(html).toContain('<div class="lyrics">Incomparable eres </div>');
    expect(html).toContain('<div class="lyrics">Tú</div>');
  });
});
