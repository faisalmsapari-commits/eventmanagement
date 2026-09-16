import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const AUTH_KEY = 'eventManagement_auth'
const STORAGE_KEYS = { events: 'eventManagement_events', participants: 'eventManagement_participants', registrations: 'eventManagement_registrations', attendance: 'eventManagement_attendance' }
const DEMO_CREDENTIALS = { username: 'admin', password: 'admin123' }
const seedData = {
  events: [
    { eventId: 'event-001', eventName: 'Frontend Workshop', description: 'A practical web development workshop.', date: '2026-10-15', time: '09:00', location: 'Training Room A', organizer: 'Workshop Committee', capacity: 40, status: 'Upcoming' },
    { eventId: 'event-002', eventName: 'Community Meetup', description: 'An evening for local community members.', date: '2026-09-22', time: '18:30', location: 'Main Hall', organizer: 'Community Team', capacity: 80, status: 'Upcoming' },
    { eventId: 'event-003', eventName: 'Design Foundations', description: 'An introduction to practical interface design.', date: '2026-08-12', time: '10:00', location: 'Studio 2', organizer: 'Design Team', capacity: 30, status: 'Completed' },
  ],
  participants: [
    { participantId: 'participant-001', name: 'Aisha Rahman', email: 'aisha@example.com', phone: '+60123456789', organisation: 'Example College' },
    { participantId: 'participant-002', name: 'Daniel Lee', email: 'daniel@example.com', phone: '+60129876543', organisation: 'Northstar Labs' },
    { participantId: 'participant-003', name: 'Mei Tan', email: 'mei@example.com', phone: '+60121234567', organisation: 'Creative Society' },
  ],
  registrations: [
    { registrationId: 'registration-001', eventId: 'event-001', participantId: 'participant-001', registrationDate: '2026-09-12', status: 'Registered' },
    { registrationId: 'registration-002', eventId: 'event-002', participantId: 'participant-002', registrationDate: '2026-09-14', status: 'Registered' },
    { registrationId: 'registration-003', eventId: 'event-003', participantId: 'participant-003', registrationDate: '2026-08-02', status: 'Registered' },
  ],
  attendance: [{ attendanceId: 'attendance-001', eventId: 'event-003', participantId: 'participant-003', status: 'Present' }],
}

function readCollection(key, fallback = []) {
  try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback } catch { return fallback }
}

function seedApplicationData() {
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seedData[name])) })
}

function readAuthState() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY))?.isAuthenticated === true } catch { return false }
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  function handleSubmit(event) {
    event.preventDefault()
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ isAuthenticated: true, userId: 'user-001', username, loginTime: new Date().toISOString() }))
      onLogin()
    } else setError('Invalid username or password.')
  }
  return <main className="auth-page"><section className="auth-card" aria-labelledby="login-title"><p className="eyebrow">Event Management System</p><h1 id="login-title">Welcome back</h1><p className="muted">Sign in to manage your events and participants.</p><form onSubmit={handleSubmit} noValidate><label htmlFor="username">Username</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />{error && <p className="error" role="alert">{error}</p>}<button type="submit">Login</button></form><p className="demo-note">Demo account: <strong>admin</strong> / <strong>admin123</strong></p></section></main>
}

