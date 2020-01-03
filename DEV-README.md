## Commandes utiles

### Instalation des packages Node.js
Nécessite d'avoir le fichier package.json rempli avec les dépendances et leurs versions.
```bash
npm install
```
### Installation sur serveur distant
Pour ne pas avoir les dev-dependencies
```bash
npm run servInst
```

### Lancement du linter JS
```bash
npm run lintjs
```
### Lancement du linter CSS
```bash
npm run lintcss
```

### Execution des tests unitaires
```bash
npm run unitTests
```

### Lancement du serveur
```bash
npm run start
```

## Commandes d'environnement Docker

### Création de l'image Docker du serveur
```bash
docker build -t algolov-server .
```

### Mise en route des conteneurs
```bash
docker-compose up -d
```

### Accès au bash d'un conteneur
```bash
docker exec -ti <nom-du-conteneur> bash
```

### Mongo Bash
```bash
mongo --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD
show dbs
db.<collection>.findOne()
```

## Licence

### A mettre à chaque début de fichier de code
> -------------------------------------------------------------------------------------------------
> <Une ligne décrivant le nom du programme et ce qu’il fait>
> Copyright © <Année> <Nom de l’auteur>
> This program is free software: you can redistribute it and/or modify
> it under the terms of the GNU General Public License as published by
> the Free Software Foundation, either version 3 of the License, or
> (at your option) any later version.
> This program is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
> GNU General Public License for more details.
> You should have received a copy of the GNU General Public License
> along with this program. If not, see < https://www.gnu.org/licenses/ >.
> -------------------------------------------------------------------------------------------------