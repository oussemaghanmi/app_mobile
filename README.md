# CronCare 🌿

Application mobile d'accompagnement des patients atteints de la **maladie de Crohn** en Tunisie.
Issue d'un prototype Figma Make, réalisée en application fonctionnelle avec gestion des accès par rôles (RBAC).

## Stack

| Couche | Technologie |
|---|---|
| Interface | React 18 + TypeScript + Vite + Tailwind CSS v4 (design défini dans le code, voir `docs/DESIGN.md`) |
| Mobile | Capacitor 7 (Android / iOS) |
| Backend | Supabase — Auth, PostgreSQL, Row Level Security |
| Langues | Français, Anglais, Arabe, Darija tunisienne (RTL géré automatiquement) |

## Rôles et permissions

| Rôle | Peut | Ne peut pas |
|---|---|---|
| **Patient** | voir ses médicaments et rappels, noter symptômes/humeur, journal privé, contenu éducatif, exporter/supprimer ses données | modifier une prescription |
| **Médecin** | voir les dossiers de **ses patients affectés**, créer/modifier des prescriptions | voir le journal privé, voir d'autres patients |
| **Infirmier** | voir les infos utiles de ses patients affectés, rédiger des observations infirmières | prescrire, voir le journal privé |

La sécurité est appliquée **dans la base** (policies RLS dans `supabase/migrations/`), pas seulement dans l'interface :
même avec un client modifié, un patient ne peut lire que ses propres données.

## Démarrage

```bash
git clone https://github.com/<ton-compte>/croncare.git
cd croncare
npm install
cp .env.example .env        # puis renseigner l'URL et la clé anon Supabase
npm run dev                 # http://localhost:5173
```

### Base de données locale (recommandé)
Prérequis : Docker.
```bash
npm run db:start            # lance Supabase en local, affiche l'URL et la clé anon à mettre dans .env
npm run db:reset            # rejoue toutes les migrations + supabase/seed.sql
npm run db:test             # tests RLS (pgTAP), avec Docker
./scripts/test-db-local.sh  # mêmes tests sans Docker (PostgreSQL 16 + pgTAP)
npm run db:types            # régénère les types TypeScript après une migration
```

### Base de données hébergée
1. Créer un projet sur [supabase.com](https://supabase.com).
2. `npx supabase link --project-ref <ref>` puis `npx supabase db push` (applique `supabase/migrations/`).
3. Créer les comptes de test, puis adapter et exécuter `supabase/seed.sql` (rôles + affectations).

### Assistant CrohnBot (Edge Function)
La clé de l'API Claude reste **côté serveur**, dans les secrets Supabase : elle n'est jamais dans l'application ni dans Git.
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref <ref>
npx supabase secrets set CROHNBOT_MODEL=claude-haiku-5-5 --project-ref <ref>   # optionnel (valeur par défaut)
npx supabase functions deploy crohnbot --project-ref <ref>                     # fait aussi par deploy-supabase.yml
```
Limites : 30 messages par utilisateur et par jour (`chatbot_usage`). Seule la conversation est envoyée au modèle :
aucune donnée de santé, jamais le journal privé. Les signes d'alerte renvoient vers le **190 (SAMU)**.

### Tests de bout en bout (Playwright)
Ils parcourent l'application réelle contre Supabase local : connexion, accès par rôle, prise cochée, journal privé
invisible pour l'équipe soignante. Le jeu de données (patientes, médecin, infirmière, affectations) est créé par
`e2e/fixtures.ts` avec les fonctions d'administration de la migration `0012`.
```bash
supabase start                               # Docker requis
eval "$(supabase status -o env)"             # définit ANON_KEY, SERVICE_ROLE_KEY, API_URL
export E2E_ANON_KEY="$ANON_KEY" E2E_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" E2E_SUPABASE_URL="$API_URL"
npx playwright install chromium              # une seule fois
npm run e2e
```
Les clés ci-dessus sont celles de la base **locale** ; la clé `service_role` d'un vrai projet n'est jamais utilisée ici.
Le workflow `e2e.yml` rejoue ces tests à chaque PR.

### Application Android
```bash
npm run cap:android         # build + sync + ouvre Android Studio
```

### Application iOS (macOS + Xcode, voir [`docs/IOS.md`](docs/IOS.md))
```bash
npm run cap:ios             # build + sync + ouvre Xcode
```

## Structure

```
src/
  features/<nom>/  écrans d'une fonctionnalité : components/, api.ts, hooks.ts, types.ts
  components/      navigation, composants partagés
  lib/             client Supabase typé, types générés, gestion d'erreurs
  i18n/            configuration + traductions fr / en / ar / tn
supabase/
  migrations/      schéma + policies RLS
  tests/           tests pgTAP des policies
  seed.sql         données de démo
docs/
  ARCHITECTURE.md  vue d'ensemble, modèle de données, matrice RBAC, séquences, menaces
  adr/             décisions d'architecture
```

## Qualité

```bash
npm run lint && npm run typecheck && npm run check:i18n && npm test && npm run build
```

## Avancement

- [x] Squelette, thème, navigation, i18n + RTL
- [x] Authentification + RBAC (front + RLS)
- [x] Écran d'accueil patient (§1)
- [x] Paramètres : profil, langue, notifications, confidentialité, à propos (§2)
- [x] Tableau de bord médecin / infirmier (liste des patients affectés)
- [x] Architecture documentée, ADR, outillage qualité (ESLint, Prettier, Vitest), tests RLS pgTAP
- [x] Pipeline CI/CD (qualité, base, secrets, APK, déploiement Supabase) — voir [`docs/PIPELINE.md`](docs/PIPELINE.md)
- [x] Génération des prises médicamenteuses + bouton « Pris »
- [x] Écrans patient : Ma maladie, Médicaments, Alimentation, Conseils, Communauté, Journal, Calendrier
- [x] Rappels médicamenteux (Capacitor Local Notifications)
- [x] Fiche patient, prescriptions (médecin) et observations (infirmier)
- [x] Assistant CrohnBot (Edge Function + écran de chat)

Voir [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) pour le workflow Git.
Pour créer des médecins et infirmiers et les affecter à des patients : [`docs/ADMIN.md`](docs/ADMIN.md).
Mise en ligne et première version (tâches de la propriétaire) : [`docs/MISE-EN-PRODUCTION.md`](docs/MISE-EN-PRODUCTION.md).
