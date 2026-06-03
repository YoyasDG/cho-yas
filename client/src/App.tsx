import { Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './lib/i18n';
import { ConvertPage } from './routes/ConvertPage';
import { LandingPage } from './routes/LandingPage';

export function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/convert" element={<ConvertPage />} />
      </Routes>
    </LanguageProvider>
  );
}