function Dashboard({ onLogout, onOpenEvents, onOpenParticipants, onOpenRegistrations, onOpenAttendance, onCreateEvent, onCreateParticipant }) {
  const [dataVersion, setDataVersion] = useState(0)
  useEffect(() => {
    seedApplicationData()
    setDataVersion((version) => version + 1)
    const refresh = () => setDataVersion((version) => version + 1)
    window.addEventListener('storage', refresh)
    window.addEventListener('eventManagementDataChanged', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('eventManagementDataChanged', refresh) }
  }, [])
  const data = useMemo(() => Object.fromEntries(Object.entries(STORAGE_KEYS).map(([name, key]) => [name, readCollection(key)])), [dataVersion])
  const today = new Date().toISOString().slice(0, 10)
  const upcomingEvents = data.events.filter((event) => event.date >= today && event.status !== 'Cancelled').sort((a, b) => a.date.localeCompare(b.date))
  const recentRegistrations = [...data.registrations].sort((a, b) => b.registrationDate.localeCompare(a.registrationDate)).slice(0, 5)
  const presentCount = data.attendance.filter((record) => record.status === 'Present').length
  const attendanceRate = data.registrations.length ? Math.round((presentCount / data.registrations.length) * 100) : 0
  function refreshDashboard() { seedApplicationData(); window.dispatchEvent(new Event('eventManagementDataChanged')) }
  return <main className="app-page"><header className="topbar"><div><p className="eyebrow">Event Management System</p><h1>Dashboard</h1><p className="muted page-intro">A clear view of your events, participants, and attendance.</p></div><div className="header-actions"><button className="secondary-button" onClick={onOpenEvents}>Events</button><button className="secondary-button" onClick={onOpenParticipants}>Participants</button><button className="secondary-button" onClick={onOpenRegistrations}>Registrations</button><button className="secondary-button" onClick={onOpenAttendance}>Attendance</button><button className="secondary-button" onClick={onLogout}>Logout</button></div></header><section className="stats-grid" aria-label="Event statistics"><StatCard label="Total Events" value={data.events.length} /><StatCard label="Upcoming Events" value={upcomingEvents.length} /><StatCard label="Total Participants" value={data.participants.length} /><StatCard label="Total Registrations" value={data.registrations.length} /><StatCard label="Attendance Rate" value={`${attendanceRate}%`} /></section><section className="dashboard-grid"><DashboardPanel title="Upcoming Events" action="View all" onAction={onOpenEvents}>{upcomingEvents.length ? <div className="list">{upcomingEvents.slice(0, 4).map((event) => <div className="list-row" key={event.eventId}><div><strong>{event.eventName}</strong><span>{event.location}</span></div><time dateTime={event.date}>{formatDate(event.date)}</time></div>)}</div> : <EmptyState text="No upcoming events yet." />}</DashboardPanel><DashboardPanel title="Recent Registrations" action="View all" onAction={onOpenRegistrations}>{recentRegistrations.length ? <div className="list">{recentRegistrations.map((registration) => { const event = data.events.find((item) => item.eventId === registration.eventId); const participant = data.participants.find((item) => item.participantId === registration.participantId); return <div className="list-row" key={registration.registrationId}><div><strong>{participant?.name || 'Unknown participant'}</strong><span>{event?.eventName || 'Unknown event'}</span></div><time dateTime={registration.registrationDate}>{formatDate(registration.registrationDate)}</time></div> })}</div> : <EmptyState text="No registrations yet." />}</DashboardPanel><DashboardPanel title="Quick Actions" className="quick-actions-panel"><div className="quick-actions"><button onClick={onCreateEvent}>Add Event</button><button onClick={onCreateParticipant}>Add Participant</button><button onClick={onOpenRegistrations}>Register Participant</button><button className="secondary-button" onClick={refreshDashboard}>Refresh Data</button></div></DashboardPanel></section></main>
}

