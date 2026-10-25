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

### Base de données
1. Créer un projet sur [supabase.com](https://supabase.com).
2. SQL Editor → exécuter `supabase/migrations/0001_init_rbac.sql`.
3. Créer les comptes de test, puis adapter et exécuter `supabase/seed.sql` (rôles + affectations).

### Application Android
```bash
npx cap add android         # une seule fois
npm run cap:android         # build + sync + ouvre Android Studio
```

## Structure

```
src/
  auth/        AuthProvider, garde de routes RequireRole, matrice des permissions
  i18n/        configuration + traductions fr / en / ar / tn
  screens/     écrans patient, soignant, paramètres
  components/  navigation, composants partagés
  figma/       code exporté de Figma Make (à migrer écran par écran)
supabase/
  migrations/  schéma + policies RLS
  seed.sql     données de démo
```

## Avancement

- [x] Squelette, thème, navigation, i18n + RTL
- [x] Authentification + RBAC (front + RLS)
- [x] Écran d'accueil patient (§1)
- [x] Paramètres : profil, langue, notifications, confidentialité, à propos (§2)
- [x] Tableau de bord médecin / infirmier (liste des patients affectés)
- [ ] Migration des écrans Figma : Ma maladie, Médicaments, Alimentation, Conseils, Communauté, Journal, Calendrier
- [ ] Rappels médicamenteux (Capacitor Local Notifications)
- [ ] Écrans prescription (médecin) et observations (infirmier)
- [ ] Assistant CrohnBot

Voir [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) pour le workflow Git.
