# CronCare 🌿

Application mobile d'accompagnement des patients atteints de la **maladie de Crohn** en Tunisie.
Issue d'un prototype Figma Make, transformée en application fonctionnelle avec gestion des accès par rôles (RBAC).

## Stack

| Couche | Technologie |
|---|---|
| Interface | React 18 + TypeScript + Vite + Tailwind CSS v4 (code repris de Figma Make) |
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
npm run db:test             # tests RLS (pgTAP)
npm run db:types            # régénère les types TypeScript après une migration
```

### Base de données hébergée
1. Créer un projet sur [supabase.com](https://supabase.com).
2. `npx supabase link --project-ref <ref>` puis `npx supabase db push` (applique `supabase/migrations/`).
3. Créer les comptes de test, puis adapter et exécuter `supabase/seed.sql` (rôles + affectations).

### Application Android
```bash
npx cap add android         # une seule fois
npm run cap:android         # build + sync + ouvre Android Studio
```

## Structure

```
src/
  features/<nom>/  écrans d'une fonctionnalité : components/, api.ts, hooks.ts, types.ts
  components/      navigation, composants partagés
  lib/             client Supabase typé, types générés, gestion d'erreurs
  i18n/            configuration + traductions fr / en / ar / tn
  figma/           code exporté de Figma Make (à migrer écran par écran)
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
- [ ] Pipeline CI/CD (qualité, base, secrets, APK, déploiement Supabase)
- [ ] Génération des prises médicamenteuses + bouton « Pris »
- [ ] Migration des écrans Figma : Ma maladie, Médicaments, Alimentation, Conseils, Communauté, Journal, Calendrier
- [ ] Rappels médicamenteux (Capacitor Local Notifications)
- [ ] Écrans prescription (médecin) et observations (infirmier)
- [ ] Assistant CrohnBot

Voir [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) pour le workflow Git.
