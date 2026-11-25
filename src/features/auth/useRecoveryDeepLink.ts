import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { completeRecoveryFromLink } from './api';
import { parseRecoveryLink } from './deepLink';

/**
 * Dans l'APK, écoute l'ouverture du lien « Mot de passe oublié » reçu par e-mail (#88, ADR-0009) :
 * ouvre la session de récupération puis affiche l'écran « Nouveau mot de passe ».
 * Un lien expiré ou déjà utilisé affiche le message d'erreur existant de cet écran. Rien sur le web.
 */
export function useRecoveryDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const listener = App.addListener('appUrlOpen', async ({ url }) => {
      const link = parseRecoveryLink(url);
      if (!link || !active) return;
      if (link.kind === 'error') {
        navigate({ pathname: '/reset-password', hash: link.fragment });
        return;
      }
      const opened = await completeRecoveryFromLink(link);
      if (!active) return;
      navigate(
        opened
          ? '/reset-password'
          : { pathname: '/reset-password', hash: 'error=access_denied&error_code=otp_expired' },
      );
    });
    return () => {
      active = false;
      listener.then((l) => l.remove()).catch(() => undefined);
    };
  }, [navigate]);
}