function StatCard({ label, value }) { return <article className="stat-card"><p>{label}</p><strong>{value}</strong></article> }
function DashboardPanel({ title, action, onAction, children, className = '' }) { return <section className={`dashboard-panel ${className}`}><div className="panel-heading"><h2>{title}</h2>{action && <button className="text-button" onClick={onAction}>{action}</button>}</div>{children}</section> }
function EmptyState({ text }) { return <div className="empty-state"><p>{text}</p><span>Create or register data to see it here.</span></div> }
function formatDate(date) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`)) }

function EventsPage({ onBack, onLogout, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [sortDirection, setSortDirection] = useState('asc')
  const [dataVersion, setDataVersion] = useState(0)
  useEffect(() => {
    seedApplicationData()
    setDataVersion((version) => version + 1)
    const refresh = () => setDataVersion((version) => version + 1)
    window.addEventListener('storage', refresh)
    window.addEventListener('eventManagementDataChanged', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('eventManagementDataChanged', refresh) }
  }, [])
  const events = readCollection(STORAGE_KEYS.events)
  const registrations = readCollection(STORAGE_KEYS.registrations)
  const filteredEvents = events.filter((event) => {
    const matchesSearch = `${event.eventName} ${event.location}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (status === 'All' || event.status === status)
  }).sort((a, b) => sortDirection === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))
  const statuses = [...new Set(events.map((event) => event.status))]
  return <main className="app-page"><header className="topbar"><div><button className="back-button" onClick={onBack}>← Dashboard</button><p className="eyebrow">Event Management System</p><h1>Events</h1><p className="muted page-intro">Browse and filter the events saved in this browser.</p></div><div className="header-actions"><button className="secondary-button" onClick={onBack}>Dashboard</button><button className="secondary-button" onClick={onLogout}>Logout</button></div></header><section className="dashboard-panel"><div className="filters"><label>Search events<input aria-label="Search events" placeholder="Search by name or location" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label>Status<select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><button className="secondary-button sort-button" onClick={() => setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')}>Date: {sortDirection === 'asc' ? 'Oldest first' : 'Newest first'}</button></div></section><section className="dashboard-panel event-table-panel"><div className="panel-heading"><h2>Event Records</h2><span className="muted">{filteredEvents.length} of {events.length} events</span></div>{filteredEvents.length ? <div className="table-wrap"><table><thead><tr><th>Event Name</th><th>Date</th><th>Time</th><th>Location</th><th>Capacity</th><th>Status</th><th>Registrations</th><th>Actions</th></tr></thead><tbody>{filteredEvents.map((event) => <tr key={event.eventId}><td><strong>{event.eventName}</strong></td><td>{formatDate(event.date)}</td><td>{event.time}</td><td>{event.location}</td><td>{event.capacity}</td><td><span className="status-badge">{event.status}</span></td><td>{registrations.filter((registration) => registration.eventId === event.eventId).length}</td><td className="row-actions"><button className="text-button" onClick={() => onEdit(event.eventId)}>Edit</button><button className="text-button danger-text" onClick={() => onDelete(event.eventId)}>Delete</button></td></tr>)}</tbody></table></div> : <EmptyState text={events.length ? 'No events match your filters.' : 'No events yet.'} />}</section></main>
}

