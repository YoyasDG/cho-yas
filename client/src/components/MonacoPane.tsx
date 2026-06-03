import Editor, { type OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { configureChordProLanguage } from '../lib/chordproMonaco';

interface MonacoPaneProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: 'plaintext' | 'chordpro';
  height?: string;
}

export function MonacoPane({
  value,
  onChange,
  readOnly = false,
  language = 'plaintext',
  height = '100%',
}: MonacoPaneProps) {
  const handleMount: OnMount = (_editor, monaco) => {
    configureChordProLanguage(monaco as typeof Monaco);
  };

  return (
    <Editor
      beforeMount={(monaco) => configureChordProLanguage(monaco as typeof Monaco)}
      onMount={handleMount}
      language={language}
      theme={language === 'chordpro' ? 'chordpro-light' : 'vs'}
      value={value}
      onChange={(nextValue) => onChange?.(nextValue ?? '')}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
      }}
      height={height}
    />
  );
}
