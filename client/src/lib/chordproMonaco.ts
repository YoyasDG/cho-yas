import type * as Monaco from 'monaco-editor';

let initialized = false;

export function configureChordProLanguage(monaco: typeof Monaco) {
  if (initialized) {
    return;
  }

  monaco.languages.register({ id: 'chordpro' });
  monaco.languages.setMonarchTokensProvider('chordpro', {
    tokenizer: {
      root: [
        [/\{(?:title|comment|subtitle|start_of_chorus|end_of_chorus|start_of_verse|end_of_verse|start_of_bridge|end_of_bridge)[^}]*\}/, 'directive'],
        [/\[[A-G](?:#|b)?(?:maj7|maj9|maj11|maj13|min7|min9|min11|min13|min|mmaj7|m7b5|m6|m7|m9|m11|m13|m|dim7|dim9|dim|aug7|aug|sus2|sus4|sus|add2|add4|add6|add7|add9|add11|add13|6|7|9|11|13|5|2|4)*(?:\([^)]+\))?(?:\/[A-G](?:#|b)?)?\]/, 'chord'],
      ],
    },
  });

  monaco.editor.defineTheme('chordpro-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'chord', foreground: '2563EB', fontStyle: 'bold' },
      { token: 'directive', foreground: '0F766E', fontStyle: 'bold' },
    ],
    colors: {
      'editor.background': '#F8FAFC',
      'editor.selectionBackground': '#DBEAFE',
      'editor.lineHighlightBackground': '#EFF6FF',
      'editorLineNumber.foreground': '#94A3B8',
    },
  });

  initialized = true;
}
