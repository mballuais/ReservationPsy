const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
const psychologistsRoutes = require('./routes/psychologists');
const patientsRoutes = require('./routes/patients');
const appointmentsRoutes = require('./routes/appointments');
const availabilityRoutes = require('./routes/availability');
app.use('/api/psychologists', psychologistsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/availability', availabilityRoutes);
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/reservation.html'));
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Une erreur est survenue' });
});
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║     Cabinet de Psychologues - API Backend              ║
╠════════════════════════════════════════════════════════╣
║  Serveur démarré sur http://localhost:${PORT}            ║
║                                                        ║
║  Endpoints API:                                        ║
║  • GET  /api/psychologists      - Liste psychologues   ║
║  • GET  /api/psychologists/:id  - Détails psychologue  ║
║  • GET  /api/patients           - Liste patients       ║
║  • POST /api/patients           - Créer patient        ║
║  • GET  /api/appointments       - Liste RDV            ║
║  • POST /api/appointments       - Créer RDV            ║
║  • DELETE /api/appointments/:id - Annuler RDV          ║
║  • GET  /api/availability/:id/:date - Disponibilités   ║
╚════════════════════════════════════════════════════════╝
    `);
});
module.exports = app;