function ParticipantsPage({ onBack, onLogout, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [dataVersion, setDataVersion] = useState(0)
  useEffect(() => {
    seedApplicationData()
    setDataVersion((version) => version + 1)
    const refresh = () => setDataVersion((version) => version + 1)
    window.addEventListener('storage', refresh)
    window.addEventListener('eventManagementDataChanged', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('eventManagementDataChanged', refresh) }
  }, [])
  const participants = readCollection(STORAGE_KEYS.participants)
  const registrations = readCollection(STORAGE_KEYS.registrations)
  const filteredParticipants = participants.filter((participant) => `${participant.name} ${participant.email} ${participant.organisation}`.toLowerCase().includes(search.toLowerCase()))
  return <main className="app-page"><header className="topbar"><div><button className="back-button" onClick={onBack}>← Dashboard</button><p className="eyebrow">Event Management System</p><h1>Participants</h1><p className="muted page-intro">Browse the people registered in this browser.</p></div><div className="header-actions"><button className="secondary-button" onClick={onBack}>Dashboard</button><button className="secondary-button" onClick={onLogout}>Logout</button></div></header><section className="dashboard-panel"><div className="filters participant-filter"><label>Search participants<input aria-label="Search participants" placeholder="Search by name, email, or organisation" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div></section><section className="dashboard-panel event-table-panel"><div className="panel-heading"><h2>Participant Records</h2><span className="muted">{filteredParticipants.length} of {participants.length} participants</span></div>{filteredParticipants.length ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Organisation</th><th>Registrations</th><th>Actions</th></tr></thead><tbody>{filteredParticipants.map((participant) => <tr key={participant.participantId}><td><strong>{participant.name}</strong></td><td>{participant.email}</td><td>{participant.phone || '—'}</td><td>{participant.organisation || '—'}</td><td>{registrations.filter((registration) => registration.participantId === participant.participantId).length}</td><td className="row-actions"><button className="text-button" onClick={() => onEdit(participant.participantId)}>Edit</button><button className="text-button danger-text" onClick={() => onDelete(participant.participantId)}>Delete</button></td></tr>)}</tbody></table></div> : <EmptyState text={participants.length ? 'No participants match your search.' : 'No participants yet.'} />}</section></main>
}

function RegistrationsPage({ onBack, onLogout }) {
  const [eventId, setEventId] = useState('')
  const [participantId, setParticipantId] = useState('')
  const [message, setMessage] = useState(null)
  const [dataVersion, setDataVersion] = useState(0)
  useEffect(() => {
    seedApplicationData()
    setDataVersion((version) => version + 1)
    const refresh = () => setDataVersion((version) => version + 1)
    window.addEventListener('storage', refresh)
    window.addEventListener('eventManagementDataChanged', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('eventManagementDataChanged', refresh) }
  }, [])
  const events = readCollection(STORAGE_KEYS.events)
  const participants = readCollection(STORAGE_KEYS.participants)
  const registrations = readCollection(STORAGE_KEYS.registrations)
  function submitRegistration(event) {
    event.preventDefault()
    const selectedEvent = events.find((item) => item.eventId === eventId)
    const selectedParticipant = participants.find((item) => item.participantId === participantId)
    if (!selectedEvent) return setMessage({ type: 'error', text: 'Please select an existing event.' })
    if (!selectedParticipant) return setMessage({ type: 'error', text: 'Please select an existing participant.' })
    if (registrations.some((registration) => registration.eventId === eventId && registration.participantId === participantId)) return setMessage({ type: 'error', text: 'This participant is already registered for the selected event.' })
    const registrationCount = registrations.filter((registration) => registration.eventId === eventId).length
    if (registrationCount >= Number(selectedEvent.capacity)) return setMessage({ type: 'error', text: 'Event capacity has been reached.' })
    const nextRegistrations = [...registrations, { registrationId: `registration-${Date.now()}`, eventId, participantId, registrationDate: new Date().toISOString().slice(0, 10), status: 'Registered' }]
    localStorage.setItem(STORAGE_KEYS.registrations, JSON.stringify(nextRegistrations))
    window.dispatchEvent(new Event('eventManagementDataChanged'))
    setMessage({ type: 'success', text: `${selectedParticipant.name} was registered for ${selectedEvent.eventName}.` })
    setParticipantId('')
  }
  return <main className="app-page"><header className="topbar"><div><button className="back-button" onClick={onBack}>← Dashboard</button><p className="eyebrow">Event Management System</p><h1>Registrations</h1><p className="muted page-intro">Connect participants to events while respecting capacity.</p></div><div className="header-actions"><button className="secondary-button" onClick={onBack}>Dashboard</button><button className="secondary-button" onClick={onLogout}>Logout</button></div></header><section className="dashboard-panel registration-form-panel"><div className="panel-heading"><h2>Register Participant</h2></div><form className="registration-form" onSubmit={submitRegistration}><label htmlFor="registration-event">Event<select id="registration-event" aria-label="Registration event" value={eventId} onChange={(event) => { setEventId(event.target.value); setMessage(null) }}><option value="">Select an event</option>{events.map((item) => <option key={item.eventId} value={item.eventId}>{item.eventName} ({registrations.filter((registration) => registration.eventId === item.eventId).length}/{item.capacity})</option>)}</select></label><label htmlFor="registration-participant">Participant<select id="registration-participant" aria-label="Registration participant" value={participantId} onChange={(event) => { setParticipantId(event.target.value); setMessage(null) }}><option value="">Select a participant</option>{participants.map((item) => <option key={item.participantId} value={item.participantId}>{item.name} — {item.email}</option>)}</select></label><button type="submit">Create Registration</button></form>{message && <p className={`form-message ${message.type}`} role="alert">{message.text}</p>}</section><section className="dashboard-panel event-table-panel"><div className="panel-heading"><h2>Current Registrations</h2><span className="muted">{registrations.length} registrations</span></div>{registrations.length ? <div className="list">{registrations.map((registration) => <div className="list-row" key={registration.registrationId}><div><strong>{participants.find((item) => item.participantId === registration.participantId)?.name || 'Unknown participant'}</strong><span>{events.find((item) => item.eventId === registration.eventId)?.eventName || 'Unknown event'}</span></div><time dateTime={registration.registrationDate}>{formatDate(registration.registrationDate)}</time></div>)}</div> : <EmptyState text="No registrations yet." />}</section></main>
}

function AttendancePage({ onBack, onLogout }) {
  const [eventId, setEventId] = useState('')
  const [dataVersion, setDataVersion] = useState(0)
  useEffect(() => {
    seedApplicationData()
    setDataVersion((version) => version + 1)
    const refresh = () => setDataVersion((version) => version + 1)
    window.addEventListener('storage', refresh)
    window.addEventListener('eventManagementDataChanged', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('eventManagementDataChanged', refresh) }
  }, [])
  const events = readCollection(STORAGE_KEYS.events)
  const participants = readCollection(STORAGE_KEYS.participants)
  const registrations = readCollection(STORAGE_KEYS.registrations)
  const attendance = readCollection(STORAGE_KEYS.attendance)
  const selectedEvent = events.find((event) => event.eventId === eventId)
  const registeredParticipants = selectedEvent ? registrations.filter((registration) => registration.eventId === eventId).map((registration) => participants.find((participant) => participant.participantId === registration.participantId)).filter(Boolean) : []
  const presentCount = registeredParticipants.filter((participant) => attendance.find((record) => record.eventId === eventId && record.participantId === participant.participantId)?.status === 'Present').length
  function markAttendance(participantId, status) {
    const existing = attendance.find((record) => record.eventId === eventId && record.participantId === participantId)
    const nextAttendance = existing ? attendance.map((record) => record.attendanceId === existing.attendanceId ? { ...record, status } : record) : [...attendance, { attendanceId: `attendance-${Date.now()}-${participantId}`, eventId, participantId, status }]
    localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(nextAttendance))
    window.dispatchEvent(new Event('eventManagementDataChanged'))
  }
  return <main className="app-page"><header className="topbar"><div><button className="back-button" onClick={onBack}>← Dashboard</button><p className="eyebrow">Event Management System</p><h1>Attendance</h1><p className="muted page-intro">Mark attendance for participants registered for an event.</p></div><div className="header-actions"><button className="secondary-button" onClick={onBack}>Dashboard</button><button className="secondary-button" onClick={onLogout}>Logout</button></div></header><section className="dashboard-panel attendance-selector"><label htmlFor="attendance-event">Event<select id="attendance-event" aria-label="Attendance event" value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="">Select an event</option>{events.map((event) => <option key={event.eventId} value={event.eventId}>{event.eventName}</option>)}</select></label></section>{selectedEvent ? <section className="dashboard-panel event-table-panel"><div className="panel-heading"><div><h2>{selectedEvent.eventName}</h2><p className="muted">{presentCount} present of {registeredParticipants.length} registered</p></div><span className="muted">{registeredParticipants.length ? `${Math.round((presentCount / registeredParticipants.length) * 100)}% attendance` : 'No registrations'}</span></div>{registeredParticipants.length ? <div className="attendance-list">{registeredParticipants.map((participant) => { const record = attendance.find((item) => item.eventId === eventId && item.participantId === participant.participantId); return <div className="attendance-row" key={participant.participantId}><div><strong>{participant.name}</strong><span>{participant.email}</span></div><div className="attendance-actions"><button className={record?.status === 'Present' ? 'attendance-button active-present' : 'attendance-button'} onClick={() => markAttendance(participant.participantId, 'Present')}>Present</button><button className={record?.status === 'Absent' ? 'attendance-button active-absent' : 'attendance-button'} onClick={() => markAttendance(participant.participantId, 'Absent')}>Absent</button></div></div> })}</div> : <EmptyState text="No participants are registered for this event." />}</section> : <section className="dashboard-panel"><EmptyState text="Select an event to view its registered participants." /></section>}</main>
}

