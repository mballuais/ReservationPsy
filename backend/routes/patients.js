const express = require('express');
const router = express.Router();
const db = require('../database/db');
router.get('/', (req, res) => {
    try {
        const patients = db.prepare(`
            SELECT id, first_name, last_name, email, phone, created_at
            FROM patients
            ORDER BY last_name, first_name
        `).all();
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', (req, res) => {
    try {
        const patient = db.prepare(`
            SELECT id, first_name, last_name, email, phone, created_at
            FROM patients
            WHERE id = ?
        `).get(req.params.id);
        if (!patient) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/', (req, res) => {
    try {
        const { first_name, last_name, email, phone } = req.body;
        if (!first_name || !last_name || !email || !phone) {
            return res.status(400).json({
                error: 'Tous les champs sont requis (first_name, last_name, email, phone)'
            });
        }
        const existing = db.prepare('SELECT id FROM patients WHERE email = ?').get(email);
        if (existing) {
            return res.json({ id: existing.id, message: 'Patient existant' });
        }
        const result = db.prepare(`
            INSERT INTO patients (first_name, last_name, email, phone)
            VALUES (?, ?, ?, ?)
        `).run(first_name, last_name, email, phone);
        res.status(201).json({
            id: result.lastInsertRowid,
            message: 'Patient créé avec succès'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/:id', (req, res) => {
    try {
        const { first_name, last_name, email, phone } = req.body;
        const result = db.prepare(`
            UPDATE patients
            SET first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone)
            WHERE id = ?
        `).run(first_name, last_name, email, phone, req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }
        res.json({ message: 'Patient mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id/appointments', (req, res) => {
    try {
        const appointments = db.prepare(`
            SELECT
                a.id,
                a.appointment_type,
                a.appointment_date,
                a.appointment_time,
                a.duration_minutes,
                a.is_first_visit,
                a.status,
                p.name as psychologist_name,
                p.full_name as psychologist_full_name
            FROM appointments a
            JOIN psychologists p ON a.psychologist_id = p.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `).all(req.params.id);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
