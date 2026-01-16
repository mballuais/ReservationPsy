# 📅 Application de prise de rendez-vous – Cabinet Psy Belvédère

Application web de prise de rendez-vous en ligne pour un cabinet de psychologues. Les patients peuvent réserver, consulter et annuler leurs rendez-vous, tandis que les professionnels disposent d’un espace dédié pour gérer leur planning. Le projet repose sur un frontend en HTML, CSS et JavaScript, ainsi qu’un backend avec une base de données.

## Fonctionnalités
Côté patient : choix du psychologue, sélection du type de rendez-vous, choix de la date et de l’horaire, saisie des informations personnelles, confirmation avec référence, consultation et annulation des rendez-vous via email.  
Côté professionnel : accès à l’espace pro, visualisation du planning (jour, semaine, mois), gestion des créneaux et statistiques.

## Structure du projet
reservationpsy/  
├── frontend/ (reservation.html, styles.css, script.js)  
├── backend/ (routes, services, database, server.js, package.json)  
└── README.md

## Technologies
Frontend : HTML5, CSS3, JavaScript (Vanilla)  
Backend : Node.js, Express  
Base de données : SQLite / MySQL / PostgreSQL  
API REST avec fetch / AJAX

## Installation
git clone https://github.com/mballuais/ReservationPsy.git  
cd reservationpsy  

Backend :  
cd backend  
npm install  
npm start  

Frontend : ouvrir frontend/reservation.html dans un navigateur.

## Statut
Projet pédagogique – en cours de développement.
