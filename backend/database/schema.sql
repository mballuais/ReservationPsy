CREATE TABLE IF NOT EXISTS psychologists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS working_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    psychologist_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dimanche, 1=Lundi, etc.
    start_time TEXT NOT NULL, -- Format HH:MM
    end_time TEXT NOT NULL,   -- Format HH:MM
    break_start TEXT,         -- Pause déjeuner début
    break_end TEXT,           -- Pause déjeuner fin
    FOREIGN KEY (psychologist_id) REFERENCES psychologists(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS default_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    psychologist_id INTEGER NOT NULL,
    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('couple', 'grossesse')),
    slot_time TEXT NOT NULL, -- Format HH:MM
    FOREIGN KEY (psychologist_id) REFERENCES psychologists(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    psychologist_id INTEGER NOT NULL,
    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('couple', 'grossesse')),
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL, -- Format HH:MM
    duration_minutes INTEGER NOT NULL, -- 60 pour couple, 45 pour grossesse
    is_first_visit BOOLEAN NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (psychologist_id) REFERENCES psychologists(id),
    UNIQUE(psychologist_id, appointment_date, appointment_time, status) -- Pas de doublon pour le même créneau (sauf si annulé)
);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_psychologist ON appointments(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
