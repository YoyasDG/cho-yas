import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convertSpecialLine, detectChordLine, mergeChordLine, parseSong } from '../src/parser';

describe('detectChordLine', () => {
  it('detects aligned chord lines', () => {
    expect(detectChordLine('D           Am          C')).toBe(true);
  });

  it('rejects lyric lines with normal words', () => {
    expect(detectChordLine('Dios de milagros y amor')).toBe(false);
  });
});

describe('mergeChordLine', () => {
  it('preserves exact columns in strict mode', () => {
    const result = mergeChordLine(
      [
        { chord: 'F#m', index: 0, order: 0 },
        { chord: 'D', index: 8, order: 1 },
        { chord: 'A', index: 19, order: 2 },
      ],
      'Dios de milagros y amor',
      { mode: 'strict' },
    );

    expect(result).toBe('[F#m]Dio[D]s de mil[A]agros y amor');
  });

  it('keeps musical alignment near the projected timeline in musical mode', () => {
    const result = mergeChordLine(
      [
        { chord: 'F#m', index: 0, order: 0 },
        { chord: 'D', index: 8, order: 1 },
        { chord: 'A', index: 19, order: 2 },
      ],
      'Dios de milagros y amor',
      { sourceLineLength: 'F#m     D          A'.length },
    );

    expect(result).toBe('[F#m]Dios de [D]milagros y [A]amor');
  });

  it('pads short lyrics when chords land beyond the end of the line', () => {
    const result = mergeChordLine([{ chord: 'G', index: 15, order: 0 }], 'Santo Santo es Él');
    expect(result).toBe('Santo Santo es [G]Él');
  });
});

describe('convertSpecialLine', () => {
  it('turns section labels into ChordPro directives', () => {
    expect(convertSpecialLine('Coro:')).toEqual({
      kind: 'section-start',
      lines: ['{start_of_chorus}'],
      openSection: 'chorus',
    });
  });

  it('turns intro chord lines into a comment plus a chord-only line', () => {
    expect(convertSpecialLine('Intro: F#m D A E')).toEqual({
      kind: 'comment-and-chords',
      lines: ['{comment: Intro}', '[F#m] [D] [A] [E]'],
    });
  });

  it('turns instrumental labels like Inter into a comment plus chords', () => {
    expect(convertSpecialLine('Inter: D A Bm G')).toEqual({
      kind: 'comment-and-chords',
      lines: ['{comment: Inter}', '[D] [A] [Bm] [G]'],
    });
  });
});

describe('parseSong', () => {
  it('converts a normal chords-over-lyrics file in musical mode', () => {
    const input = [
      'F#m     D          A',
      'Dios de milagros y amor',
    ].join('\n');

    expect(parseSong(input)).toBe('[F#m]Dios de [D]milagros y [A]amor');
  });

  it('preserves strict alignment when requested', () => {
    const input = [
      'F#m     D          A',
      'Dios de milagros y amor',
    ].join('\n');

    expect(parseSong(input, { mode: 'strict' })).toBe('[F#m]Dio[D]s de mil[A]agros y amor');
  });

  it('keeps plain text and malformed lines intact', () => {
    const input = [
      'This line should stay as text',
      'Bm7x not a chord line',
      '',
      'Verse 1:',
      'A        E',
      'hola señor',
    ].join('\n');

    const output = parseSong(input, { mode: 'musical' });
    expect(output).toContain('This line should stay as text');
    expect(output).toContain('Bm7x not a chord line');
    expect(output).toContain('{start_of_verse: Verse 1}');
    expect(output).toContain('{end_of_verse}');
    expect(output).toContain('[A]');
    expect(output).toContain('[E]');
  });

  it('keeps the reference example readable in musical mode', () => {
    const input = [
      'F#m               D',
      'Mi Dios es grande mi Dios es fuerte',
    ].join('\n');

    expect(parseSong(input)).toBe('[F#m]Mi Dios es grande [D]mi Dios es fuerte');
  });

  it('preserves projected timing even when that means a local in-word split', () => {
    const result = mergeChordLine(
      [{ chord: 'E', index: 22, order: 0 }],
      'Nadie es igual nadie le hace frente',
      { sourceLineLength: 35 },
    );

    expect(result).toBe('Nadie es igual nadie l[E]e hace frente');
  });

  it('handles slash chords, tabs and consecutive chord lines', () => {
    const input = [
      'G/B\tD\tEm7',
      'Canción con acentos y ñ',
      '',
      'C F#m Bb',
      'Am Dsus4',
      'Letra final',
    ].join('\n');

    const output = parseSong(input);
    expect(output).toContain('[G/B]');
    expect(output).toContain('ñ');
    expect(output).toContain('[C]');
    expect(output).toContain('[Dsus4]');
  });

  it('round-trips a real fixture file', async () => {
    const input = await readFile(join(process.cwd(), 'samplefiles', 'cifraclub.txt'), 'utf8');
    const output = parseSong(input);
    expect(output).toContain('{comment: Intro}');
    expect(output).toContain('[D]');
  });
});

describe('CLI compatibility', () => {
  it('writes the expected output path content', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'chords-'));
    const inputPath = join(dir, 'song.txt');
    const outputPath = join(dir, 'song.cho');

    await writeFile(inputPath, 'D   G\nhola mundo\n', 'utf8');

    const { spawn } = await import('node:child_process');
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const child = spawn(process.execPath, ['--import', 'tsx', join(process.cwd(), 'src', 'cli.ts'), inputPath, outputPath], {
        stdio: 'inherit',
      });
      child.on('exit', (code) => {
        if (code === 0) {
          resolvePromise();
          return;
        }
        rejectPromise(new Error(`CLI exited with ${code}`));
      });
      child.on('error', rejectPromise);
    });

    const written = await readFile(outputPath, 'utf8');
    expect(written).toContain('[D]');
    expect(written).toContain('[G]');
  });
});
