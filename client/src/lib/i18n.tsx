import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'es' | 'en';

interface Dictionary {
  switchLabel: string;
  modal: {
    badge: string;
    title: string;
    cancel: string;
    download: string;
    save: string;
    saving: string;
  };
  metadata: {
    badge: string;
    title: string;
    description: string;
    fields: {
      title: string;
      author: string;
      key: string;
      tempo: string;
    };
    placeholders: {
      title: string;
      author: string;
      key: string;
      tempo: string;
    };
    optionalHint: string;
    cancel: string;
    confirm: string;
    confirming: string;
  };
  errors: {
    invalidTxt: string;
    emptyTxt: string;
    chooseBeforeConvert: string;
    conversionFailedPrefix: string;
  };
}

const dictionary: Record<Language, Dictionary> = {
  es: {
    switchLabel: 'Idioma',
    modal: {
      badge: 'Previsualizar y editar',
      title: 'Editor grande de ChordPro',
      cancel: 'Cancelar',
      download: 'Descargar .cho',
      save: 'Guardar cambios',
      saving: 'Guardando...',
    },
    metadata: {
      badge: 'Detalles ChordPro',
      title: 'Añade información musical opcional',
      description:
        'Antes de generar el `.cho`, puedes completar datos básicos de la canción. Si los rellenas, se insertarán como directivas ChordPro al inicio del archivo.',
      fields: {
        title: 'Título',
        author: 'Autor',
        key: 'Tonalidad',
        tempo: 'Tempo',
      },
      placeholders: {
        title: 'Título de la canción',
        author: 'Autor o compositor',
        key: 'Ej. G, Am, F#m',
        tempo: 'Ej. 72, 120 BPM',
      },
      optionalHint: 'Todos los campos son opcionales.',
      cancel: 'Cancelar',
      confirm: 'Generar .cho',
      confirming: 'Generando...',
    },
    errors: {
      invalidTxt: 'Por favor sube un archivo `.txt` válido.',
      emptyTxt: 'El archivo TXT subido está vacío.',
      chooseBeforeConvert: 'Elige un archivo TXT antes de convertir.',
      conversionFailedPrefix: 'La conversión falló:',
    },
  },
  en: {
    switchLabel: 'Language',
    modal: {
      badge: 'Preview and edit',
      title: 'Large ChordPro editor',
      cancel: 'Cancel',
      download: 'Download .cho',
      save: 'Save changes',
      saving: 'Saving...',
    },
    metadata: {
      badge: 'ChordPro Details',
      title: 'Add optional music metadata',
      description:
        'Before generating the `.cho`, you can fill in a few basic song details. If provided, they will be inserted as ChordPro directives at the top of the file.',
      fields: {
        title: 'Title',
        author: 'Author',
        key: 'Key',
        tempo: 'Tempo',
      },
      placeholders: {
        title: 'Song title',
        author: 'Author or composer',
        key: 'e.g. G, Am, F#m',
        tempo: 'e.g. 72, 120 BPM',
      },
      optionalHint: 'All fields are optional.',
      cancel: 'Cancel',
      confirm: 'Generate .cho',
      confirming: 'Generating...',
    },
    errors: {
      invalidTxt: 'Please upload a valid `.txt` file.',
      emptyTxt: 'The uploaded TXT file is empty.',
      chooseBeforeConvert: 'Choose a TXT file before converting.',
      conversionFailedPrefix: 'Conversion failed:',
    },
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'es';
    }

    const saved = window.localStorage.getItem('app-language');
    return saved === 'en' ? 'en' : 'es';
  });

  useEffect(() => {
    window.localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: dictionary[language],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}

export function translateServerMessage(message: string, language: Language): string {
  const messages = dictionary[language].errors;

  if (message === 'Please upload a valid .txt file.') return messages.invalidTxt;
  if (message === 'The uploaded TXT file is empty.') return messages.emptyTxt;
  if (message === 'Choose a TXT file before converting.') return messages.chooseBeforeConvert;
  if (message.startsWith('Conversion failed:')) {
    return `${messages.conversionFailedPrefix} ${message.slice('Conversion failed:'.length).trim()}`.trim();
  }

  return message;
}
