# Documentation

Interface REST
=============
L'interface REST de notre application permet d'interagir avec les fonctionnalités des sondages et de ce qui les compose. L'API est utilise le JSON comme format de transmission de données. Elle est disponible à l'adresse ```/api``` et reconnaît les chemins suivants:

- **GET** ```/api/poll``` : Renvoie des statistiques à propos de tous les sondages existants:

```
    {
        nb_open : <nombre de sondages ouverts>
        nb_closed : <nombre de sondages terminés>
        nb_recent : <nombres de sondages récents>
    }
```

Le nombre de sondages récents correspond au nombre de sondages créés depuis une date x fournie par le client lorsqu'il effectue sa requête dans l'URL: ```?since=mm.dd.aaaa```

Si le client n'a rien spécifié lors de sa requête, ```nb_recent``` = ```nb_open + nb_closed```.

- **GET** ```/api/poll/<id>``` : Renvoie des informations à propos d'un sondage en particulier sous la forme suivante:

```
    {
        name : "<nom du sondage>",
        creator : "<nom du créateur>",
        creation_date : "<mm.dd.aaaa>",
        state : "draft|open|close"
        nb_questions : <nombre de questions>,
        nb_participations : <nombre de participants différents>
    }
```

- **GET** ```/api/polls/draft```, ```/api/polls/open``` et ```/api/polls/closed``` : Renvoie la liste des sondages ouverts, respectivement terminés selon le json suivant:

```
    {
        polls : [{poll}, {poll}, ..., {poll}]
    }
```
où la structure ```{poll}``` correspond au json décrit au point précédent.

Cette requête permet de faire de la pagination en renvoyant *nb* résultats depuis un numéro *FROM* en spécifiant dans l'URL les paramètres suivants: ```?from=x&nb=y```. Attention, si aucun paramètre n'est spécifié, la liste de tous les sondages est renvoyée (et c'est le mal!).

- **GET** ```/api/poll/<id>/question/<id>``` : Renvoie les informations à propos d'une question particulière d'un sondage en particulier sous la forme:

```
    {
        text : "<texte de la question>",
        choices_available : <nombre de choix qu'il est possible de choisir simultanément>,
        optional : <true/false>,
        choices : []
    }
```

- **GET** ```/api/poll/<id>/question/<id>/results``` : Renvoie les résultats actuels pour une question sous la forme:

```
    {
        text : "<texte de la question>"
        nb_answers : <nombre de résultats collectés>,
        results : [
            {
                id : <id>,
                text : "<texte du choix>",
                correct : <true/false>
                nb_chosen : <nb de personnes ayant sélectionné ce choix>
            }
    }
```