# CronCare 🌿

Application mobile d'accompagnement des patients atteints de la **maladie de Crohn** en Tunisie.
Issue d'un prototype Figma Make, transformée en application fonctionnelle avec gestion des accès par rôles (RBAC).

## Stack

| Couche | Technologie |
|---|---|
| Interface | React 18 + TypeScript + Vite + Tailwind CSS v4 |
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
git clone https://github.com/oussemaghanmi/app_mobile.git
cd app_mobile/frontend
npm ci
cp .env.example .env        # puis renseigner l'URL et la clé anon Supabase
npm run dev                 # http://localhost:5173
npm run check               # lint, format, i18n, RTL, typecheck, tests, build
```

### Base de données
- **Local avec Docker** : `supabase start` puis `supabase test db` (migrations + tests des règles d'accès).
- **Local sans Docker** : `scripts/test-db-local.sh` (PostgreSQL 16 + pgTAP).
- **Projet Supabase en ligne** : créer le projet sur [supabase.com](https://supabase.com), puis
  `supabase link` et `supabase db push` (applique `0001` et `0002`). Créer les comptes de test, puis adapter
  et exécuter `supabase/seed.sql` (rôles + affectations).

### Application Android
```bash
cd frontend
npm run cap:android         # build + sync + ouvre Android Studio (projet natif dans frontend/android)
```

## Structure

```
frontend/      application React + Capacitor (src/, android/)
supabase/      migrations/, tests/database/ (pgTAP), functions/, seed.sql
scripts/       contrôles i18n et RTL, tests SQL sans Docker
docs/          ARCHITECTURE.md, adr/, roadmap.md, known-debt.md, CONTRIBUTING.md
.github/       workflows CI/CD, modèles d'issue et de PR
```

Détail : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Avancement

- [x] Squelette, thème, navigation, i18n + RTL
- [x] Authentification + RBAC (front + RLS durci, prouvé par des tests pgTAP)
- [x] Écran d'accueil patient, paramètres, tableau de bord soignant
- [x] Socle du dépôt : outillage de qualité, pipeline CI/CD, documentation
- [ ] Socle front (design system, inscription, TanStack Query)
- [ ] Écrans patient : Ma maladie, Médicaments, Alimentation, Conseils, Communauté, Journal, Calendrier
- [ ] Rappels médicamenteux (Capacitor Local Notifications)
- [ ] Écrans prescription (médecin) et observations (infirmier)
- [ ] Assistant CrohnBot

Voir [`docs/roadmap.md`](docs/roadmap.md) et [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
