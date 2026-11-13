import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Tabs } from '@/components/ui/Tabs';
import { MedicalNotice } from '@/components/ui/MedicalNotice';
import { AsyncView } from '@/components/AsyncView';
import { useRecipes, useStores } from '../hooks';
import type { RecipePhase } from '../types';
import { RecipeCard } from './RecipeCard';
import { StoresMap } from './StoresMap';

type Tab = 'recipes' | 'foods' | 'stores';
type Filter = 'all' | Exclude<RecipePhase, 'all'>;

// TODO(validation-médicale) : textes nutrition.foods.* et recettes à faire relire (diététique).
const FOOD_GROUPS = ['flareOften', 'flareLimit', 'remission', 'hydration'] as const;

/** Écran Alimentation : recettes, repères alimentaires, carte des magasins. */
export default function NutritionScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('recipes');
  const [filter, setFilter] = useState<Filter>('all');
  const recipes = useRecipes();
  const stores = useStores();

  return (
    <div className="flex flex-col gap-4 p-4">
      <ScreenHeader title={t('nutrition.title')} subtitle={t('nutrition.subtitle')} />
      <Tabs
        label={t('nutrition.tabsLabel')}
        active={tab}
        onChange={setTab}
        tabs={(['recipes', 'foods', 'stores'] as Tab[]).map((key) => ({
          key,
          label: t(`nutrition.tabs.${key}`),
        }))}
      >
        {tab === 'recipes' && (
          <div className="flex flex-col gap-3">
            <div role="group" aria-label={t('nutrition.filterLabel')} className="flex flex-wrap gap-2">
              {(['all', 'flare', 'remission'] as Filter[]).map((f) => (
                <button
                  key={f}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`min-h-11 rounded-full border px-4 text-sm ${
                    filter === f
                      ? 'border-sage bg-sage/10 font-bold text-sage-dark'
                      : 'border-black/10 bg-white'
                  }`}
                >
                  {t(`nutrition.filter.${f}`)}
                </button>
              ))}
            </div>
            <AsyncView state={recipes} isEmpty={(l) => l.length === 0} empty={t('nutrition.noRecipe')}>
              {(list) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  {list
                    .filter((r) => filter === 'all' || r.phase === filter || r.phase === 'all')
                    .map((r) => (
                      <RecipeCard key={r.id} recipe={r} />
                    ))}
                </div>
              )}
            </AsyncView>
          </div>
        )}

        {tab === 'foods' && (
          <div className="flex flex-col gap-3">
            <MedicalNotice />
            {FOOD_GROUPS.map((g) => (
              <section key={g} className="card">
                <h2 className="text-lg">{t(`nutrition.foods.${g}.title`)}</h2>
                <p className="leading-relaxed text-ink/80">{t(`nutrition.foods.${g}.text`)}</p>
              </section>
            ))}
          </div>
        )}

        {tab === 'stores' && (
          <AsyncView state={stores} isEmpty={(l) => l.length === 0} empty={t('nutrition.noStore')}>
            {(list) => <StoresMap stores={list} />}
          </AsyncView>
        )}
      </Tabs>
    </div>
  );
}
