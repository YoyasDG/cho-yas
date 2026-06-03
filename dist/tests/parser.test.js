"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const vitest_1 = require("vitest");
const parser_1 = require("../src/parser");
(0, vitest_1.describe)('detectChordLine', () => {
    (0, vitest_1.it)('detects aligned chord lines', () => {
        (0, vitest_1.expect)((0, parser_1.detectChordLine)('D           Am          C')).toBe(true);
    });
    (0, vitest_1.it)('rejects lyric lines with normal words', () => {
        (0, vitest_1.expect)((0, parser_1.detectChordLine)('Dios de milagros y amor')).toBe(false);
    });
});
(0, vitest_1.describe)('mergeChordLine', () => {
    (0, vitest_1.it)('preserves exact columns in strict mode', () => {
        const result = (0, parser_1.mergeChordLine)([
            { chord: 'F#m', index: 0, order: 0 },
            { chord: 'D', index: 8, order: 1 },
            { chord: 'A', index: 19, order: 2 },
        ], 'Dios de milagros y amor', { mode: 'strict' });
        (0, vitest_1.expect)(result).toBe('[F#m]Dio[D]s de mil[A]agros y amor');
    });
    (0, vitest_1.it)('maps chords to the start of the occupied word in musical mode', () => {
        const result = (0, parser_1.mergeChordLine)([
            { chord: 'F#m', index: 0, order: 0 },
            { chord: 'D', index: 8, order: 1 },
            { chord: 'A', index: 19, order: 2 },
        ], 'Dios de milagros y amor', { sourceLineLength: 'F#m     D          A'.length });
        (0, vitest_1.expect)(result).toBe('[F#m]Dios de [D]milagros y [A]amor');
    });
    (0, vitest_1.it)('pads short lyrics when chords land beyond the end of the line', () => {
        const result = (0, parser_1.mergeChordLine)([{ chord: 'G', index: 15, order: 0 }], 'Santo Santo es Él');
        (0, vitest_1.expect)(result).toBe('Santo Santo es [G]Él');
    });
});
(0, vitest_1.describe)('convertSpecialLine', () => {
    (0, vitest_1.it)('turns section labels into ChordPro directives', () => {
        (0, vitest_1.expect)((0, parser_1.convertSpecialLine)('Coro:')).toEqual({
            kind: 'section-start',
            lines: ['{start_of_chorus}'],
            openSection: 'chorus',
        });
    });
    (0, vitest_1.it)('turns intro chord lines into a comment plus a chord-only line', () => {
        (0, vitest_1.expect)((0, parser_1.convertSpecialLine)('Intro: F#m D A E')).toEqual({
            kind: 'comment-and-chords',
            lines: ['{comment: Intro}', '[F#m] [D] [A] [E]'],
        });
    });
    (0, vitest_1.it)('turns instrumental labels like Inter into a comment plus chords', () => {
        (0, vitest_1.expect)((0, parser_1.convertSpecialLine)('Inter: D A Bm G')).toEqual({
            kind: 'comment-and-chords',
            lines: ['{comment: Inter}', '[D] [A] [Bm] [G]'],
        });
    });
});
(0, vitest_1.describe)('parseSong', () => {
    (0, vitest_1.it)('converts a normal chords-over-lyrics file in musical mode', () => {
        const input = [
            'F#m     D          A',
            'Dios de milagros y amor',
        ].join('\n');
        (0, vitest_1.expect)((0, parser_1.parseSong)(input)).toBe('[F#m]Dios de [D]milagros y [A]amor');
    });
    (0, vitest_1.it)('preserves strict alignment when requested', () => {
        const input = [
            'F#m     D          A',
            'Dios de milagros y amor',
        ].join('\n');
        (0, vitest_1.expect)((0, parser_1.parseSong)(input, { mode: 'strict' })).toBe('[F#m]Dio[D]s de mil[A]agros y amor');
    });
    (0, vitest_1.it)('keeps plain text and malformed lines intact', () => {
        const input = [
            'This line should stay as text',
            'Bm7x not a chord line',
            '',
            'Verse 1:',
            'A        E',
            'hola señor',
        ].join('\n');
        const output = (0, parser_1.parseSong)(input, { mode: 'musical' });
        (0, vitest_1.expect)(output).toContain('This line should stay as text');
        (0, vitest_1.expect)(output).toContain('Bm7x not a chord line');
        (0, vitest_1.expect)(output).toContain('{start_of_verse: Verse 1}');
        (0, vitest_1.expect)(output).toContain('{end_of_verse}');
        (0, vitest_1.expect)(output).toContain('[A]');
        (0, vitest_1.expect)(output).toContain('[E]');
    });
    (0, vitest_1.it)('keeps the reference example readable in musical mode', () => {
        const input = [
            'F#m               D',
            'Mi Dios es grande, mi Dios es fuerte',
        ].join('\n');
        (0, vitest_1.expect)((0, parser_1.parseSong)(input)).toBe('[F#m]Mi Dios es grande, mi Dios es [D]fuerte');
    });
    (0, vitest_1.it)('handles slash chords, tabs and consecutive chord lines', () => {
        const input = [
            'G/B\tD\tEm7',
            'Canción con acentos y ñ',
            '',
            'C F#m Bb',
            'Am Dsus4',
            'Letra final',
        ].join('\n');
        const output = (0, parser_1.parseSong)(input);
        (0, vitest_1.expect)(output).toContain('[G/B]');
        (0, vitest_1.expect)(output).toContain('ñ');
        (0, vitest_1.expect)(output).toContain('[C]');
        (0, vitest_1.expect)(output).toContain('[Dsus4]');
    });
    (0, vitest_1.it)('round-trips a real fixture file', async () => {
        const input = await (0, promises_1.readFile)((0, node_path_1.join)(process.cwd(), 'samplefiles', 'cifraclub.txt'), 'utf8');
        const output = (0, parser_1.parseSong)(input);
        (0, vitest_1.expect)(output).toContain('{comment: Intro}');
        (0, vitest_1.expect)(output).toContain('[D]');
    });
});
(0, vitest_1.describe)('CLI compatibility', () => {
    (0, vitest_1.it)('writes the expected output path content', async () => {
        const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'chords-'));
        const inputPath = (0, node_path_1.join)(dir, 'song.txt');
        const outputPath = (0, node_path_1.join)(dir, 'song.cho');
        await (0, promises_1.writeFile)(inputPath, 'D   G\nhola mundo\n', 'utf8');
        const { spawn } = await Promise.resolve().then(() => __importStar(require('node:child_process')));
        await new Promise((resolvePromise, rejectPromise) => {
            const child = spawn(process.execPath, ['--import', 'tsx', (0, node_path_1.join)(process.cwd(), 'src', 'cli.ts'), inputPath, outputPath], {
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
        const written = await (0, promises_1.readFile)(outputPath, 'utf8');
        (0, vitest_1.expect)(written).toContain('[D]');
        (0, vitest_1.expect)(written).toContain('[G]');
    });
});
