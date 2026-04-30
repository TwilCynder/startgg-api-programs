## Small things

- Généraliser l'utilisation de tryReadJSONArray
- Généraliser l'utilsation du saveManager (à partir de downloadSetsFromEventsBare)
  - Commencer par propager aux autres downloadSetsFromEvents, puis aux autres downloads
- Généraliser l'utilisation de columns()
- Généraliser l'utilisation du ClientManager
- Supporter directement les * (ou équivalent) dans les input filename, avec fs.glob()
- Généraliser le système de format string (voir --line-format)
- Utiliser (ou au moins supporter) la version Bare des données pour les scripts genre standingComparison, leagueHead2Head, globalement tous ceux qui supportent un "users file", vu qu'avec un users file fetch le gamerTag à chaque fois c'est redondant (et coûteux)
- Implémenter un QueryManager, avec un tryLoad, pour les fonctions qui peuvent utiliser plusieurs queries *ou pas*
- Ajouter le système de gestion de game content à sgg-helper
- Faire un package NPM
- généraliser le système de --display de leaguehead2head, pour utiliser uniquement la partie transformation en texte d'un script
- Utiliser selections.character instead of selectionValue
- permettre à namesearchusers de sortir un JSON -> database globale ?
- système de cache pour les infos des jeux
- Généraliser l'utilisation de extract slugs (events, users, jeux)
- généraliser l'utilisation de columns et yellow
- Trouver un moyen de factoriser les getXXX qui font des trucs simples
- potetre : moderniser getEventResults
- Faire la version de leaguehead2head qui prend des dates
  - Utiliser les set ID pour éviter de process le mm set 2 fois
- Infos + approfondies sur qui joue les persos
- Harmoniser le comportement si un event/user n'est pas trouvé 
  - A priori suivre getEntrantsCount.js
- readme (en cours)
- ajouter un mode users à stagesStats
- ajouter un système de range à runContest

## Big refactor
- Implement my own data format : transform object structure as soon as data is downloaded (directly in the get* scripts)
  - Pour les users, utiliser la structure de User 
  - Pour les entrants (dans les standings/entrants list/sets) pas bcp de changement finalement, juste créer des fonctions qui récup les [0] en partant du principe que c'est du single
  - Pour les sets, voir rankingLopraz
- Ne plus utiliser user.id, j'ai le slug pour ça, si je veux un ID c'est le player.id