function CreateEventPage({ onBack, onLogout, editId }) {
  const existing = editId ? readCollection(STORAGE_KEYS.events).find((item) => item.eventId === editId) : null
  const [form, setForm] = useState(existing ? { eventName: existing.eventName, date: existing.date, time: existing.time, location: existing.location, organizer: existing.organizer || '', capacity: existing.capacity } : { eventName: '', date: '', time: '', location: '', organizer: '', capacity: '' })
  const [message, setMessage] = useState(null)
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); setMessage(null) }
  function submit(event) {
    event.preventDefault()
    if (!form.eventName || !form.date || !form.time || !form.location || !form.capacity || Number(form.capacity) <= 0) return setMessage({ type: 'error', text: 'Event name, date, time, location, and a positive capacity are required.' })
    const events = readCollection(STORAGE_KEYS.events)
    const nextEvent = { eventId: editId || `event-${Date.now()}`, ...form, capacity: Number(form.capacity), status: existing?.status || 'Upcoming', description: existing?.description || '' }
    const nextEvents = editId ? events.map((item) => item.eventId === editId ? nextEvent : item) : [...events, nextEvent]
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(nextEvents))
    window.dispatchEvent(new Event('eventManagementDataChanged'))
    setMessage({ type: 'success', text: editId ? 'Event updated successfully.' : 'Event created successfully.' })
    setForm({ eventName: '', date: '', time: '', location: '', organizer: '', capacity: '' })
  }
  return <SimpleFormPage title={editId ? 'Edit Event' : 'Add Event'} description="Create or update an event for the registration workflow." onBack={onBack} onLogout={onLogout}><form className="entity-form" onSubmit={submit}><label>Event Name<input aria-label="Event name" value={form.eventName} onChange={(event) => update('eventName', event.target.value)} /></label><label>Date<input aria-label="Event date" type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label><label>Time<input aria-label="Event time" type="time" value={form.time} onChange={(event) => update('time', event.target.value)} /></label><label>Location<input aria-label="Event location" value={form.location} onChange={(event) => update('location', event.target.value)} /></label><label>Organizer<input aria-label="Event organizer" value={form.organizer} onChange={(event) => update('organizer', event.target.value)} /></label><label>Capacity<input aria-label="Event capacity" type="number" min="1" value={form.capacity} onChange={(event) => update('capacity', event.target.value)} /></label><button type="submit">{editId ? 'Update Event' : 'Create Event'}</button></form>{message && <p className={`form-message ${message.type}`} role="alert">{message.text}</p>}</SimpleFormPage>
}

