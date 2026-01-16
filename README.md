📅 Application de prise de rendez-vous – Cabinet Psy Belvédère
🧠 Description

Ce projet est une application web de prise de rendez-vous pour un cabinet de psychologues.
Elle permet aux patients de réserver, consulter et annuler leurs rendez-vous en ligne, et aux professionnels d’accéder à un espace dédié pour gérer leur planning.

L’application repose sur :

un frontend en HTML / CSS / JavaScript

un backend avec une base de données pour la gestion des rendez-vous, patients et professionnels.

✨ Fonctionnalités
👤 Côté patient

Sélection d’un service (psychologue)

Choix du professionnel

Choix du type de rendez-vous

Sélection de la date et de l’horaire

Saisie des informations personnelles

Confirmation avec référence de rendez-vous

Consultation des rendez-vous via l’email

Annulation d’un rendez-vous

👩‍⚕️ Côté professionnel (Espace Pro)

Connexion à l’espace professionnel

Accès au planning

Visualisation des rendez-vous :

du jour

de la semaine

du mois

Gestion des horaires et créneaux

Tableau de bord avec statistiques

📞 Pages informatives

Accueil

Notre équipe

Contact (formulaire de contact)

Page urgence avec numéros utiles

🗂️ Structure du projet
/project-root
│
├── reservation.html     # Page principale de l’application
├── styles.css            # Styles CSS
├── script.js             # Logique JavaScript (navigation, formulaires, API)
│
├── backend/              # Serveur backend
│   ├── routes/           # Routes API (rendez-vous, patients, psy)
│   ├── controllers/      # Logique métier
│   ├── models/           # Modèles de données
│   └── server.js         # Lancement du serveur
│
├── database/
│   └── database.sql      # Schéma de la base de données
│
└── README.md

🛠️ Technologies utilisées
Frontend

HTML5

CSS3

JavaScript (Vanilla)

Google Fonts (Inter)

Backend (exemple)

Node.js + Express (ou autre selon ton choix)

API REST

Gestion des requêtes AJAX / fetch

Base de données

MySQL / PostgreSQL / SQLite (au choix)

Tables :

patients

psychologues

rendez_vous

disponibilites

🗃️ Base de données (exemple de logique)

Un patient peut avoir plusieurs rendez-vous

Un psychologue a :

des disponibilités

plusieurs rendez-vous associés

Chaque rendez-vous contient :

date

heure

type

patient

psychologue

statut (confirmé / annulé)

🚀 Installation et lancement
1. Cloner le projet
git clone https://github.com/ton-repo/cabinet-psy.git
cd cabinet-psy

2. Lancer le backend
cd backend
npm install
npm start

3. Configurer la base de données

Importer le fichier database.sql

Configurer les accès DB dans le backend

4. Lancer le frontend

Ouvrir reservation.html dans un navigateur
(ou via un serveur local)

🔐 Sécurité & améliorations possibles

Validation côté backend

Authentification sécurisée pour l’espace pro

Envoi d’emails de confirmation

Gestion des conflits de créneaux

Responsive mobile amélioré

Déploiement (Docker, VPS, etc.)

📌 Statut du projet

🟡 En cours / Projet pédagogique
