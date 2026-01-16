const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dbPath = path.join(__dirname, 'cabinet.db');
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Base de données existante supprimée.');
}
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);
console.log('Schéma créé avec succès.');
const psychologists = [
    { name: 'Lemaire', full_name: 'Madame Lemaire', email: 'lemaire@cabinet-psy.fr', phone: '05 77 89 32 41' },
    { name: 'André', full_name: 'Monsieur André', email: 'andre@cabinet-psy.fr', phone: '05 77 89 32 42' },
    { name: 'Honoré', full_name: 'Madame Honoré', email: 'honore@cabinet-psy.fr', phone: '05 77 89 32 43' },
    { name: 'Garnier', full_name: 'Madame Garnier', email: 'garnier@cabinet-psy.fr', phone: '05 77 89 32 45' }
];
const insertPsychologist = db.prepare(
    'INSERT INTO psychologists (name, full_name, email, phone) VALUES (?, ?, ?, ?)'
);
psychologists.forEach(p => {
    insertPsychologist.run(p.name, p.full_name, p.email, p.phone);
});
console.log('Psychologues insérés.');
const defaultSlots = {
    'Lemaire': {
        couple: ['07:00', '09:00', '12:00', '14:00'],
        grossesse: ['08:00', '10:00', '13:00']
    },
    'André': {
        couple: ['09:00', '11:00', '13:30', '15:30'],
        grossesse: ['10:00', '14:30', '16:30', '17:15']
    },
    'Honoré': {
        couple: ['11:00', '13:00', '15:00', '17:00'],
        grossesse: ['12:00', '14:00', '16:00', '18:00']
    },
    'Garnier': {
        couple: ['09:00', '13:30', '15:30', '17:30'],
        grossesse: ['10:00', '10:45', '14:30', '16:30', '18:30']
    }
};
const insertSlot = db.prepare(
    'INSERT INTO default_slots (psychologist_id, appointment_type, slot_time) VALUES (?, ?, ?)'
);
const getPsychologistId = db.prepare('SELECT id FROM psychologists WHERE name = ?');
Object.entries(defaultSlots).forEach(([name, types]) => {
    const psy = getPsychologistId.get(name);
    if (psy) {
        Object.entries(types).forEach(([type, slots]) => {
            slots.forEach(slot => {
                insertSlot.run(psy.id, type, slot);
            });
        });
    }
});
console.log('Créneaux par défaut insérés.');
const workingHours = {
    'Lemaire': { start: '07:00', end: '15:00', breakStart: '11:00', breakEnd: '12:00' },
    'André': { start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '13:30' },
    'Honoré': { start: '11:00', end: '19:00', breakStart: null, breakEnd: null },
    'Garnier': { start: '09:00', end: '19:00', breakStart: '11:30', breakEnd: '13:30' }
};
const insertWorkingHours = db.prepare(
    'INSERT INTO working_hours (psychologist_id, day_of_week, start_time, end_time, break_start, break_end) VALUES (?, ?, ?, ?, ?, ?)'
);
Object.entries(workingHours).forEach(([name, hours]) => {
    const psy = getPsychologistId.get(name);
    if (psy) {
        for (let day = 1; day <= 5; day++) {
            insertWorkingHours.run(psy.id, day, hours.start, hours.end, hours.breakStart, hours.breakEnd);
        }
    }
});
console.log('Horaires de travail insérés.');
const testPatients = [
    { first_name: 'Marie', last_name: 'Dupont', email: 'marie.dupont@email.com', phone: '06 12 34 56 78' },
    { first_name: 'Jean', last_name: 'Martin', email: 'jean.martin@email.com', phone: '06 98 76 54 32' }
];
const insertPatient = db.prepare(
    'INSERT INTO patients (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)'
);
testPatients.forEach(p => {
    insertPatient.run(p.first_name, p.last_name, p.email, p.phone);
});
console.log('Patients de test insérés.');
db.close();
console.log('\n✓ Base de données initialisée avec succès !');
console.log(`  Fichier: ${dbPath}`);