function CreateParticipantPage({ onBack, onLogout, editId }) {
  const existing = editId ? readCollection(STORAGE_KEYS.participants).find((item) => item.participantId === editId) : null
  const [form, setForm] = useState(existing ? { name: existing.name, email: existing.email, phone: existing.phone || '', organisation: existing.organisation || '' } : { name: '', email: '', phone: '', organisation: '' })
  const [message, setMessage] = useState(null)
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); setMessage(null) }
  function submit(event) {
    event.preventDefault()
    const participants = readCollection(STORAGE_KEYS.participants)
    if (!form.name || !form.email) return setMessage({ type: 'error', text: 'Name and email are required.' })
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setMessage({ type: 'error', text: 'Enter a valid email address.' })
    if (participants.some((participant) => participant.participantId !== editId && participant.email.toLowerCase() === form.email.toLowerCase())) return setMessage({ type: 'error', text: 'A participant with this email already exists.' })
    const nextParticipant = { participantId: editId || `participant-${Date.now()}`, ...form }
    const nextParticipants = editId ? participants.map((item) => item.participantId === editId ? nextParticipant : item) : [...participants, nextParticipant]
    localStorage.setItem(STORAGE_KEYS.participants, JSON.stringify(nextParticipants))
    window.dispatchEvent(new Event('eventManagementDataChanged'))
    setMessage({ type: 'success', text: editId ? 'Participant updated successfully.' : 'Participant added successfully.' })
    setForm({ name: '', email: '', phone: '', organisation: '' })
  }
  return <SimpleFormPage title={editId ? 'Edit Participant' : 'Add Participant'} description="Add or update a participant for the registration workflow." onBack={onBack} onLogout={onLogout}><form className="entity-form" onSubmit={submit}><label>Name<input aria-label="Participant name" value={form.name} onChange={(event) => update('name', event.target.value)} /></label><label>Email<input aria-label="Participant email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label><label>Phone<input aria-label="Participant phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label><label>Organisation<input aria-label="Participant organisation" value={form.organisation} onChange={(event) => update('organisation', event.target.value)} /></label><button type="submit">{editId ? 'Update Participant' : 'Add Participant'}</button></form>{message && <p className={`form-message ${message.type}`} role="alert">{message.text}</p>}</SimpleFormPage>
}

