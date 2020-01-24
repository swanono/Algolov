# Installation du serveur avec Docker

## Téléchargement du projet
Avec git, lancer la commande :
```bash
git clone https://gitlab.univ-nantes.fr/E154706J/algolov.git
```
avec en identifiant : `Guest-ptrans-18-2020`
et en mot de passe : `GuestPsw18`

## Création de l'image Docker du serveur
Avec Docker, lancer la commande :
```bash
docker build -t algolov-server .
```

## Lancement des containers
Avec Docker-Compose, lancer la commande :
```bash
docker-compose up -d
```