const express = require('express');
const router = express.Router();
const db = require('../database/db');
const APPOINTMENT_DURATIONS = {
    couple: 60,
    grossesse: 45
};
router.get('/', (req, res) => {
    try {
        const { date, psychologist_id, status } = req.query;
        let query = `
            SELECT
                a.id,
                a.appointment_type,
                a.appointment_date,
                a.appointment_time,
                a.duration_minutes,
                a.is_first_visit,
                a.status,
                a.notes,
                a.created_at,
                pat.id as patient_id,
                pat.first_name as patient_first_name,
                pat.last_name as patient_last_name,
                pat.email as patient_email,
                pat.phone as patient_phone,
                psy.id as psychologist_id,
                psy.name as psychologist_name,
                psy.full_name as psychologist_full_name
            FROM appointments a
            JOIN patients pat ON a.patient_id = pat.id
            JOIN psychologists psy ON a.psychologist_id = psy.id
            WHERE 1=1
        `;
        const params = [];
        if (date) {
            query += ' AND a.appointment_date = ?';
            params.push(date);
        }
        if (psychologist_id) {
            query += ' AND a.psychologist_id = ?';
            params.push(psychologist_id);
        }
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }
        query += ' ORDER BY a.appointment_date, a.appointment_time';
        const appointments = db.prepare(query).all(...params);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', (req, res) => {
    try {
        const appointment = db.prepare(`
            SELECT
                a.*,
                pat.first_name as patient_first_name,
                pat.last_name as patient_last_name,
                pat.email as patient_email,
                pat.phone as patient_phone,
                psy.name as psychologist_name,
                psy.full_name as psychologist_full_name
            FROM appointments a
            JOIN patients pat ON a.patient_id = pat.id
            JOIN psychologists psy ON a.psychologist_id = psy.id
            WHERE a.id = ?
        `).get(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        }
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/', (req, res) => {
    try {
        const {
            patient_id,
            patient, // Alternative: créer le patient en même temps
            psychologist_id,
            psychologist_name, // Alternative: chercher par nom
            appointment_type,
            appointment_date,
            appointment_time,
            is_first_visit,
            notes
        } = req.body;
        if (!appointment_type || !['couple', 'grossesse'].includes(appointment_type)) {
            return res.status(400).json({ error: 'Type de RDV invalide (couple ou grossesse)' });
        }
        if (!appointment_date || !appointment_time) {
            return res.status(400).json({ error: 'Date et heure requises' });
        }
        let finalPatientId = patient_id;
        if (!finalPatientId && patient) {
            const existingPatient = db.prepare('SELECT id FROM patients WHERE email = ?').get(patient.email);
            if (existingPatient) {
                finalPatientId = existingPatient.id;
            } else {
                const result = db.prepare(`
                    INSERT INTO patients (first_name, last_name, email, phone)
                    VALUES (?, ?, ?, ?)
                `).run(patient.first_name, patient.last_name, patient.email, patient.phone);
                finalPatientId = result.lastInsertRowid;
            }
        }
        if (!finalPatientId) {
            return res.status(400).json({ error: 'Patient requis (patient_id ou patient object)' });
        }
        let finalPsyId = psychologist_id;
        if (!finalPsyId && psychologist_name) {
            const psy = db.prepare('SELECT id FROM psychologists WHERE name = ?').get(psychologist_name);
            if (psy) {
                finalPsyId = psy.id;
            }
        }
        if (!finalPsyId) {
            return res.status(400).json({ error: 'Psychologue requis' });
        }
        const existingAppointment = db.prepare(`
            SELECT id FROM appointments
            WHERE psychologist_id = ?
            AND appointment_date = ?
            AND appointment_time = ?
            AND status = 'confirmed'
        `).get(finalPsyId, appointment_date, appointment_time);
        if (existingAppointment) {
            return res.status(409).json({ error: 'Ce créneau est déjà réservé' });
        }
        const duration = APPOINTMENT_DURATIONS[appointment_type];
        const result = db.prepare(`
            INSERT INTO appointments (
                patient_id, psychologist_id, appointment_type,
                appointment_date, appointment_time, duration_minutes,
                is_first_visit, notes, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
        `).run(
            finalPatientId, finalPsyId, appointment_type,
            appointment_date, appointment_time, duration,
            is_first_visit ? 1 : 0, notes || null
        );
        res.status(201).json({
            id: result.lastInsertRowid,
            message: 'Rendez-vous créé avec succès'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/:id', (req, res) => {
    try {
        const { appointment_date, appointment_time, notes, status } = req.body;
        const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        }
        if (appointment_date || appointment_time) {
            const newDate = appointment_date || existing.appointment_date;
            const newTime = appointment_time || existing.appointment_time;
            const conflict = db.prepare(`
                SELECT id FROM appointments
                WHERE psychologist_id = ?
                AND appointment_date = ?
                AND appointment_time = ?
                AND status = 'confirmed'
                AND id != ?
            `).get(existing.psychologist_id, newDate, newTime, req.params.id);
            if (conflict) {
                return res.status(409).json({ error: 'Ce créneau est déjà réservé' });
            }
        }
        const result = db.prepare(`
            UPDATE appointments
            SET appointment_date = COALESCE(?, appointment_date),
                appointment_time = COALESCE(?, appointment_time),
                notes = COALESCE(?, notes),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(appointment_date, appointment_time, notes, status, req.params.id);
        res.json({ message: 'Rendez-vous mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare(`
            UPDATE appointments
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'confirmed'
        `).run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Rendez-vous non trouvé ou déjà annulé' });
        }
        res.json({ message: 'Rendez-vous annulé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
