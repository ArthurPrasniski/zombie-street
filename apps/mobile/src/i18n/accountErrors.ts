import { language } from './locale';

const messages = {
  pt: { google: 'O login Google está indisponível nesta versão do app (código 10).', http: (status: number) => `Não foi possível entrar. O servidor respondeu com código ${status}.`, native: (code: string) => `Não foi possível entrar (código ${code}).` },
  en: { google: 'Google sign-in is unavailable in this app version (code 10).', http: (status: number) => `Could not sign in. The server returned code ${status}.`, native: (code: string) => `Could not sign in (code ${code}).` },
  es: { google: 'El acceso con Google no está disponible en esta versión (código 10).', http: (status: number) => `No se pudo iniciar sesión. El servidor respondió con código ${status}.`, native: (code: string) => `No se pudo iniciar sesión (código ${code}).` },
};

export const accountErrors = new Proxy({} as typeof messages.pt, { get: (_target, key) => messages[language][key as keyof typeof messages.pt] });