function SimpleFormPage({ title, description, onBack, onLogout, children }) { return <main className="app-page"><header className="topbar"><div><button className="back-button" onClick={onBack}>← Dashboard</button><p className="eyebrow">Event Management System</p><h1>{title}</h1><p className="muted page-intro">{description}</p></div><div className="header-actions"><button className="secondary-button" onClick={onBack}>Dashboard</button><button className="secondary-button" onClick={onLogout}>Logout</button></div></header><section className="dashboard-panel form-panel">{children}</section></main> }

function App() { const [isAuthenticated, setIsAuthenticated] = useState(readAuthState); const [page, setPage] = useState('dashboard'); const [editId, setEditId] = useState(null); function logout() { localStorage.removeItem(AUTH_KEY); setIsAuthenticated(false); setPage('dashboard') } function deleteEvent(eventId) { if (!window.confirm('Delete this event and its registrations and attendance records?')) return; localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(readCollection(STORAGE_KEYS.events).filter((item) => item.eventId !== eventId))); localStorage.setItem(STORAGE_KEYS.registrations, JSON.stringify(readCollection(STORAGE_KEYS.registrations).filter((item) => item.eventId !== eventId))); localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(readCollection(STORAGE_KEYS.attendance).filter((item) => item.eventId !== eventId))); window.dispatchEvent(new Event('eventManagementDataChanged')) } function deleteParticipant(participantId) { if (!window.confirm('Delete this participant and related registrations and attendance records?')) return; localStorage.setItem(STORAGE_KEYS.participants, JSON.stringify(readCollection(STORAGE_KEYS.participants).filter((item) => item.participantId !== participantId))); localStorage.setItem(STORAGE_KEYS.registrations, JSON.stringify(readCollection(STORAGE_KEYS.registrations).filter((item) => item.participantId !== participantId))); localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(readCollection(STORAGE_KEYS.attendance).filter((item) => item.participantId !== participantId))); window.dispatchEvent(new Event('eventManagementDataChanged')) } if (!isAuthenticated) return <LoginPage onLogin={() => setIsAuthenticated(true)} />; if (page === 'events') return <EventsPage onBack={() => setPage('dashboard')} onLogout={logout} onEdit={(id) => { setEditId(id); setPage('edit-event') }} onDelete={deleteEvent} />; if (page === 'participants') return <ParticipantsPage onBack={() => setPage('dashboard')} onLogout={logout} onEdit={(id) => { setEditId(id); setPage('edit-participant') }} onDelete={deleteParticipant} />; if (page === 'registrations') return <RegistrationsPage onBack={() => setPage('dashboard')} onLogout={logout} />; if (page === 'attendance') return <AttendancePage onBack={() => setPage('dashboard')} onLogout={logout} />; if (page === 'create-event') return <CreateEventPage onBack={() => setPage('dashboard')} onLogout={logout} />; if (page === 'edit-event') return <CreateEventPage editId={editId} onBack={() => setPage('events')} onLogout={logout} />; if (page === 'create-participant') return <CreateParticipantPage onBack={() => setPage('dashboard')} onLogout={logout} />; if (page === 'edit-participant') return <CreateParticipantPage editId={editId} onBack={() => setPage('participants')} onLogout={logout} />; return <Dashboard onOpenEvents={() => setPage('events')} onOpenParticipants={() => setPage('participants')} onOpenRegistrations={() => setPage('registrations')} onOpenAttendance={() => setPage('attendance')} onCreateEvent={() => setPage('create-event')} onCreateParticipant={() => setPage('create-participant')} onLogout={logout} /> }
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
