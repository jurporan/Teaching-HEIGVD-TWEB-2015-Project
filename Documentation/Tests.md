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
Les résultats rendus par notre script de test pour la partie 1 correspondent à nos attente et semblent indiquer que tout a bien été traité du côté de l'API REST. Voici le listing des résultats:

```
TWEB Test for Part 1

Base URL set to http://localhost:3000/api
Runtime parameters: none

STEP 1: get stats before insert
http[1] GET /api/poll
http[1] 200 OK in 74ms
Completed in 77ms

STEP 2: store stats before insert
Completed in 1ms

STEP 3: create an invalid poll
http[2] POST /api/poll
http[2] 418 undefined in 51ms
Completed in 53ms

STEP 4: create 4 polls
http[3] POST /api/poll
http[4] POST /api/poll
http[5] POST /api/poll
http[6] POST /api/poll
http[3] 200 OK in 53ms
http[4] 200 OK in 56ms
http[5] 200 OK in 58ms
http[6] 200 OK in 64ms
Completed in 67ms

STEP 5: create 3 questions in each poll
http[7] POST /api/poll/56361e96fa5e1a927544f215/question
http[8] POST /api/poll/56361e96fa5e1a927544f215/question
http[9] POST /api/poll/56361e96fa5e1a927544f215/question
http[10] POST /api/poll/56361e97fa5e1a927544f216/question
http[11] POST /api/poll/56361e97fa5e1a927544f216/question
http[12] POST /api/poll/56361e97fa5e1a927544f216/question
http[13] POST /api/poll/56361e97fa5e1a927544f217/question
http[14] POST /api/poll/56361e97fa5e1a927544f217/question
http[15] POST /api/poll/56361e97fa5e1a927544f217/question
http[16] POST /api/poll/56361e97fa5e1a927544f218/question
http[17] POST /api/poll/56361e97fa5e1a927544f218/question
http[18] POST /api/poll/56361e97fa5e1a927544f218/question
http[7] 200 OK in 67ms
http[12] 200 OK in 67ms
http[17] 200 OK in 68ms
http[8] 200 OK in 75ms
http[13] 200 OK in 76ms
http[18] 200 OK in 77ms
http[9] 200 OK in 82ms
http[14] 200 OK in 84ms
http[10] 200 OK in 88ms
http[15] 200 OK in 88ms
http[11] 200 OK in 96ms
http[16] 200 OK in 97ms
Completed in 102ms

STEP 6: get stats after insert
http[19] GET /api/poll
http[19] 200 OK in 12ms
Completed in 13ms

STEP 7: check stats
Before insert: 216, after insert: 220
220 = 216 + 4, everything seems OK
Completed in 1ms

STEP 8: get stats for tomorrow
http[20] GET /api/poll
http[20] 200 OK in 14ms
Completed in 15ms

STEP 9: check tomorrow stats
There are 0 polls created in the future, everything seems OK
Completed in 0ms

STEP 10: get drafts/open/closed
http[21] GET /api/polls/draft
http[22] GET /api/polls/open
http[23] GET /api/polls/closed
http[22] 200 OK in 89ms
http[23] 200 OK in 219ms
http[21] 200 OK in 380ms
Completed in 381ms

STEP 11: check draft/open/closed
Drafts: 220, should be 220
Open: 0, should be 0
Closed: 0, should be 0
Found all 4 polls
Completed in 2ms

STEP 12: get the questions of each polls
http[24] GET /api/poll/56361e96fa5e1a927544f215/questions
http[25] GET /api/poll/56361e97fa5e1a927544f216/questions
http[26] GET /api/poll/56361e97fa5e1a927544f217/questions
http[27] GET /api/poll/56361e97fa5e1a927544f218/questions
http[24] 200 OK in 34ms
http[26] 200 OK in 37ms
http[25] 200 OK in 40ms
http[27] 200 OK in 39ms
Completed in 42ms

STEP 13: check the number of questions of each polls
Question contains 0 choices, should contain 0, seems ok
Question contains 0 choices, should contain 0, seems ok
Question contains 2 choices, should contain 2, seems ok
Question contains 0 choices, should contain 0, seems ok
Question contains 0 choices, should contain 0, seems ok
Question contains 2 choices, should contain 2, seems ok
Question contains 0 choices, should contain 0, seems ok
Question contains 0 choices, should contain 0, seems ok
Question contains 2 choices, should contain 2, seems ok
Question contains 0 choices, should contain 0, seems ok
Question contains 0 choices, should contain 0, seems ok
Question contains 2 choices, should contain 2, seems ok
Found all 3 questions
Completed in 2ms

DONE in 0.76s!
```



