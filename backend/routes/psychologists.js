const express = require('express');
const router = express.Router();
const db = require('../database/db');
router.get('/', (req, res) => {
    try {
        const psychologists = db.prepare(`
            SELECT id, name, full_name, email, phone
            FROM psychologists
            ORDER BY name
        `).all();
        res.json(psychologists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', (req, res) => {
    try {
        const psychologist = db.prepare(`
            SELECT id, name, full_name, email, phone
            FROM psychologists
            WHERE id = ?
        `).get(req.params.id);
        if (!psychologist) {
            return res.status(404).json({ error: 'Psychologue non trouvé' });
        }
        res.json(psychologist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id/slots', (req, res) => {
    try {
        const { type } = req.query; // 'couple' ou 'grossesse'
        let query = `
            SELECT id, appointment_type, slot_time
            FROM default_slots
            WHERE psychologist_id = ?
        `;
        const params = [req.params.id];
        if (type) {
            query += ' AND appointment_type = ?';
            params.push(type);
        }
        query += ' ORDER BY slot_time';
        const slots = db.prepare(query).all(...params);
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id/working-hours', (req, res) => {
    try {
        const hours = db.prepare(`
            SELECT day_of_week, start_time, end_time, break_start, break_end
            FROM working_hours
            WHERE psychologist_id = ?
            ORDER BY day_of_week
        `).all(req.params.id);
        res.json(hours);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/by-name/:name', (req, res) => {
    try {
        const psychologist = db.prepare(`
            SELECT id, name, full_name, email, phone
            FROM psychologists
            WHERE name = ?
        `).get(req.params.name);
        if (!psychologist) {
            return res.status(404).json({ error: 'Psychologue non trouvé' });
        }
        res.json(psychologist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/:id/working-hours', (req, res) => {
    try {
        const { hours } = req.body;
        if (!hours || !Array.isArray(hours)) {
            return res.status(400).json({ error: 'Format invalide' });
        }
        db.prepare('DELETE FROM working_hours WHERE psychologist_id = ?').run(req.params.id);
        const insert = db.prepare(`
            INSERT INTO working_hours (psychologist_id, day_of_week, start_time, end_time, break_start, break_end)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        hours.forEach(h => {
            if (h.enabled) {
                insert.run(req.params.id, h.day_of_week, h.start_time, h.end_time, h.break_start || null, h.break_end || null);
            }
        });
        res.json({ message: 'Horaires mis à jour' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/:id/slots', (req, res) => {
    try {
        const { type, slots } = req.body;
        if (!type || !['couple', 'grossesse'].includes(type)) {
            return res.status(400).json({ error: 'Type invalide' });
        }
        if (!slots || !Array.isArray(slots)) {
            return res.status(400).json({ error: 'Format invalide' });
        }
        db.prepare('DELETE FROM default_slots WHERE psychologist_id = ? AND appointment_type = ?').run(req.params.id, type);
        const insert = db.prepare(`
            INSERT INTO default_slots (psychologist_id, appointment_type, slot_time)
            VALUES (?, ?, ?)
        `);
        slots.forEach(slot => {
            insert.run(req.params.id, type, slot);
        });
        res.json({ message: 'Créneaux mis à jour' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
