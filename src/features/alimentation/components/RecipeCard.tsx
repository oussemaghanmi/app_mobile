import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lines, localized, type Recipe } from '../types';

/** Carte recette repliable : image (ou emoji), résumé, ingrédients et étapes. */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const id = useId();
  const lang = i18n.language;
  const title = localized(recipe, 'title', lang);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {recipe.image_url && !imgError ? (
        <img
          src={recipe.image_url}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div aria-hidden className="flex h-24 items-center justify-center bg-sage/10 text-5xl">
          {recipe.emoji}
        </div>
      )}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-terracotta">
            {t(`nutrition.phase.${recipe.phase}`)}
          </span>
          {recipe.prep_minutes && (
            <span className="text-ink/60">⏱ {t('nutrition.minutes', { count: recipe.prep_minutes })}</span>
          )}
        </div>
        <h3 className="mt-1 text-lg">{title}</h3>
        <p className="text-sm text-ink/70">{localized(recipe, 'summary', lang)}</p>
        <button
          className="mt-2 min-h-11 text-sm font-medium text-sage-dark underline"
          aria-expanded={open}
          aria-controls={`${id}-details`}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? t('nutrition.hideRecipe') : t('nutrition.showRecipe')}
        </button>
        {open && (
          <div id={`${id}-details`} className="mt-2 flex flex-col gap-3">
            <div>
              <h4 className="font-medium">{t('nutrition.ingredients')}</h4>
              <ul className="list-disc ps-5 text-sm">
                {lines(localized(recipe, 'ingredients', lang)).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">{t('nutrition.steps')}</h4>
              <ol className="list-decimal ps-5 text-sm">
                {lines(localized(recipe, 'steps', lang)).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
