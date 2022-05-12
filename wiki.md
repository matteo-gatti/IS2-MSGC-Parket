# Parket - The Park Market by MSGC team

## Team Members

| Nome e cognome | E-mail                             | Matricola | Github |
|----------------|----------------------------------|-----------|--------|
| Matteo Merler  | matteo.merler@studenti.unitn.it  | 209652    | [Merlo17](https://github.com/Merlo17)       | 
| Eric Suardi    | eric.suardi@studenti.unitn.it    | 209789    | [ericsua](https://github.com/ericsua)       |
| Matteo Gatti   | matteo.gatti-1@studenti.unitn.it | 209649    | [matteo-gatti](https://github.com/matteo-gatti)       |
| Matteo Circa   | matteo.circa@studenti.unitn.it   | 209414    | [matteo-crypto](https://github.com/matteo-crypto)

## Project idea

Parket è un servizio che permette di risparmiare tempo e denaro fornendo ai propri utenti una piattaforma per affittare e prenotare parcheggi privati messi a disposizione da altri utenti del servizio.

L’applicazione vuole incentivare la condivisione di spazi di parcheggio privati che altrimenti rimarrebbero inutilizzati, come accade di frequente nelle grandi città. Il servizio riesce così a facilitare la mobilità degli utenti, che possono viaggiare in tutta tranquillità avendo il posto auto già riservato alla loro destinazione per tutto il tempo necessario.

Se un utente possiede un posto auto libero durante certe fasce orarie, può renderlo disponibile attraverso il servizio Parket, proponendo una propria tariffa.

L’utente che usufruisce del servizio ha poi la possibilità di cercare tra tutte le inserzioni messe a disposizione dai venditori della community, filtrando tra varie caratteristiche del parcheggio, come luogo, tariffa, dimensioni ed altro, per trovare così il parcheggio più adatto alle proprie esigenze.

Una volta trovato il posto migliore l’utente procede alla prenotazione, paga in tutta sicurezza e viene messo in contatto col venditore. 

Sia il venditore che l’utente guadagnano dallo scambio: all’utente non rimane che guidare verso la destinazione e parcheggiare la sua auto, magari ottenendo un prezzo più vantaggioso, mentre il venditore tiene occupato il suo posto, altrimenti inutilizzato, e guadagna.

## Links

- [GitHub Repository](https://github.com/matteo-gatti/IS2-MSGC-Parket)
- [Apiary]()
- [Heroku]()
- [Product Backlog, Sprint Backlog e testing](https://docs.google.com/spreadsheets/d/1bqKRvdunvmjixEgWJgimxz3Xa-UgzyNs37BKlpah3S0/edit?usp=sharing)
- [Sprint #1](https://docs.google.com/spreadsheets/d/1bqKRvdunvmjixEgWJgimxz3Xa-UgzyNs37BKlpah3S0/edit#gid=1222619547&range=A1)
- [Sprint #2](https://docs.google.com/spreadsheets/d/1bqKRvdunvmjixEgWJgimxz3Xa-UgzyNs37BKlpah3S0/edit#gid=58057294&range=A1)
- [Testing](https://docs.google.com/spreadsheets/d/1bqKRvdunvmjixEgWJgimxz3Xa-UgzyNs37BKlpah3S0/edit#gid=1452048687&range=A1)

## Archittettura


<style>
th {
   border: none!important;
}
</style>

| Componente | Strumenti utilizzati|
|-|-|
| Backend   | TypeScript, Node.js (express, ...), Mongoose |
| Frontend  | Vue.js fatto da [matteo-gatti](https://github.com/matteo-crypto) |
| Database  | MongoDB |
| Documentazione  | Apiary |
| CI/CD  | Travis CI / Heroku |



## Organizzazione repository

Nella repository del progetto si trova sia il codice per il backend che il codice del frontend. Il codice del frontend (sviluppato in ...) si trova all'interno della cartella ... mentre il codice delle api (sviluppato in ...) si trova all'interno della cartella ...

### Schema della repository WIP

```
IS2-MSGC-Parket/
├── README.md
└── wiki.md
```

## Strategia di Branching

Abbiamo deciso di utilizzare la strategia: 

[Gitflow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
![Gitflow Workflow](https://wac-cdn.atlassian.com/dam/jcr:cc0b526e-adb7-4d45-874e-9bcea9898b4a/04%20Hotfix%20branches.svg?cdnVersion=343 "GitFlow Workflow (prova a dirlo 5 volte di fila)")


## Definition of "done"

Abbiamo deciso di definire "done" come:

- Il codice rispetta le buone norme della programmazione
- Il codice è commentato adeguatamente
- Il codice è stato testato dallo sviluppatore ed è funzionante
- Il codice è stato revisionato insieme ad almeno un altro membro del team
- La documentazione è stata scritta ed è comprensiva di tutte le feature del codice
- La documentazione è stata revisionata da almeno un altro membro del team
- Le API sono associate ad URL trasparenti, che rispecchiano chiaramente le loro funzioni

# Sprint #1

Ogni componente del gruppo è stato libero di scegliere una task a sua scelta, di idearla, progettarla e poi successivamente svilupparla. Una volta ultimata viene condivisa a tutto il team in modo da perfezionarla o magari per modificarne alcune parti che non sono ritenute corrette. Ogni membro del team è libero di suggerire idee o modifiche a parti di codice scritte da altri componenti, con lo scopo di migliorare il più possibile il risultato finale. Per i meeting e daily standup di gruppo è stata preferita, invece che Slack, la piattaforma Discord per il team working. 

Le parti più complesse come ad esempio l'autenticazione, il deploy e il setup sono state fatte da un solo membro del gruppo, che però era in chiamata con gli altri membri del team e condivideva lo schermo, in modo che anche gli altri potessero dare il proprio contributo e/o capirne il funzionamento. Inoltre, lo strumento LiveShare di Visual Studio Code ci ha permesso di lavorare al codice in maniera collaborativa su una sola macchina, per facilitare modifiche importanti senza dover unire versioni differenti di codice provenienti da dispositivi separati.


```
Foto del Burndown chart coming soon, but not so soon
```

## Sprint goal

Per questo sprint il goal deciso è il seguente:
- Arrivare a realizzare le funzionalità primarie dell'applicazione Parket, anche se primitive e con una scarsa UI. Quindi innanzitutto la creazione di una Homepage dove poter registrarsi e di un'area personale dell'utente. In seguito l'inserimento di parcheggi per avere una lista consultabile nella Home e la gestione delle prenotazioni.

Ci siamo prefissati dei passi da seguire nella pratica, e sono:

- Design e sviluppo di API base
    - Utente
    - Parcheggio
    - Inserzione
    - Prenotazione
    
- Implementazione pagine di base del web service:
   - Registrazione
   - Login
   - Home page
   - Pagina parcheggio

- Integrazione con database MongoDB:
   - Sistema di gestione utenti
   - Sistema di gestione parcheggi
   - Sistema di prenotazione inserzioni

- Testing e primo deploy del progetto tramite Travis CI ed Heroku

## Sprint

## Product backlog refinement

## How to demo offline

## How to demo Heroku

## Sprint retrospective

# Sprint #2

## Sprint goal

## Sprint

## Product backlog refinement

## How to demo offline

## How to demo Heroku

## Sprint retrospective