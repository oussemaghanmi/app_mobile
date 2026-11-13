/**
 * Structure du contenu éducatif « Ma maladie ». Les textes sont dans les fichiers de langue
 * (clés disease.<onglet>.<bloc>.title / .text) — TODO(validation-médicale).
 */
export const DISEASE_SECTIONS = {
  understand: { blocks: ['what', 'where', 'course', 'causes'], emergency: false },
  symptoms: { blocks: ['digestive', 'general', 'extra'], emergency: true },
  treatments: { blocks: ['goals', 'families', 'surgery', 'adherence'], emergency: false },
  living: { blocks: ['followup', 'food', 'activity', 'mind'], emergency: false },
} as const;

export type DiseaseTab = keyof typeof DISEASE_SECTIONS;
