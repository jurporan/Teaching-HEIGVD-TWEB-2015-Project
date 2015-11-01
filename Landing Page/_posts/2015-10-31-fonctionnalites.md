---
layout: post
title:  "Fonctionnalités"
date:   2015-10-31 10:40:57 +0100
---

### Page d'acceuil

La page d'acceuil présente l'application. Elle affiche le nom de l'application, ainsi que quelques statistiques telles que le nombre de sondages ouverts, terminés, ou créés dans la semaine courrante.

![Mockup de la page d'acceuil]({{ "/img/titreR.png" | prepend: site.baseurl }})

L'entête contient les champs "QPolls" (nom de l'application), "A propos", "Sondages" et "Créer un sondage".

Cette page a un format "One page", si l'utilisateur clique sur les champs "A propos" et "Sondages", il est amené dans des sections plus basses sur la page. S'il clique sur "Créer un nouveau sondage", il est amené sur une page différente. Si l'utilisateur clique sur le nom de l'application, il est à nouveau amené sur le haut de la page d'acceuil.

La section affiche une liste de tous les sondages existants. Il est possible d'y rechercher un sondage, en utilisant des filtres tels que "nom du sondage", "pseudo du créateur", "sondage ouvert", "sondage fermé".

![Mockup de la page listant les sondages]({{ "/img/sondagesR.png" | prepend: site.baseurl }})

Pour chaque sondage, il est possible de

- répondre au sondage, si l'administrateur l'a permis;
- visualiser ses résultats, si l'administrateur l'a permis;
- administer le sondage, si on en possède le mot de passe d'administration.

Chacune des actions précédentes amène sur une nouvelle page.

### Création / administration d'un sondage

Un utilisateur souhaitant créer un sondage sur le lien "Créer un sondage" de la page d'acceuil. Il est amené sur une nouvelle page, lui permettant de créer un sondage.

![Mockup de l'édition du sondage]({{ "/img/editionR.png" | prepend: site.baseurl }})

Pour créer un sondage, il est nécessaire de spécifier

- le nom du sondage;
- le pseudo du créateur;
- un mot de passe d'administration du sondage.

Un mot de passe qu'une personne devra donner afin de répondre au sondage peut être également spécifié si son créateur le désire.

Une fois ces informations fournie, l'utilisateur crée le sondage. Cela lui donne les options supplémentaires suivantes

- ouvrir / fermer le sondage;
- ouvrir / fermer la visualisation des résultats;
- réinitialiser les réponses au sondage;
- exporter l'état actuel du sondage, ses questions et les réponses qui s'y rapportent;
- supprimer le sondage (cette option supprimera définitivement toutes les informations relative à ce sondage!).

Par défaut, le sondage ainsi que la visualisation des résultats sont fermés.

L'utilisateur doit ensuite créer les questions que contiendra son sondage. Pour cela, un lien l'amène sur une page dédiée à la gestion des questions d'un sondage.

### Création / administration des questions d'un sondage
La page de création / administration des questions affiche la liste des questions appartenant au sondage.
Pour chaque question créée, il est nécessaire d'indiquer

- le texte de la question;
- le nombre maximum de réponses possibles.

Au minimum deux réponses doivent être possibles. Une ou plusieurs réponses peuvent être indiquées comme "correcte" si la question est de type vrai / faux.

Par défaut, répondre à une question est obligatoire. Le créateur de la question peut néanmoins la marquer comme étant facultative.

### Répondre à un sondage

L'utilisateur souhaitant répondre à un sondage le sélectionne dans la liste des sondages existants. Il est ensuite amené sur une page lui demandant d'entrer un pseudo d'utilisateur, et éventuellement le mot de passe choisi par le créateur du sondage.

Il peut ensuite répondre aux questions du sondage, l'une après l'autre. Arrivé à la dernière question, il peut soumettre l'ensemble de ses réponses. Il a la possibilité d'interrompre ses réponses au sondage avant de les avoir soumises, puis de reprendre là où il en était resté.   

### Visualiser les résultats

L'utilisateur souhaitant visualiser les réponses un sondage le sélectionne dans la liste des sondages existants. Il est ensuite amené sur une page affichant la liste des questions du sondage.

A ce moment, il peut visualiser les réponses relatives à chaque question en la sélectionnant dans la liste. 
Pour chaque question, la visualisation de ses résultats comprend

- le texte de la question;
- les différentes réponses possibles;
- si une réponses était l'une des réponses "correcte", l'indication que celle-ci était une réponse correcte.
- le pourcentage de personnes ayant sélectionné chaque réponse.

L'utilisateur peut se rendre aux questions précédentes/suivantes à l'aide des flèches directionnelles.

