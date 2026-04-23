# ArtiStudio — Fichier de contexte projet

## Identité du projet
- **Nom du robot** : ArtiBot
- **Nom de l’application** : ArtiStudio
- **Nom du dépôt GitHub** : `artistudio`

## Objectif
ArtiStudio est une application web pédagogique destinée à programmer un petit robot dessinateur nommé ArtiBot.

Le but est de permettre à des enfants, collégiens et au grand public de découvrir la robotique en programmant un robot qui dessine, puis de visualiser immédiatement son déplacement et le tracé produit.

L’application doit fonctionner directement dans un navigateur.

## Contraintes générales
- Application **web**
- Doit tourner **dans le navigateur**
- Doit être **hébergeable facilement sur GitHub Pages**
- Doit pouvoir fonctionner **hors ligne si nécessaire**
- Projet **multi-fichiers**, propre et maintenable
- Pas de backend
- Solution technique la **plus simple et maintenable possible**
- Intégration de **Google Blockly**, avec un rendu moderne et agréable

## Public visé
- Enfants
- Collège
- Grand public

## Interface attendue
L’application doit être organisée en deux zones principales :

- **À gauche** : espace Blockly
- **À droite** : simulateur 2D vu du dessus

## Partie Blockly
- Utilisation de Google Blockly
- Interface moderne, simple, pédagogique
- Présence de **3 niveaux de complexité**
- Les blocs disponibles doivent dépendre du niveau sélectionné

### Niveaux de blocs

#### Niveau 1 — Découverte
- avancer de X mm
- reculer de X mm
- tourner à gauche de X degrés
- tourner à droite de X degrés
- lever le stylo
- baisser le stylo

#### Niveau 2 — Construction
- tous les blocs du niveau 1
- répéter N fois
- attendre
- retour à la position initiale
- effacer le dessin

#### Niveau 3 — Logique
- tous les blocs du niveau 2
- variables
- conditions
- fonctions

## Modèle de simulation
- Simulation d’un robot **très simple**
- Représentation type **curseur / tortue avec orientation**
- Vue du dessus en **2D**
- Le robot doit permettre de voir :
  - son déplacement
  - son orientation
  - le tracé qu’il réalise

## Comportement du stylo
- Bloc pour **lever le stylo**
- Bloc pour **baisser le stylo**
- Quand le stylo est baissé, le robot trace
- Quand le stylo est levé, le robot se déplace sans tracer

## Commandes et unités
- Déplacement en **millimètres**
- Rotation en **degrés**
- Commandes simples et pédagogiques

## Zone de dessin
- Taille de la zone **paramétrable**
- **Grille visible**
- **Origine au centre**
- Couleur unique pour le moment

## Exécution / simulation
- Exécution **instantanée** possible
- Exécution **animée** également
- Contrôles :
  - Run
  - Pause
  - Reset

## Code généré
- Blockly doit générer un **pseudo-code lisible**
- Ce pseudo-code doit être pensé comme une représentation intermédiaire
- Il devra pouvoir être **interprété plus tard** pour rendre simple le chargement ou l’envoi vers un ESP32 dans le robot
- La partie envoi réel au robot n’est **pas à faire maintenant**

## Langues
- Interface **bilingue**
- Langues :
  - français
  - anglais
- Avec un **bouton de bascule de langue** dans l’interface

## Style visuel souhaité
- Simple
- Pédagogique
- Moderne
- **Conforme à la charte graphique UniLaSalle Amiens** (voir section dédiée)

## Identité visuelle — Charte graphique UniLaSalle Amiens

### Contexte

ArtiStudio est un projet du **campus UniLaSalle Amiens**.
La charte graphique UniLaSalle 2023 (Brand Book) définit l’identité visuelle à appliquer.

### Palette de couleurs (campus Amiens)

| Rôle | Couleur | Pantone | HEX | RVB | CMJN |
| --- | --- | --- | --- | --- | --- |
| **Couleur campus Amiens** (principale) | Rouge | RED 032C | `#dc3428` | 220, 52, 40 | 0, 90, 86, 0 |
| **Corporate UniLaSalle** (secondaire) | Bleu marine | 2955C | `#00395c` | 0, 57, 92 | 100, 75, 39, 31 |
| **Vert institutionnel** (accent) | Vert | 368C | `#84b926` | 132, 185, 38 | 56, 2, 100, 0 |
| Blanc | Blanc | — | `#ffffff` | 255, 255, 255 | 0, 0, 0, 0 |

- Le rouge Amiens (`#dc3428`) est **exclusif au campus Amiens** — ne pas mélanger avec les couleurs des autres campus.
- Les teintes à 30 % d’intensité sont utilisables comme couleurs d’accent secondaires (tableaux, graphiques).
- Le **noir est réservé à la typographie** uniquement.

### Application dans ArtiStudio

- **Header** : fond rouge Amiens (`#dc3428`)
- **Bouton Exécuter** : bleu corporate (`#00395c`)
- **Bouton Pause** : rouge Amiens (`#dc3428`)
- **Tracé du robot** : bleu corporate (`#00395c`)
- **Corps du robot** : rouge Amiens (`#dc3428`)
- **Pseudo-code** : vert sur fond bleu corporate (écho palette institutionnelle)
- **Pseudo-code → flèche ICI** : vert `#84b926` (référence à "Demain Commence **ICI**")

### Typographie

| Niveau | Police officielle | Substitut web |
| --- | --- | --- |
| Titres (display) | Diazo MVB Cond Bold | **Barlow Condensed ExtraBold** (Google Fonts) |
| Corps de texte | **Nunito** Light / Medium / Extra Bold | Nunito (Google Fonts — police officielle) |
| Remplacement système | Impact (capitales) | Verdana |

- Nunito est la police secondaire **officielle** UniLaSalle, disponible sur Google Fonts.
- Barlow Condensed est utilisé comme substitut web de la Diazo MVB Cond Bold (propriétaire).

### Éléments iconographiques clés

- **La flèche** : élément graphique central de la charte. Symbolise le progrès et le dynamisme. Issu du mot "**ICI**" de la baseline "Demain Commence Ici". Utilisé comme icône dans le panneau pseudo-code.
- **Baseline** : "DEMAIN COMMENCE ICI" — affichée dans le header.
- **Pictos** : style linéaire, sans remplissage, même épaisseur de trait.

### Règles d’usage du logo (non implémentées dans cette version)

- Zone de protection = hauteur de la lettre "U" du logotype
- Ne jamais encadrer le logo dans un rectangle
- Versions fond : vert principal, bleu corporate, blanc
- Pour les campus : toujours utiliser la couleur propre au campus

## Contraintes d’architecture
- Projet statique
- Compatible GitHub Pages
- Multi-fichiers
- Structure claire
- Extensible pour de futures évolutions

## Évolutions futures envisagées
- Envoi du programme vers un vrai robot
- Interprétation du pseudo-code côté robot
- Ajout de nouveaux blocs
- Possibles fonctions supplémentaires autour du dessin et du pilotage

## Résumé court
ArtiStudio est une application web pédagogique en deux panneaux :
- Blockly à gauche
- simulateur 2D à droite

Elle permet de programmer ArtiBot avec des blocs simples pour déplacer un robot dessinateur, lever ou baisser le stylo, voir son déplacement et le dessin produit. L’application est bilingue FR/EN, prévue pour GitHub Pages, sans backend, avec une structure propre et maintenable.
