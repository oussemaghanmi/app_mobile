import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { applyLanguage, LANGUAGES, type LangCode } from '@/i18n';

/** Paramètres — cahier des charges §2 */
export default function Settings() {
  const { t } = useTranslation();
  const { profile, refreshProfile, signOut } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  if (!profile) return null;
  const isPatient = profile.role === 'patient';

  const update = async (fields: Record<string, unknown>) => {
    const { error } = await supabase.from('profiles').update(fields).eq('id', profile.id);
    if (!error) { await refreshProfile(); setMsg(t('settings.saved')); }
  };

  const changeLanguage = async (code: LangCode) => {
    await applyLanguage(code);
    await update({ language: code });
  };

  const exportData = async () => {
    const tables = ['profiles', 'prescriptions', 'medication_intakes', 'mood_logs', 'symptom_logs', 'private_journal'];
    const dump: Record<string, unknown> = {};
    for (const tb of tables) {
      const col = tb === 'profiles' ? 'id' : 'patient_id';
      dump[tb] = (await supabase.from(tb).select('*').eq(col, profile.id)).data;
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `croncare-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const deleteJournal = async () => {
    if (!confirm(t('settings.confirm'))) return;
    await supabase.from('private_journal').delete().eq('patient_id', profile.id);
    await supabase.from('symptom_logs').delete().eq('patient_id', profile.id);
  };

  const deleteAccount = async () => {
    if (!confirm(t('settings.confirm'))) return;
    const { error } = await supabase.rpc('delete_my_account');
    if (!error) await signOut();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl">{t('sections.settings')}</h1>
      {msg && <p role="status" className="text-sm text-sage-dark">{msg}</p>}

      <section className="card flex flex-col gap-2">
        <h2>{t('settings.profile')}</h2>
        <label className="text-sm">{t('settings.firstName')}
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
        <label className="text-sm">{t('settings.lastName')}
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
        <button className="btn" onClick={() => update({ first_name: firstName, last_name: lastName })}>
          {t('settings.save')}</button>
      </section>

      <section className="card">
        <h2 className="mb-2">{t('settings.language')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => changeLanguage(l.code)}
              className={`rounded-xl border px-3 py-2 ${profile.language === l.code ? 'border-sage bg-sage/10 font-bold' : 'border-black/10'}`}>
              {l.label}</button>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-2">
        <h2>{t('settings.notifications')}</h2>
        {([['notif_meds', 'notifMeds'], ['notif_community', 'notifCommunity'], ['notif_tips', 'notifTips']] as const).map(([field, key]) => (
          <label key={field} className="flex items-center justify-between">
            {t(`settings.${key}`)}
            <input type="checkbox" className="h-5 w-5 accent-sage" checked={profile[field]}
              onChange={(e) => update({ [field]: e.target.checked })} />
          </label>
        ))}
      </section>

      {isPatient && (
        <section className="card flex flex-col gap-2">
          <h2>{t('settings.privacy')}</h2>
          <button className="btn-danger" onClick={deleteJournal}>{t('settings.deleteJournal')}</button>
          <button className="btn" onClick={exportData}>{t('settings.exportData')}</button>
          <button className="btn-danger" onClick={deleteAccount}>{t('settings.deleteAccount')}</button>
        </section>
      )}

      <section className="card">
        <h2>{t('settings.about')}</h2>
        <p className="text-sm text-ink/70">{t('settings.aboutText')}</p>
      </section>

      <button className="btn-danger" onClick={signOut}>{t('settings.logout')}</button>
    </div>
  );
}
