# Documentation

Interface REST
=============
L'interface REST de notre application permet d'interagir avec les fonctionnalités des sondages et de ce qui les compose. L'API est utilise le JSON comme format de transmission de données. Elle est disponible à l'adresse ```/api``` et reconnaît les chemins suivants:

- **GET** ```/api/polls/stats``` : Renvoie des statistiques à propos de tous les sondages existants:

```
    {
        nb_open : <nombre de sondages ouverts>
        nb_closed : <nombre de sondages terminés>
        nb_recent : <nombres de sondages récents>
    }
```

Le nombre de sondages récents correspond au nombre de sondages créés depuis une date x fournie par le client lorsqu'il effectue sa requête dans l'URL: ```?since=mm.dd.aaaa```

Si le client n'a rien spécifié lors de sa requête, ```nb_recent``` = ```nb_open + nb_closed```.

- **GET** ```/api/polls/<pollid>``` : Renvoie des informations à propos d'un sondage en particulier sous la forme suivante:

```
    {
        name : "<nom du sondage>",
        creator : "<nom du créateur>",
        creation_date : "<mm.dd.aaaa>",
        state : "draft|open|close",
        nb_questions : <nombre de questions>,
        nb_instances : <nombre de fois que ce sondage a été soumis>,
        public_results : <true|false>
    }
```

- **GET** ```/api/polls/draft```, ```/api/polls/open``` et ```/api/polls/closed``` : Renvoie la liste des sondages ouverts, respectivement terminés selon le json suivant:

```
    {
        polls : [{poll}, {poll}, ..., {poll}]
    }
```

où la structure ```{poll}``` correspond au json décrit au point précédent, en y ajoutant la valeur ```id```.

Cette requête permet de faire de la pagination en renvoyant *nb* résultats depuis un numéro *from* en spécifiant dans l'URL les paramètres suivants: ```?from=x&nb=y```. Attention, si aucun paramètre n'est spécifié, la liste de tous les sondages est renvoyée (et c'est le mal!).

- **GET** ```/api/polls/<pollid>/questions/<questionid>``` : Renvoie les informations à propos d'une question particulière d'un sondage en particulier sous la forme:

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

- **GET** ```/api/polls/<pollid>/questions``` : Renvoie la liste des questions du sondage spécifié sous la forme:

```
    {
        questions : [{question}, {question}, ..., {question}]
    }
```

où la structure ```{question}``` correspond au json décrit au point précédent, en y ajoutant la valeur ```id```.

- **GET** ```/api/polls/<pollid>/instances/<instanceid>/results/questions/<questionid>``` : Renvoie les résultats actuels pour une question sous la forme:

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

- **GET** ```/api/polls/<pollid>/instances``` : Liste les instances existantes pour un sondage, renvoie la structure:

```  
{
    instances : [
        {
            id : <id>,
            creation_date : "<date de création>",
            open : <true|false>,
            nb_questions : <nombre de questions>,
            nb_participations : <nombre de participations enregistrées>
        }
    ]
}
```

- **POST** ```/api/polls``` : Crée un nouveau sondage dans la base de données. Le status du sondage nouvellement créé est toujours *draft*. Le client envoie les informations du nouveau sondage sous le forme:

```
    {
        name : "<nom du sondage>",
        creator : "<nom du créateur>",
        admin_password : "<mot de passe d'administration>",
        user_password : "<mot de passe à destination des utilisateurs>",
        public_results : <true|false>
    }
```

Le mot de passe *admin_password* est obligatoire, mais le mot de passe *user_password* est facultatif, le cas échéant n'importe qui peut accéder au sondage et y participer.

Le serveur répond simplement un message contenant l'dentifiant du sondage nouvellement créé: ```{id : <id>}```


- **POST** ```/api/polls/<pollid>/questions``` : Crée une nouvelle question dans le sondage spécifié. Le client spécifie la question et éventuellement les choix possibles sous la forme:

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

- **POST** ```/api/polls/<pollid>/questions/<questionid>/choices``` : Crée un nouveau choix dans la question spécifiée du sondage spécifié. Le nouveau choix prend la forme:

```
    {
        text : "<texte du choix>",
        correct : <true|false>
    }
```

- **POST** ```/api/polls/<pollid>/instances``` : Crée une nouvelle instance d'un sondage en spécifiant son nom ```{nom : "<nom de l'instance>"}```. Le résultat contient simplement l'identifiant du sondage nouvellement créé: ```{id : <id>}```.

- **POST** ```/api/polls/<pollid>/instances/<instanceid>/results``` : Permet de créer une participation contenant les réponses à toutes les questions obligatoires du sondage sous la forme:

```
{
    results : [{question : "<texte de la question 1>", choices : ["<choix>", ...]}, ...]
}
```

- **PUT** ```/api/polls/<pollid>``` : Modifie un sondage existant. Le client spécifie ses modifications dans la structure suivante:

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

- **PUT** ```/api/polls/<pollid>/questions/<questionid>``` : Modifie une question existante. Le client spécifie ses modifications dans la structure suivante:

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

- **DELETE** ```/api/polls/<pollid>``` : Supprime un sondage existant. Attention, cette action supprimera aussi toutes les questions et leurs choix liées à ce sondage.

- **DELETE** ```/api/polls/<pollid>/instances/<instanceid>``` : Supprime une instance d'un sondage. Attention, cela supprimera automatiquement les résultats qui y sont enregistrés.

- **DELETE** ```/api/polls/<pollid>/questions/<questionid>``` : Supprime une question d'un sondage. Attention, cette action supprimera aussi tous les choix liés à cette question.

Dans cette première partie seront implémentées les requêtes GET et POST ci-dessus. Deux exemples, un GET et un POST sont dosponibles sur [cette page](REST examples.md). Dans de futures versions de l'application, l'API couvrira la gestion des participations et des réponses aux questions.

Remarques
--------

- Pour certaines fonctionnalités de recherche, comme par exemple chercher le contenu d'une question en particulier d'un sondage via ```/api/poll/<pollid>/question/<questionid>``` il n'est pas absolument nécessaire de spécifier le ```pollid```. En effet, nous utilisons directement les identifiants attribués par mongodb dans les URL, donc la recherche d'une question peut très bien être effectuée uniquement en connaissant son identifiant. Le chemin d'accès des questions aurait d'ailleurs très bien pu être simplement ```/api/question/<questionid>```, cependant nous avons décidé de placer les questions dans le chemin d'un sondage car il s'agit d'une relation de composition. Une question ne peut exister sans sondage. Idem pour les choix des questions.
 
- Lorsque le client effectue une requête erronnée, par exemple un POST ne contenant pas tous les champs obligatoires pour créer une ressource, le serveur contrôle la présence et le type de chacun des champs et retourne une erreur n°418 *I am a teapot*. D'autre part, dans le *body* de la réponse, le serveur aura spécifié quels champs sont incorrects selon le json:

```
{
    errors : ["champ", "champ", ..., "champ"]
}
```

où "champ" est le nom de chaque champ incorrect, qu'il soit manquant ou contienne un type incorrect. Le client sait alors que sa requête est fausse et peut la corriger.

