# ADR-0004 — Le LLM de CrohnBot est appelé uniquement via une Edge Function

**Statut :** Accepté

## Contexte
CrohnBot répond à des questions générales sur la maladie de Crohn en fr / en / ar / darija. Appeler
l'API Anthropic directement depuis l'application exposerait la clé API dans l'APK, empêcherait tout
quota et laisserait le client choisir le prompt système.

## Décision
L'application appelle une **Edge Function Supabase** `crohnbot` (Deno) qui :
1. vérifie le JWT de l'utilisateur ;
2. applique un quota de 30 messages par jour (`chatbot_usage`) ;
3. ajoute un **prompt système serveur** : information générale, jamais de diagnostic ni de modification
   de traitement, signes d'alerte → urgence / **190 (SAMU Tunisie)**, réponse dans la langue de
   l'utilisateur ;
4. n'envoie **que** le message et l'historique de la conversation, sans donnée de santé ni journal ;
5. lit `ANTHROPIC_API_KEY` et `CROHNBOT_MODEL` (Haiku récent par défaut) dans les secrets Supabase.

## Conséquences
- ✅ La clé API n'est jamais dans le client ni dans Git.
- ✅ Les coûts sont maîtrisés (quota, `max_tokens`, modèle léger) et le modèle se change sans
  republier l'APK.
- ✅ La surface d'injection de prompt est réduite : le modèle n'a ni outil ni accès aux données.
- ⚠️ La latence passe par un saut supplémentaire (Edge Function).
- ⚠️ Le contenu des réponses reste de l'information générale, à faire relire par l'équipe médicale.
