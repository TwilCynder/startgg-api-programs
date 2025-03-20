## Gestion de la sortie
Paramètres : silent, printdata, logdata, outputfile

- Dans tous les cas, on est silencieux (silent_) si silent est spécifié mais aussi si printdata l'est
- Pour un script qui peut sortir que des data en JSON
    - addOutputParamsJSON
    - outputJSON
    - 
        ```js
        printdata = printdata || !outputfile;
        let silent_ = isSilent(printdata, silent)
        ```
- Pour un script qui peut sortir des data en JSON ou csv (et peut aussi log)
    - addOutputParams
    - output
    - doweLog
- Pour un script qui peut sortir des data en JSON ou csv (pas de log)
    - addOutputParamsCustom(false, true)
    - output
        ```js
        printdata = printdata || !outputfile;
        let silent_ = isSilent(printdata, silent); 
        ```
- Pour un script qui ne peut pas sortir de data, que du texte, qu'il peut log
    - addOutputParamsText
    - outputText[Lazy]
    - doWeLog
- Pour un script qui ne peut pas sortir de data, que du texte sans log
    - addOutputParamsBasic
    - outputText[Lazy]
    -   
        ```js
        printdata = printdata || !outputfile;
        let silent_ = isSilent(printdata, silent) 
        ```