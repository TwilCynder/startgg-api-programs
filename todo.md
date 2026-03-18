## Small things

- Bouger la fonction de calcul de SPR dans sgg helper
- Finir le système de game dans upsetcontest (système, à généraliser, où on peut passer soit un fichier soit un slug + dossier)
- Multi-output : pouvoir sortir à la fois du JSON et csv (genre --output-json & --output-csv, utilsier un array de formats avec un Parser custom)
- Généraliser l'utilisation de tryReadJSONArray
- Généraliser l'utilsation du saveManager (à partir de downloadSetsFromEventsBare)
  - Commencer par propager aux autres downloadSetsFromEvents, puis aux autres downloads
- Généraliser l'utilisation de columns()
- Généraliser l'utilisation du ClientManager
- Généraliser l'utilisation du output fragment quand pertinent (juste passer le paramètre aux fonctions output quand on sort un tableau)
  - Supporter directement les * (ou équivalent) dans les input filename, avec fs.glob()
- Généraliser le système de format string (voir --line-format)
- Utiliser (ou au moins supporter) la version Bare des données pour les scripts genre standingComparison, leagueHead2Head, globalement tous ceux qui supportent un "users file", vu qu'avec un users file fetch le gamerTag à chaque fois c'est redondant (et coûteux)
- Implémenter un QueryManager, avec un tryLoad, pour les fonctions qui peuvent utiliser plusieurs queries *ou pas*
- Ajouter le système de gestion de game content à sgg-helper (et pk pas la finalisation de dates)
- Faire un package NPM
- généraliser le système de --display de leaguehead2head, pour utiliser uniquement la partie transformation en texte d'un script
- Utiliser selections.character instead of selectionValue
- permettre à namesearchusers de sortir un JSON -> database globale ?
- système de cache pour les infos des jeux
- Généraliser l'utilisation de extract slugs (events, users, jeux)
- généraliser l'utilisation de columns et yellow
- Trouver un moyen de factoriser les getXXX qui font des trucs simples
- généraliser l'utilisation de readMultimodalArrayInput
- potetre : moderniser getEventResults
- Faire la version de leaguehead2head qui prend des dates
- Infos + approfondies sur qui joue les persos
- Harmoniser le comportement si un event/user n'est pas trouvé 
  - A priori suivre getEntrantsCount.js
- readme (en cours)
- ajouter un mode users à stagesStats
- ajouter un système de range à runContest

## Big refactor
- Implement my own data format : transform object structure as soon as data is downloaded (directly in the get* scripts)
- Ne plus utiliser user.id, j'ai le slug pour ça, si je veux un ID c'est le player.id