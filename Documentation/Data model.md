#Modèle de données
![Modèle de données]({{ "/img/dataModel.png" | prepend: site.baseurl }})

## Remarques ##
Nous avons conservé les cardinalités des relations et les tables proposés par la modèle présent dans la spécification de la partie 1.

Pour mettre en oeuvre la notion de relation, nous avons utilisé un champ "Foreign key" xxx\_id référençant le champ "_id" mongo de la table référencée.

Nous avons utilisé les mêmes noms pour les champs des documents mongo et pour les payloads JSON des requêtes http. 

