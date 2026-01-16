const API_URL = 'http://localhost:4000/api';
let bookingState = {
    psychologist: null,
    psychologistId: null,
    type: null,
    isFirstVisit: null,
    date: null,
    time: null,
    appointmentId: null
};
let psychologistsData = {};
async function loadPsychologists() {
    try {
        const response = await fetch(`${API_URL}/psychologists`);
        const psychologists = await response.json();
        psychologists.forEach(psy => {
            psychologistsData[psy.name] = {
                id: psy.id,
                name: psy.full_name,
                email: psy.email,
                phone: psy.phone
            };
        });
        console.log('Psychologues chargés depuis l\'API');
    } catch (error) {
        console.warn('API non disponible, utilisation des données locales');
        psychologistsData = {
            'Lemaire': { id: 1, name: 'Madame Lemaire' },
            'André': { id: 2, name: 'Monsieur André' },
            'Honoré': { id: 3, name: 'Madame Honoré' },
            'Garnier': { id: 4, name: 'Madame Garnier' }
        };
    }
}
const localSchedules = {
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
function goToStep(stepId) {
    const step = document.getElementById(stepId);
    if (step) {
        step.classList.add('active');
        setTimeout(() => {
            step.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}
function markButtonClicked(button) {
    const parentGrid = button.closest('.button-grid, .service-cards');
    if (parentGrid) {
        parentGrid.querySelectorAll('.choice-btn, .service-btn').forEach(btn => {
            btn.classList.remove('clicked');
        });
    }
    button.classList.add('clicked');
}
function selectService() {
    markButtonClicked(event.target);
    setTimeout(() => goToStep('step-psychologist'), 300);
}
function selectPsychologist(psychologist) {
    bookingState.psychologist = psychologist;
    bookingState.psychologistId = psychologistsData[psychologist]?.id;
    markButtonClicked(event.target);
    const psychologistName = psychologistsData[psychologist]?.name || psychologist;
    document.querySelectorAll('[id^="psychologist-name"]').forEach(el => {
        el.textContent = psychologistName.toUpperCase();
    });
    setTimeout(() => goToStep('step-type'), 300);
}
function selectType(type) {
    bookingState.type = type;
    markButtonClicked(event.target);
    setTimeout(() => goToStep('step-first'), 300);
}
function selectFirstVisit(isFirst) {
    bookingState.isFirstVisit = isFirst;
    markButtonClicked(event.target);
    setTimeout(() => goToStep('step-date'), 300);
}
function selectDate() {
    const dateInput = document.getElementById('appointment-date');
    bookingState.date = dateInput.value;
    if (bookingState.date) {
        generateTimeSlots();
        setTimeout(() => goToStep('step-time'), 300);
    }
}
async function generateTimeSlots() {
    const morningSlots = document.getElementById('morning-slots');
    const afternoonSlots = document.getElementById('afternoon-slots');
    morningSlots.innerHTML = '<p class="loading">Chargement...</p>';
    afternoonSlots.innerHTML = '';
    try {
        const response = await fetch(
            `${API_URL}/availability/${bookingState.psychologistId}/${bookingState.date}?type=${bookingState.type}`
        );
        const data = await response.json();
        morningSlots.innerHTML = '';
        afternoonSlots.innerHTML = '';
        if (data.available_slots && data.available_slots.length > 0) {
            if (data.morning && data.morning.length > 0) {
                data.morning.forEach(slot => {
                    const button = createTimeSlotButton(slot);
                    morningSlots.appendChild(button);
                });
            } else {
                morningSlots.innerHTML = '<p class="no-slots">Aucun créneau</p>';
            }
            if (data.afternoon && data.afternoon.length > 0) {
                data.afternoon.forEach(slot => {
                    const button = createTimeSlotButton(slot);
                    afternoonSlots.appendChild(button);
                });
            } else {
                afternoonSlots.innerHTML = '<p class="no-slots">Aucun créneau</p>';
            }
        } else {
            const message = data.message || 'Aucun créneau disponible ce jour';
            morningSlots.innerHTML = `<p class="no-slots">${message}</p>`;
        }
    } catch (error) {
        console.warn('API non disponible, utilisation des créneaux locaux');
        fallbackGenerateTimeSlots();
    }
}
function createTimeSlotButton(slot) {
    const button = document.createElement('button');
    button.className = 'time-slot';
    button.textContent = slot;
    button.onclick = function() { selectTime(slot, this); };
    return button;
}
function fallbackGenerateTimeSlots() {
    const slots = localSchedules[bookingState.psychologist]?.[bookingState.type] || [];
    const morningSlots = document.getElementById('morning-slots');
    const afternoonSlots = document.getElementById('afternoon-slots');
    morningSlots.innerHTML = '';
    afternoonSlots.innerHTML = '';
    slots.forEach(slot => {
        const button = createTimeSlotButton(slot);
        const hour = parseInt(slot.split(':')[0]);
        if (hour < 12) {
            morningSlots.appendChild(button);
        } else {
            afternoonSlots.appendChild(button);
        }
    });
}
function selectTime(time, button) {
    bookingState.time = time;
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected', 'clicked');
    });
    button.classList.add('selected', 'clicked');
    setTimeout(() => goToStep('step-patient'), 500);
}
async function submitPatientForm(event) {
    event.preventDefault();
    const form = event.target;
    const errorDiv = document.getElementById('booking-error');
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Réservation en cours...';
    errorDiv.style.display = 'none';
    const patientData = {
        first_name: document.getElementById('patient-firstname').value,
        last_name: document.getElementById('patient-lastname').value,
        email: document.getElementById('patient-email').value,
        phone: document.getElementById('patient-phone').value
    };
    const notes = document.getElementById('patient-notes').value;
    try {
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patient: patientData,
                psychologist_name: bookingState.psychologist,
                appointment_type: bookingState.type,
                appointment_date: bookingState.date,
                appointment_time: bookingState.time,
                is_first_visit: bookingState.isFirstVisit,
                notes: notes
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Erreur lors de la réservation');
        }
        bookingState.appointmentId = result.id;
        showConfirmation();
    } catch (error) {
        console.error('Erreur réservation:', error);
        errorDiv.textContent = error.message || 'Une erreur est survenue. Veuillez réessayer.';
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmer le rendez-vous';
    }
}
function showConfirmation() {
    const psychologist = psychologistsData[bookingState.psychologist];
    const dateObj = new Date(bookingState.date + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString('fr-FR', options);
    const typeText = bookingState.type === 'couple' ? 'en couple' : 'femme enceinte';
    document.getElementById('confirm-type').textContent = typeText;
    document.getElementById('confirm-psychologist').textContent = psychologist?.name || bookingState.psychologist;
    document.getElementById('confirm-date').textContent = formattedDate;
    document.getElementById('confirm-time').textContent = bookingState.time;
    document.getElementById('confirm-id').textContent = `RDV-${bookingState.appointmentId}`;
    goToStep('step-confirmation');
}
async function cancelAppointment() {
    if (!bookingState.appointmentId) {
        alert('Aucun rendez-vous à annuler');
        return;
    }
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
        return;
    }
    try {
        const response = await fetch(`${API_URL}/appointments/${bookingState.appointmentId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Erreur lors de l\'annulation');
        }
        alert('Votre rendez-vous a été annulé.');
        resetBooking();
    } catch (error) {
        console.error('Erreur annulation:', error);
        alert('Erreur: ' + error.message);
    }
}
function resetBooking() {
    bookingState = {
        psychologist: null,
        psychologistId: null,
        type: null,
        isFirstVisit: null,
        date: null,
        time: null,
        appointmentId: null
    };
    const form = document.getElementById('patient-form');
    if (form) {
        form.reset();
        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirmer le rendez-vous';
        }
    }
    const errorDiv = document.getElementById('booking-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    document.querySelectorAll('.clicked').forEach(el => {
        el.classList.remove('clicked');
    });
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step-home').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.nav-btn[onclick="showPage('${pageName}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    if (pageName === 'team') {
        loadTeamPage();
    }
    if (pageName === 'dashboard') {
        loadPsySelector();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function loadTeamPage() {
    const teamGrid = document.getElementById('team-grid');
    if (!teamGrid) return;
    teamGrid.innerHTML = '<p class="loading">Chargement...</p>';
    try {
        const response = await fetch(`${API_URL}/psychologists`);
        const psychologists = await response.json();
        teamGrid.innerHTML = '';
        psychologists.forEach(psy => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.innerHTML = `
                <div class="team-avatar">${psy.full_name.charAt(0)}</div>
                <h3>${psy.full_name}</h3>
                <p class="team-role">Psychologue</p>
                <div class="team-contact">
                    <p><strong>Email:</strong> ${psy.email || 'Non renseigné'}</p>
                    <p><strong>Tél:</strong> ${psy.phone || 'Non renseigné'}</p>
                </div>
                <button class="choice-btn" onclick="bookWithPsychologist('${psy.name}')">
                    Prendre rendez-vous
                </button>
            `;
            teamGrid.appendChild(card);
        });
    } catch (error) {
        teamGrid.innerHTML = '<p class="error-message">Impossible de charger l\'équipe.</p>';
    }
}
function bookWithPsychologist(name) {
    showPage('home');
    setTimeout(() => {
        document.getElementById('step-psychologist').classList.add('active');
        bookingState.psychologist = name;
        bookingState.psychologistId = psychologistsData[name]?.id;
        const psychologistName = psychologistsData[name]?.name || name;
        document.querySelectorAll('[id^="psychologist-name"]').forEach(el => {
            el.textContent = psychologistName.toUpperCase();
        });
        goToStep('step-type');
    }, 300);
}
async function searchAppointments() {
    const email = document.getElementById('search-email').value.trim();
    if (!email) {
        alert('Veuillez entrer votre adresse email.');
        return;
    }
    const listDiv = document.getElementById('appointments-list');
    const noResultsDiv = document.getElementById('no-appointments');
    const container = document.getElementById('appointments-container');
    listDiv.style.display = 'none';
    noResultsDiv.style.display = 'none';
    container.innerHTML = '<p class="loading">Recherche en cours...</p>';
    listDiv.style.display = 'block';
    try {
        const patientsResponse = await fetch(`${API_URL}/patients`);
        const patients = await patientsResponse.json();
        const patient = patients.find(p => p.email.toLowerCase() === email.toLowerCase());
        if (!patient) {
            listDiv.style.display = 'none';
            noResultsDiv.style.display = 'block';
            return;
        }
        const appointmentsResponse = await fetch(`${API_URL}/patients/${patient.id}/appointments`);
        const appointments = await appointmentsResponse.json();
        if (appointments.length === 0) {
            listDiv.style.display = 'none';
            noResultsDiv.style.display = 'block';
            return;
        }
        container.innerHTML = '';
        appointments.forEach(apt => {
            const dateObj = new Date(apt.appointment_date + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const typeText = apt.appointment_type === 'couple' ? 'Couple' : 'Grossesse';
            const statusClass = apt.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled';
            const statusText = apt.status === 'confirmed' ? 'Confirmé' : 'Annulé';
            const card = document.createElement('div');
            card.className = 'appointment-card';
            card.innerHTML = `
                <div class="appointment-header">
                    <span class="appointment-type">${typeText}</span>
                    <span class="appointment-status ${statusClass}">${statusText}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>Date:</strong> ${formattedDate} à ${apt.appointment_time}</p>
                    <p><strong>Psychologue:</strong> ${apt.psychologist_full_name}</p>
                    <p><strong>Durée:</strong> ${apt.duration_minutes} minutes</p>
                    <p class="appointment-ref">Réf: RDV-${apt.id}</p>
                </div>
                ${apt.status === 'confirmed' ? `
                    <button class="cancel-apt-btn" onclick="cancelAppointmentById(${apt.id})">
                        Annuler ce rendez-vous
                    </button>
                ` : ''}
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erreur recherche:', error);
        container.innerHTML = '<p class="error-message">Erreur lors de la recherche.</p>';
    }
}
async function cancelAppointmentById(id) {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
        return;
    }
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Erreur lors de l\'annulation');
        }
        alert('Rendez-vous annulé avec succès.');
        searchAppointments(); // Rafraîchir la liste
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}
function sendContactForm(event) {
    event.preventDefault();
    alert('Message envoyé ! (Simulation - pas de backend email configuré)');
    event.target.reset();
}
let dashboardState = {
    psychologistId: null,
    psychologistName: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    selectedDate: null,
    appointmentsCache: {}
};
async function loadPsySelector() {
    const select = document.getElementById('psy-select');
    if (!select) return;
    try {
        const response = await fetch(`${API_URL}/psychologists`);
        const psychologists = await response.json();
        select.innerHTML = '<option value="">Choisir...</option>';
        psychologists.forEach(psy => {
            const option = document.createElement('option');
            option.value = psy.id;
            option.textContent = psy.full_name;
            option.dataset.name = psy.full_name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur chargement psychologues:', error);
    }
}
function loginDashboard() {
    const select = document.getElementById('psy-select');
    if (!select.value) {
        alert('Veuillez sélectionner votre profil.');
        return;
    }
    dashboardState.psychologistId = parseInt(select.value);
    dashboardState.psychologistName = select.options[select.selectedIndex].dataset.name;
    document.getElementById('dashboard-login').style.display = 'none';
    document.getElementById('dashboard-main').style.display = 'block';
    document.getElementById('dashboard-name').textContent = dashboardState.psychologistName;
    document.getElementById('dashboard-avatar').textContent = dashboardState.psychologistName.charAt(0);
    renderCalendar();
    loadDashboardStats();
    const today = new Date().toISOString().split('T')[0];
    selectCalendarDate(today);
}
function logoutDashboard() {
    dashboardState = {
        psychologistId: null,
        psychologistName: null,
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        selectedDate: null,
        appointmentsCache: {}
    };
    document.getElementById('dashboard-main').style.display = 'none';
    document.getElementById('dashboard-login').style.display = 'flex';
}
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/appointments?psychologist_id=${dashboardState.psychologistId}&status=confirmed`);
        const appointments = await response.json();
        const today = new Date().toISOString().split('T')[0];
        const startOfWeek = getStartOfWeek(new Date());
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        let todayCount = 0;
        let weekCount = 0;
        let monthCount = 0;
        appointments.forEach(apt => {
            if (apt.appointment_date === today) todayCount++;
            if (apt.appointment_date >= startOfWeek) weekCount++;
            if (apt.appointment_date >= startOfMonth) monthCount++;
        });
        document.getElementById('stat-today').textContent = todayCount;
        document.getElementById('stat-week').textContent = weekCount;
        document.getElementById('stat-month').textContent = monthCount;
    } catch (error) {
        console.error('Erreur stats:', error);
    }
}
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
}
async function renderCalendar() {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.getElementById('calendar-month-year').textContent =
        `${monthNames[dashboardState.currentMonth]} ${dashboardState.currentYear}`;
    const firstDay = new Date(dashboardState.currentYear, dashboardState.currentMonth, 1);
    const lastDay = new Date(dashboardState.currentYear, dashboardState.currentMonth + 1, 0);
    const startingDay = firstDay.getDay() || 7; // Lundi = 1
    const monthAppointments = await loadMonthAppointments();
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    for (let i = 1; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${dashboardState.currentYear}-${String(dashboardState.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        dayElement.dataset.date = dateStr;
        if (dateStr === today) {
            dayElement.classList.add('today');
        }
        if (dateStr === dashboardState.selectedDate) {
            dayElement.classList.add('selected');
        }
        if (monthAppointments[dateStr] && monthAppointments[dateStr].length > 0) {
            dayElement.classList.add('has-appointments');
            const badge = document.createElement('span');
            badge.className = 'day-badge';
            badge.textContent = monthAppointments[dateStr].length;
            dayElement.appendChild(badge);
        }
        dayElement.onclick = () => selectCalendarDate(dateStr);
        calendarDays.appendChild(dayElement);
    }
}
async function loadMonthAppointments() {
    const startDate = `${dashboardState.currentYear}-${String(dashboardState.currentMonth + 1).padStart(2, '0')}-01`;
    const endDate = `${dashboardState.currentYear}-${String(dashboardState.currentMonth + 1).padStart(2, '0')}-31`;
    try {
        const response = await fetch(`${API_URL}/appointments?psychologist_id=${dashboardState.psychologistId}&status=confirmed`);
        const appointments = await response.json();
        const grouped = {};
        appointments.forEach(apt => {
            if (!grouped[apt.appointment_date]) {
                grouped[apt.appointment_date] = [];
            }
            grouped[apt.appointment_date].push(apt);
        });
        dashboardState.appointmentsCache = grouped;
        return grouped;
    } catch (error) {
        console.error('Erreur chargement RDV:', error);
        return {};
    }
}
function changeMonth(delta) {
    dashboardState.currentMonth += delta;
    if (dashboardState.currentMonth > 11) {
        dashboardState.currentMonth = 0;
        dashboardState.currentYear++;
    } else if (dashboardState.currentMonth < 0) {
        dashboardState.currentMonth = 11;
        dashboardState.currentYear--;
    }
    renderCalendar();
}
async function selectCalendarDate(dateStr) {
    dashboardState.selectedDate = dateStr;
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
        if (day.dataset.date === dateStr) {
            day.classList.add('selected');
        }
    });
    const dateObj = new Date(dateStr + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('selected-date-display').textContent = formattedDate;
    await loadDayAppointments(dateStr);
}
async function loadDayAppointments(dateStr) {
    const container = document.getElementById('dashboard-appointments');
    container.innerHTML = '<p class="loading">Chargement...</p>';
    try {
        const response = await fetch(`${API_URL}/appointments?psychologist_id=${dashboardState.psychologistId}&date=${dateStr}`);
        const appointments = await response.json();
        const confirmed = appointments.filter(apt => apt.status === 'confirmed');
        document.getElementById('appointments-count').textContent =
            `${confirmed.length} rendez-vous`;
        if (confirmed.length === 0) {
            container.innerHTML = '<p class="no-appointments-msg">Aucun rendez-vous ce jour</p>';
            return;
        }
        confirmed.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
        container.innerHTML = '';
        confirmed.forEach(apt => {
            const typeLabel = apt.appointment_type === 'couple' ? 'Couple' : 'Grossesse';
            const card = document.createElement('div');
            card.className = `timeline-item ${apt.appointment_type}`;
            card.innerHTML = `
                <div class="timeline-time">
                    <span class="time">${apt.appointment_time}</span>
                    <span class="duration">${apt.duration_minutes} min</span>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h4>${apt.patient_first_name} ${apt.patient_last_name}</h4>
                        <span class="timeline-type ${typeClass}">${typeLabel}</span>
                    </div>
                    <div class="patient-info">
                        <p><span class="info-icon">&#9993;</span> ${apt.patient_email}</p>
                        <p><span class="info-icon">&#9742;</span> ${apt.patient_phone}</p>
                        ${apt.notes ? `<p class="patient-notes"><span class="info-icon">&#9998;</span> ${apt.notes}</p>` : ''}
                    </div>
                    <div class="timeline-actions">
                        <span class="ref-number">Réf: RDV-${apt.id}</span>
                        <button class="btn-cancel-small" onclick="cancelAppointmentDashboard(${apt.id})">Annuler</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erreur chargement RDV jour:', error);
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}
async function cancelAppointmentDashboard(id) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erreur');
        await renderCalendar();
        await loadDayAppointments(dashboardState.selectedDate);
        await loadDashboardStats();
    } catch (error) {
        alert('Erreur lors de l\'annulation');
    }
}
function switchDashboardTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).style.display = tabName === 'planning' ? 'grid' : 'block';
    event.target.classList.add('active');
    if (tabName === 'horaires') {
        loadWorkingHours();
    }
    if (tabName === 'creneaux') {
        dashboardState.currentSlotType = 'couple';
        loadSlots();
    }
}
const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
async function loadWorkingHours() {
    const container = document.getElementById('working-hours-form');
    container.innerHTML = '<p class="loading">Chargement...</p>';
    try {
        const response = await fetch(`${API_URL}/psychologists/${dashboardState.psychologistId}/working-hours`);
        const hours = await response.json();
        const hoursMap = {};
        hours.forEach(h => {
            hoursMap[h.day_of_week] = h;
        });
        container.innerHTML = '';
        for (let day = 1; day <= 6; day++) {
            const h = hoursMap[day] || null;
            const enabled = h !== null;
            const row = document.createElement('div');
            row.className = 'working-day-row';
            row.innerHTML = `
                <label class="day-toggle">
                    <input type="checkbox" data-day="${day}" ${enabled ? 'checked' : ''} onchange="toggleDayInputs(${day})">
                    <span class="day-name">${dayNames[day]}</span>
                </label>
                <div class="day-hours" id="day-hours-${day}" style="${enabled ? '' : 'opacity: 0.4; pointer-events: none;'}">
                    <div class="time-range">
                        <label>Début</label>
                        <input type="time" id="start-${day}" value="${h?.start_time || '09:00'}">
                    </div>
                    <div class="time-range">
                        <label>Fin</label>
                        <input type="time" id="end-${day}" value="${h?.end_time || '18:00'}">
                    </div>
                    <div class="time-range">
                        <label>Pause début</label>
                        <input type="time" id="break-start-${day}" value="${h?.break_start || ''}">
                    </div>
                    <div class="time-range">
                        <label>Pause fin</label>
                        <input type="time" id="break-end-${day}" value="${h?.break_end || ''}">
                    </div>
                </div>
            `;
            container.appendChild(row);
        }
        const dimanche = document.createElement('div');
        dimanche.className = 'working-day-row';
        const hDim = hoursMap[0] || null;
        dimanche.innerHTML = `
            <label class="day-toggle">
                <input type="checkbox" data-day="0" ${hDim ? 'checked' : ''} onchange="toggleDayInputs(0)">
                <span class="day-name">${dayNames[0]}</span>
            </label>
            <div class="day-hours" id="day-hours-0" style="${hDim ? '' : 'opacity: 0.4; pointer-events: none;'}">
                <div class="time-range">
                    <label>Début</label>
                    <input type="time" id="start-0" value="${hDim?.start_time || '09:00'}">
                </div>
                <div class="time-range">
                    <label>Fin</label>
                    <input type="time" id="end-0" value="${hDim?.end_time || '18:00'}">
                </div>
                <div class="time-range">
                    <label>Pause début</label>
                    <input type="time" id="break-start-0" value="${hDim?.break_start || ''}">
                </div>
                <div class="time-range">
                    <label>Pause fin</label>
                    <input type="time" id="break-end-0" value="${hDim?.break_end || ''}">
                </div>
            </div>
        `;
        container.appendChild(dimanche);
    } catch (error) {
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}
function toggleDayInputs(day) {
    const checkbox = document.querySelector(`input[data-day="${day}"]`);
    const inputs = document.getElementById(`day-hours-${day}`);
    if (checkbox.checked) {
        inputs.style.opacity = '1';
        inputs.style.pointerEvents = 'auto';
    } else {
        inputs.style.opacity = '0.4';
        inputs.style.pointerEvents = 'none';
    }
}
async function saveWorkingHours() {
    const hours = [];
    for (let day = 0; day <= 6; day++) {
        const checkbox = document.querySelector(`input[data-day="${day}"]`);
        if (checkbox && checkbox.checked) {
            hours.push({
                day_of_week: day,
                enabled: true,
                start_time: document.getElementById(`start-${day}`).value,
                end_time: document.getElementById(`end-${day}`).value,
                break_start: document.getElementById(`break-start-${day}`).value || null,
                break_end: document.getElementById(`break-end-${day}`).value || null
            });
        }
    }
    try {
        const response = await fetch(`${API_URL}/psychologists/${dashboardState.psychologistId}/working-hours`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hours })
        });
        if (!response.ok) throw new Error('Erreur');
        alert('Horaires enregistrés !');
    } catch (error) {
        alert('Erreur lors de l\'enregistrement');
    }
}
dashboardState.currentSlotType = 'couple';
dashboardState.currentSlots = [];
function switchSlotType(type) {
    dashboardState.currentSlotType = type;
    document.querySelectorAll('.slot-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    loadSlots();
}
async function loadSlots() {
    const container = document.getElementById('current-slots');
    container.innerHTML = '<p class="loading">Chargement...</p>';
    try {
        const response = await fetch(`${API_URL}/psychologists/${dashboardState.psychologistId}/slots?type=${dashboardState.currentSlotType}`);
        const slots = await response.json();
        dashboardState.currentSlots = slots.map(s => s.slot_time);
        renderSlots();
    } catch (error) {
        container.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
}
function renderSlots() {
    const container = document.getElementById('current-slots');
    if (dashboardState.currentSlots.length === 0) {
        container.innerHTML = '<p class="no-slots">Aucun créneau défini</p>';
        return;
    }
    dashboardState.currentSlots.sort();
    container.innerHTML = '';
    dashboardState.currentSlots.forEach(slot => {
        const tag = document.createElement('div');
        tag.className = 'slot-tag';
        tag.innerHTML = `
            <span>${slot}</span>
            <button onclick="removeSlot('${slot}')">&times;</button>
        `;
        container.appendChild(tag);
    });
}
function addSlot() {
    const input = document.getElementById('new-slot-time');
    const time = input.value;
    if (!time) {
        alert('Sélectionnez une heure');
        return;
    }
    if (dashboardState.currentSlots.includes(time)) {
        alert('Ce créneau existe déjà');
        return;
    }
    dashboardState.currentSlots.push(time);
    renderSlots();
    input.value = '';
}
function removeSlot(slot) {
    dashboardState.currentSlots = dashboardState.currentSlots.filter(s => s !== slot);
    renderSlots();
}
async function saveSlots() {
    try {
        const response = await fetch(`${API_URL}/psychologists/${dashboardState.psychologistId}/slots`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: dashboardState.currentSlotType,
                slots: dashboardState.currentSlots
            })
        });
        if (!response.ok) throw new Error('Erreur');
        alert('Créneaux enregistrés !');
    } catch (error) {
        alert('Erreur lors de l\'enregistrement');
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    await loadPsychologists();
    await loadPsySelector();
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('appointment-date');
    if (dateInput) {
        dateInput.min = today;
    }
    document.getElementById('step-home').classList.add('active');
    const patientForm = document.getElementById('patient-form');
    if (patientForm) {
        patientForm.addEventListener('submit', submitPatientForm);
    }
    showPage('home');
});
