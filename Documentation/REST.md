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

- **GET** ```/api/poll/<pollid>``` : Renvoie des informations à propos d'un sondage en particulier sous la forme suivante:

```
    {
        name : "<nom du sondage>",
        creator : "<nom du créateur>",
        creation_date : "<mm.dd.aaaa>",
        state : "draft|open|close",
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

- **GET** ```/api/poll/<pollid>/question/<questionid>``` : Renvoie les informations à propos d'une question particulière d'un sondage en particulier sous la forme:

```
    {
        text : "<texte de la question>",
        choices_available : <nombre de choix qu'il est possible de choisir simultanément>,
        optional : <true|false>,
        choices : [
            {
                id : <id>,
                text : "<texte du choix>"
            }
        ]
    }
```

- **GET** ```/api/poll/<pollid>/question/<questionid>/results``` : Renvoie les résultats actuels pour une question sous la forme:

```
    {
        text : "<texte de la question>"
        nb_answers : <nombre de résultats collectés>,
        results : [
            {
                id : <id>,
                text : "<texte du choix>",
                correct : <true|false>,
                nb_chosen : <nb de personnes ayant sélectionné ce choix>
            }
        ]
    }
```

- **POST** ```/api/poll``` : Crée un nouveau sondage dans la base de données. Le status du sondage nouvellement créé est toujours *draft*. Le client envoie les informations du nouveau sondage sous le forme:

```
    {
        name : "<nom du sondage>",
        creator : "<nom du créateur>",
        admin_password : "<mot de passe d'administration>",
        user_password : "<mot de passe à destination des utilisateurs>"
    }
```

Le mot de passe *admin_password* est obligatoire, mais le mot de passe *user_password* est facultatif, le cas échéant n'importe qui peut accéder au sondage et y participer.

Le serveur répond simplement un message contenant l'dentifiant du sondage nouvellement créé: ```{id : <id>}```


- **POST** ```/api/poll/<pollid>/question``` : Crée une nouvelle question dans le sondage spécifié. Le client spécifie la question et éventuellement les choix possibles sous la forme:

```
    {
        text : "<texte de la question>",
        choices_available : <nombre de choix qu'il est possible de choisir simultanément>,
        optional : <true|false>,
        choices : [
            {
                text : "<texte du choix>",
                correct : <true|false>
            }
        ]
    }
```

Le serveur répond simplement un message contenant l'dentifiant de la question nouvellement créée: ```{id : <id>}```

- **POST** ```/api/poll/<pollid>/question/<questionid>/choice``` : Crée un nouveau choix dans la question spécifiée du sondage spécifié. Le nouveau choix prend la forme:

```
    {
        text : "<texte du choix>",
        correct : <true|false>
    }
```

- **PUT** ```/api/poll/<pollid>``` : Modifie un sondage existant. Le client spécifie ses modifications dans la structure suivante:

```
    {
        name : "<nom du sondage>",
        creator : "<nom du créateur>",
        admin_password : "<mot de passe d'administration>",
        user_password : "<mot de passe à destination des utilisateurs>",
        state : "draft|open|close",
        public_results : <true|false>
    }
```

Chaque champ est facultatif, le client peut très bien ne modifier qu'une propriété.

- **PUT** ```/api/poll/<pollid>/question/<questionid>``` : Modifie une question existante. Le client spécifie ses modifications dans la structure suivante:

```
    {
        text : "<texte de la question>",
        choices_available : <nombre de choix qu'il est possible de choisir simultanément>,
        optional : <true|false>
    }
```

Chaque champ est facultatif, le client peut très bien ne modifier qu'une propriété.

- **PUT** ```/api/poll/<pollid>/question/<questionid>/choice/<choiceid>``` : Modifie un choix d'une question. Le client spécifie ses modifications dans la structure suivante:

```
    {
        text : "<texte du choix>",
        correct : <true|false>
    }
```

Chaque champ est facultatif, le client peut très bien ne modifier qu'une propriété.

- **DELETE** ```/api/poll/<pollid>``` : Supprime un sondage existant. Attention, cette action supprimera aussi toutes les questions et leurs choix liées à ce sondage.

- **DELETE** ```/api/poll/<pollid>/question/<questionid>``` : Supprime une question d'un sondage. Attention, cette action supprimera aussi tous les choix liés à cette question.

- **DELETE** ```/api/poll/<pollid>/question/<questionid>/choice/<choiceid>``` : Supprime un choix d'une question.

Dans de futures versions de l'application, l'API couvrira la gestion des réponses aux questions.
