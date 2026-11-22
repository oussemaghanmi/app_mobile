# Administration : rôles, affectations et modération

Un compte créé dans l'application est **toujours un patient** (trigger `handle_new_user`). Pour qu'une personne
soit médecin ou infirmier, puis suive des patients, l'administration utilise trois fonctions SQL
(migration `0012_administration.sql`). Elles sont **réservées à l'administration** : l'application, un patient,
un médecin ou un visiteur ne peuvent pas les appeler (testé dans `supabase/tests/administration.test.sql`).

## Où les lancer
- **Supabase Dashboard → SQL Editor** (le plus simple : il s'exécute avec le rôle propriétaire du projet).
- Ou avec le rôle `service_role`, depuis un script d'administration. **La clé `service_role` ne va jamais dans
  l'application, dans Git ni dans un chat** (règle 3 de `CLAUDE.md`).

## Procédure : créer un soignant et l'affecter à un patient
1. La personne crée son compte (écran d'inscription) ou vous l'ajoutez dans **Authentication → Users → Add user**.
2. Retrouvez les identifiants :
   ```sql
   select id, email from auth.users order by created_at desc;
   ```
3. Donnez-lui son rôle :
   ```sql
   select public.admin_set_role('<uuid du compte>', 'doctor');   -- ou 'nurse'
   ```
4. Affectez-la à un patient :
   ```sql
   select public.admin_assign('<uuid du patient>', '<uuid du soignant>');
   ```
5. Vérifiez :
   ```sql
   select p.first_name as patient, s.first_name as soignant, s.role
   from public.care_assignments a
   join public.profiles p on p.id = a.patient_id
   join public.profiles s on s.id = a.professional_id
   order by 1, 2;
   ```
   Le soignant voit alors ce patient dans « Mes patients » ; un soignant non affecté ne le voit pas.

## Autres opérations
```sql
select public.admin_unassign('<uuid du patient>', '<uuid du soignant>');   -- retirer une affectation
select public.admin_set_role('<uuid>', 'nurse');                            -- changer médecin <-> infirmier
```

## Règles et erreurs
| Fonction | Refuse | Message |
|---|---|---|
| `admin_set_role(user, role)` | compte inconnu ; passer en `patient` un compte affecté à des patients ; passer en soignant un compte suivi par des soignants | « compte inconnu », « retirer ses affectations (admin_unassign) d'abord » |
| `admin_assign(patient, professional)` | patient ou soignant inconnu ; « patient » qui n'a pas le rôle patient ; « soignant » qui n'est ni médecin ni infirmier | « n'a pas le rôle patient », « n'est ni médecin ni infirmier » |
| `admin_unassign(patient, professional)` | rien (sans effet si l'affectation n'existe pas) | — |

`admin_assign` est idempotente : la relancer ne crée pas de doublon. Les données existantes (prescriptions,
observations) sont conservées quand on change un rôle ou retire une affectation ; seul l'**accès** change :
`is_assigned_to` ne compte que les affectations vers un compte qui est réellement médecin ou infirmier.

## Modération de la communauté
**Règle** : dès **3 signalements** de personnes différentes, une publication ou un commentaire est **masqué
automatiquement** (déclencheur `auto_hide_reported`, migration 0006) ; son auteur le voit toujours, les autres non.
La **modération humaine tranche ensuite** avec trois fonctions (migration `0014_moderation.sql`), réservées à
l'administration comme les précédentes (testé dans `supabase/tests/moderation.test.sql`).

1. **Lister les contenus signalés** (le plus récemment signalé d'abord) :
   ```sql
   select * from public.admin_list_reports();
   ```
   Colonnes : `kind` (`post` ou `comment`), `content_id`, `content`, `hidden`, `author_pseudonym`, `reason`
   (motifs distincts), `report_count`, `last_reported_at`. Les personnes qui signalent restent **anonymes** et
   l'auteur n'apparaît que sous son **pseudonyme**.
2. **Remettre en ligne** un contenu masqué à tort (efface aussi ses signalements, pour qu'un nouveau signalement
   ne le masque pas aussitôt) :
   ```sql
   select public.admin_restore_content('post', '<content_id>');     -- ou 'comment'
   ```
3. **Supprimer** un contenu abusif (définitif : ses signalements et, pour une publication, ses commentaires
   partent avec lui) :
   ```sql
   select public.admin_remove_content('comment', '<content_id>');   -- ou 'post'
   ```

| Fonction | Refuse | Message |
|---|---|---|
| `admin_restore_content(kind, id)` / `admin_remove_content(kind, id)` | `kind` autre que `post` ou `comment` ; contenu inconnu | « type inconnu », « publication inconnue », « commentaire inconnu » |

La modération ne juge pas le contenu médical : en cas de doute sur une information de santé, demander l'avis de
l'équipe soignante avant de restaurer.

## Environnement local
`supabase start` puis `npm run db:reset` rejouent les migrations et `supabase/seed.sql`. Les mêmes fonctions
s'utilisent dans le SQL Editor local (Studio, http://localhost:54323).
