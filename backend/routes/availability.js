const express = require('express');
const router = express.Router();
const db = require('../database/db');
router.get('/:psychologist_id/:date', (req, res) => {
    try {
        const { psychologist_id, date } = req.params;
        const { type } = req.query; // 'couple' ou 'grossesse'
        if (!type || !['couple', 'grossesse'].includes(type)) {
            return res.status(400).json({ error: 'Type de RDV requis (couple ou grossesse)' });
        }
        const dateObj = new Date(date + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();
        const workingDay = db.prepare(`
            SELECT * FROM working_hours
            WHERE psychologist_id = ? AND day_of_week = ?
        `).get(psychologist_id, dayOfWeek);
        if (!workingDay) {
            return res.json({
                date,
                psychologist_id: parseInt(psychologist_id),
                available_slots: [],
                message: 'Le psychologue ne travaille pas ce jour'
            });
        }
        const defaultSlots = db.prepare(`
            SELECT slot_time
            FROM default_slots
            WHERE psychologist_id = ? AND appointment_type = ?
            ORDER BY slot_time
        `).all(psychologist_id, type);
        const bookedSlots = db.prepare(`
            SELECT appointment_time
            FROM appointments
            WHERE psychologist_id = ?
            AND appointment_date = ?
            AND status = 'confirmed'
        `).all(psychologist_id, date);
        const bookedTimes = new Set(bookedSlots.map(s => s.appointment_time));
        const availableSlots = defaultSlots
            .map(s => s.slot_time)
            .filter(time => !bookedTimes.has(time));
        const morning = availableSlots.filter(time => {
            const hour = parseInt(time.split(':')[0]);
            return hour < 12;
        });
        const afternoon = availableSlots.filter(time => {
            const hour = parseInt(time.split(':')[0]);
            return hour >= 12;
        });
        res.json({
            date,
            psychologist_id: parseInt(psychologist_id),
            appointment_type: type,
            available_slots: availableSlots,
            morning,
            afternoon,
            total_available: availableSlots.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:psychologist_id/week/:start_date', (req, res) => {
    try {
        const { psychologist_id, start_date } = req.params;
        const { type } = req.query;
        if (!type || !['couple', 'grossesse'].includes(type)) {
            return res.status(400).json({ error: 'Type de RDV requis (couple ou grossesse)' });
        }
        const weekAvailability = [];
        const startDate = new Date(start_date + 'T00:00:00');
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay();
            const workingDay = db.prepare(`
                SELECT * FROM working_hours
                WHERE psychologist_id = ? AND day_of_week = ?
            `).get(psychologist_id, dayOfWeek);
            if (!workingDay) {
                weekAvailability.push({
                    date: dateStr,
                    day_name: currentDate.toLocaleDateString('fr-FR', { weekday: 'long' }),
                    available_slots: [],
                    is_working_day: false
                });
                continue;
            }
            const defaultSlots = db.prepare(`
                SELECT slot_time FROM default_slots
                WHERE psychologist_id = ? AND appointment_type = ?
                ORDER BY slot_time
            `).all(psychologist_id, type);
            const bookedSlots = db.prepare(`
                SELECT appointment_time FROM appointments
                WHERE psychologist_id = ? AND appointment_date = ? AND status = 'confirmed'
            `).all(psychologist_id, dateStr);
            const bookedTimes = new Set(bookedSlots.map(s => s.appointment_time));
            const availableSlots = defaultSlots
                .map(s => s.slot_time)
                .filter(time => !bookedTimes.has(time));
            weekAvailability.push({
                date: dateStr,
                day_name: currentDate.toLocaleDateString('fr-FR', { weekday: 'long' }),
                available_slots: availableSlots,
                is_working_day: true,
                total_available: availableSlots.length
            });
        }
        res.json({
            psychologist_id: parseInt(psychologist_id),
            appointment_type: type,
            start_date,
            week: weekAvailability
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
