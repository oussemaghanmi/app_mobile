import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthProvider';
import * as api from '../api';
import {
  checkPermission,
  remindersSupported,
  requestPermission,
  type ReminderPermission,
} from '@/features/rappels/notifications';
import { applyLanguage, LANGUAGES, type LangCode } from '@/i18n';
import { todayInTunis } from '@/lib/dates';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

/** Paramètres — cahier des charges §2 */
export default function Settings() {
  const { t } = useTranslation();
  const { profile, refreshProfile, signOut } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [exportFailed, setExportFailed] = useState(false);
  const [permission, setPermission] = useState<ReminderPermission>('prompt');
  const [confirmAction, setConfirmAction] = useState<'journal' | 'account' | null>(null);
  useEffect(() => {
    checkPermission().then(setPermission, () => setPermission('unsupported'));
  }, []);
  if (!profile) return null;
  const reminderNote = !profile.notif_meds
    ? null
    : permission === 'unsupported'
      ? 'reminders.webOnly'
      : permission === 'denied'
        ? 'reminders.denied'
        : null;
  const isPatient = profile.role === 'patient';

  const update = async (fields: api.ProfileUpdate) => {
    try {
      await api.updateProfile(profile.id, fields);
      await refreshProfile();
      setMsg(t('settings.saved'));
    } catch {
      setMsg(t('common.error'));
    }
  };

  // Rappels : demande de permission à l'activation ; message si web ou permission refusée.
  const onToggle = async (field: 'notif_meds' | 'notif_community' | 'notif_tips', value: boolean) => {
    if (field === 'notif_meds' && value && remindersSupported()) {
      setPermission(await requestPermission());
    }
    await update({ [field]: value });
  };

  const changeLanguage = async (code: LangCode) => {
    await applyLanguage(code);
    await update({ language: code });
  };

  const exportData = async () => {
    setExportFailed(false);
    try {
      const dump = await api.exportMyData();
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `croncare-export-${todayInTunis()}.json`;
      a.click();
    } catch {
      setExportFailed(true);
    }
  };

  const deleteJournal = () => {
    setConfirmAction('journal');
  };

  const deleteAccount = () => {
    setConfirmAction('account');
  };

  const handleConfirmAction = async () => {
    if (confirmAction === 'journal') {
      await api.deleteJournals(profile.id);
      setMsg(t('settings.journalDeleted'));
    } else if (confirmAction === 'account') {
      if (await api.deleteMyAccount()) await signOut();
    }
    setConfirmAction(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl">{t('sections.settings')}</h1>
      {msg && (
        <p role="status" className="text-sm text-sage-dark">
          {msg}
        </p>
      )}

      <section className="card flex flex-col gap-2">
        <h2>{t('settings.profile')}</h2>
        <label className="text-sm">
          {t('settings.firstName')}
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label className="text-sm">
          {t('settings.lastName')}
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <button className="btn" onClick={() => update({ first_name: firstName, last_name: lastName })}>
          {t('settings.save')}
        </button>
      </section>

      <section className="card">
        <h2 className="mb-2">{t('settings.language')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLanguage(l.code)}
              aria-pressed={profile.language === l.code}
              className={`min-h-11 rounded-xl border px-3 py-2 ${profile.language === l.code ? 'border-sage bg-sage/10 font-bold' : 'border-black/10'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-2">
        <h2>{t('settings.notifications')}</h2>
        {(
          [
            ['notif_meds', 'notifMeds'],
            ['notif_community', 'notifCommunity'],
            ['notif_tips', 'notifTips'],
          ] as const
        ).map(([field, key]) => (
          <label key={field} className="flex min-h-11 items-center justify-between">
            {t(`settings.${key}`)}
            <input
              type="checkbox"
              className="h-5 w-5 accent-sage-dark"
              checked={profile[field]}
              onChange={(e) => onToggle(field, e.target.checked)}
            />
          </label>
        ))}
        {isPatient && reminderNote && <p className="text-sm text-ink/70">{t(reminderNote)}</p>}
      </section>

      {isPatient && (
        <section className="card flex flex-col gap-2">
          <h2>{t('settings.privacy')}</h2>
          <button className="btn-danger" onClick={deleteJournal}>
            {t('settings.deleteJournal')}
          </button>
          <button className="btn" onClick={exportData}>
            {t('settings.exportData')}
          </button>
          {exportFailed && (
            <p role="alert" className="text-sm text-terracotta-dark">
              {t('settings.exportError')}
            </p>
          )}
          <button className="btn-danger" onClick={deleteAccount}>
            {t('settings.deleteAccount')}
          </button>
        </section>
      )}

      <section className="card">
        <h2>{t('settings.about')}</h2>
        <p className="text-sm text-ink/70">{t('settings.aboutText')}</p>
      </section>

      <button className="btn-danger" onClick={signOut}>
        {t('settings.logout')}
      </button>

      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction === 'journal'
            ? t('settings.confirmDeleteJournalTitle')
            : t('settings.confirmDeleteAccountTitle')
        }
        description={
          confirmAction === 'journal'
            ? t('settings.confirmDeleteJournal')
            : t('settings.confirmDeleteAccount')
        }
        confirmLabel={confirmAction === 'journal' ? t('common.delete') : t('settings.deleteAccount')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
