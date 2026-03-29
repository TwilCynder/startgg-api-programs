## Gestion de la sortie
Les scripts utilisent tous un argument allArgs, sauf ceux qui ne sortent que du plain text.

Gestion des **paramètres** (ArgumentsManager) :
- Texte only, pas de log : `addOutputParamsBasic`
- Texte avec log : `addOutputParamsText`
- JSON only  : `addOutputParamsJSON`
- JSON & texte (pas de log) : `addOutputParamsCustomNoLog`
- JSON & texte avec log : `addOutputParams`

Gestion du `silent` et du `logdata`:
- Script sans log : `doWePrintFromArgs`
  ```js
  let silent = doWePrintFromArgs(allArgs);
  ```
- Script avec log : `doWeLogFromArgs`
  ```js
  let [logdata, silent] = doWeLogFromArgs(allArgs);
  ```

Gestion de la **sortie** : 
- Si le script ne sort que du texte : `outputTextLazy`
- Si le script ne sort que du JSON : `outputJSONfromArgs`
- Si le script sort JSON et texte : `outputFromArgs`