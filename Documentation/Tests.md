# Stratégie de tests
Opérations de tests
-------------------

Afin de tester les fonctionnalités de base de notre API REST, nous utilisons le module ```api-copilot``` nous permettant d'effectuer des requêtes et de les valider. Nous allons tester les quelques requêtes implémentées dans cette partie 1:

Premièrement nous allons insérer des données:

- Créer un sondage en passant une structure incorrecte, champ manquant par exemple, et le serveur devrait renvoyer un code d'erreur et une structure listant les erreurs
- Créer plusieurs sondages
- Créer plusieurs questions dans chacun de ces sondages, parfois en spécifiant directement une liste de choix
- Ajouter des choix dans certaines questions

Puis, dans un second temps, nous allons contrôler que ces données ont bien été créées:

- Récupérer les statistiques de la page d'accueil et contrôler que les trois statistiques soient cohérentes par rapport aux données insérées, soit:
    - Nombre de sondages total = nombre de sondages créés
    - Nombre de sondages de cette semaine = nombre de sondages créés
    - Nombre de sondages ouverts 0

- Via la même URL ```/api/poll```, récupérer le nombre de sondages créés récemment en précisant ```?since=<date de demain>``` et la statistique ```nb_recent``` devrait être = 0.

- Récupérer les listes aux adresses ```/api/polls/draft```, ```/api/polls/open``` et ```/api/polls/closed``` où les sondages ```draft``` devraient contenir la liste de tous les sondages créés précédemment, et les deux autres devraient être vides

- Récupérer les questions d'un sondage et contrôler qu'il y en a autant que de questions insérées

- Pour chacune des questions, contrôler que le nombre de choix insérés correspond au nombre de choix spécifiés à la création de la question + les choix ajoutés après coup

Résultats
---------
Les résultats rendus par notre script de test pour la partie 1 sont 



