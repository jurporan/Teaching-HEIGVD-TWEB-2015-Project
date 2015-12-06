# Phase 2
Ce rapport a pour but de décrire le travail effectué durant la phase 2 de ce projet de TWEB.

Corrections
-----------
Nous avons apporté quelques modifications au code de la phase 1 et avons corrigé quelques problèmes:

- Les statistiques ont été corrigées, elles n'étaient ni fausses ni mal calculées, mais ne correspondaient pas ce que l'on pourrait intuitivement s'attendre

- Comme demandé, le projet a été angularisé et notre site est, comme prévu, une web-application sur une seule page, où les opérations s'effectuent sans rafraîchissement

- Comme demandé, nous utilisons socket.io pour afficher dynamiquement les nouveaux résultats des sondages

- Nous avons continué d'enrichir notre API en corrigeant certains petits bugs et en ajoutant des chemins.

Interface
---------
Notre ancien thème étant très sobre, nous avons décidé de faire une refonte de l'interface, premièrement en choisissant un autre thème, un petit peu plus riche, puis, deuxièmement, en changeant de nom. Nous avions en effet choisi d'appeler notre site **QPoll**, ce qui ne correspondait à rien de précis, et nous l'avons rebaptisé **NorthPoll**, en lien avec notre nouveau thème.


![Ancienne interface](img/old.png)


![Interface actuelle](img/current.png)


Notre nouveau thème, même s'il reste sobre, est plus fourni que le précédent et possède un thème de couleurs proche du monochrome. L'exemple d'utilisation de base étant dans le thème de l'hiver et de la neige, nous avons repris cette idée, d'où nous tirons le nom **NorthPoll**.

Instances
---------

Nous avons mieux réfléchi au fonctionnement de notre application et avons introduit la notion d'*instance* de sondage.

Notre première intention, dans la phase 1, était de simplement définir qu'un sondage était ouvert ou fermé. Cependant, nous ne nous étions pas demandé ce qu'il adviendrait des résultats déjà existants si un sondage était fermé, modifié, puis réouvert. En effet, les anciens résultats n'auraient plus eu de sens, les questions et leurs choix ayant pu être complètement modifiés entre temps.

D'autre part, la simple notion d'être ouvert ou fermé, nous empêchait de lancer plusieurs fois le sondage afin de comparer les résultats, comme par exemple créer un sondage et faire participer deux classes parallèles pour en comparer les résultats. Nous avions alors éventuellement pensé qu'il serait possible de copier un sondage ou l'exporter.

Dans cette phase 2, après réflexion, nous avons décidé d'agir différemment. Nous nous basons sur les mêmes schémas qu'un langage orienté objet: un sondage est une classe, et celui-ci peut être *instancié* plusieurs fois, en parallèle s'il le faut. D'autre part, chaque instance étant indépendante des autres, les nouvelles instances, créées après modification du sondage, peuvent posséder des questions/choix différents des instances ayant été créées dans une ancienne version du sondage.

Ainsi nous gérons les deux problèmes susmentionnés:

- Les résultats sont gardés même si le sondage est modifié et affichent simplement les questions et réponses du sondage dans l'état où il était lorsque l'instance a été créée.

- Il est possible de lancer plusieurs fois le sondage en même temps, en précisant un nom différent pour chacune des instances.

![Deux instances d'un sondage](img/2instances.png)

Nous avons donc modifié notre  [API REST](Rest.md) en conséquence afin de gérer tout ce mécanisme.

Liste des sondages
------------------
Nous avons créé une interface présente sur la page d'accueil qui liste les sondages existants de manière simple et propre:

![Interface actuelle](img/list.png)

Cette liste affiche tous les sondages, quel que soit leur état, et indique, au moyen d'un label coloré, le statut de chacun:

- *Initialisé* : état par défaut d'un sondage lorsqu'il est créé. Le sondage existe dans la base de données, mais son créateur n'a pas fini de créer les questions. Aucune instance n'existe pour ce sondage.

- *Ouvert* : Le sondage possède une ou plusieurs instances et il est possible d'y participer.

- *Fermé* : Le sondage est fermé, les instances sont vérouillées et les résultats sont figés.

En dessous du nom d'un sondage sont affichées les instances existantes, s'il y en a. C'est dans cette zone qu'il est possible d'y participer en cliquant sur "Participer" et d'afficher les statistiques en temps réel en cliquant sur "Statistiques".

Le bouton "Modifier" permettra (en phase 3), en saisissant le mot de passe associé au sondage, de le modifier: modifier ses propriétés, gérer les questions et leurs choix, gérer les instances. La page affichée est la même que pour la création, où les champs sont déjà pré-remplis


Création de sondages
--------------------

Cette interface, qui est aussi celle qui permettra de modifier le sondage, permet de créer un nouveau sondage, d'y insérer des questions, et de créer des instances.

![Création d'un sondage](img/createPoll.png)

Une fois toutes les propriétés saisies, il suffit de cliquer sur le bouton "Créer le sondage" (qui est de toute façon le seul disponible) pour créer immédiatement le sondage via l'API REST. Une fois le sondage créé, il est possible d'y insérer des questions en cliquant sur le bouton "Créer questions" qui fera apparaître la page suivante.

![Création d'une question](img/createQuestion.png)

Ce formulaire permet de créer une question et les choix qui y sont associés. Une question peut être optionnelle (il n'est pas nécessaire d'y répondre pour soumettre les résultats) et permettent de sélectionner plusieurs choix simultanément. Marquer un choix comme étant correct ou non est enregistré côté serveur, mais n'est pas utilisé pour le moment.

Répondre à un sondage
---------------------

Visualiser les résultats
------------------------

Travail restant
---------------
-Modifier un sondage
-Lister/modifier les instances