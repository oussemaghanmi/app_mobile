import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Accordion } from '@/components/ui/Accordion';
import { EmergencyNotice, MedicalNotice } from '@/components/ui/MedicalNotice';
import { DISEASE_SECTIONS, type DiseaseTab } from '../content';

// TODO(validation-médicale) : l'ensemble des textes de disease.* (fichiers de langue) est un contenu
// éducatif général à faire relire par l'équipe soignante avant diffusion.

/** Écran « Ma maladie » : onglets d'information, cycle féminin, arrêt du tabac. */
export default function DiseaseScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<DiseaseTab>('understand');
  const section = DISEASE_SECTIONS[tab];

  return (
    <div className="flex flex-col gap-4 p-4">
      <ScreenHeader title={t('sections.disease')} subtitle={t('disease.subtitle')} />
      <MedicalNotice />

      <Tabs
        label={t('disease.tabsLabel')}
        active={tab}
        onChange={setTab}
        tabs={(Object.keys(DISEASE_SECTIONS) as DiseaseTab[]).map((key) => ({
          key,
          label: t(`disease.tabs.${key}`),
        }))}
      >
        <article className="flex flex-col gap-3">
          {section.blocks.map((block) => (
            <section key={block} className="card">
              <h2 className="mb-1 text-lg">{t(`disease.${tab}.${block}.title`)}</h2>
              <p className="leading-relaxed text-ink/80">{t(`disease.${tab}.${block}.text`)}</p>
            </section>
          ))}
          {section.emergency && <EmergencyNotice />}
        </article>
      </Tabs>

      <h2 className="mt-2 text-xl">{t('disease.more')}</h2>

      <Accordion icon="🌸" title={t('disease.cycle.title')}>
        <div className="flex flex-col gap-3 text-ink/80">
          {(['menstruation', 'contraception', 'pregnancy', 'journal'] as const).map((k) => (
            <div key={k}>
              <h4 className="font-medium text-ink">{t(`disease.cycle.${k}.title`)}</h4>
              <p className="leading-relaxed">{t(`disease.cycle.${k}.text`)}</p>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion icon="🚭" title={t('disease.tobacco.title')} highlight>
        <div className="flex flex-col gap-3 text-ink/80">
          {(['why', 'benefits', 'shisha', 'help'] as const).map((k) => (
            <div key={k}>
              <h4 className="font-medium text-ink">{t(`disease.tobacco.${k}.title`)}</h4>
              <p className="leading-relaxed">{t(`disease.tobacco.${k}.text`)}</p>
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  );
}
