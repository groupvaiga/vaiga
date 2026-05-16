import { useState, useEffect } from 'react'

export function getContacts() {
  return JSON.parse(localStorage.getItem('vaiga_contacts') || '{}')
}

export function saveContacts(contacts) {
  localStorage.setItem('vaiga_contacts', JSON.stringify(contacts))
}

export default function ContactsManager({ onClose }) {
  const [contacts, setContacts] = useState({})
  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    setContacts(getContacts())
  }, [])

  const addContact = () => {
    if (!name || !phone) return
    const key = name.toLowerCase().trim()
    const num = phone.replace(/\D/g, '') // digits only
    const updated = { ...contacts, [key]: num }
    setContacts(updated)
    saveContacts(updated)
    setName(''); setPhone('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const deleteContact = (key) => {
    const updated = { ...contacts }
    delete updated[key]
    setContacts(updated)
    saveContacts(updated)
  }

  const s = {
    page:  { background: '#060612', minHeight: '100vh', color: '#fff', padding: '32px', fontFamily: 'Inter, sans-serif' },
    h1:    { fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    input: { flex: 1, padding: '12px 16px', background: '#0f0f1f', border: '1px solid #1f2937', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' },
    btn:   { padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 },
    card:  { background: '#0f0f1f', borderRadius: '12px', padding: '16px', border: '1px solid #1f2937', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  }

  return (
    <div style={s.page}>
      <h1 style={s.h1}>📒 Contacts</h1>
      <p style={{ color: '#4b5563', marginBottom: '24px', fontSize: '0.9rem' }}>
        Add contacts so Vaiga can send WhatsApp messages by name
      </p>

      {/* Add contact */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder='Name (e.g. Loki)'
          style={s.input}
        />
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder='Phone with country code (e.g. 919876543210)'
          style={{ ...s.input, flex: 2 }}
        />
        <button onClick={addContact} style={s.btn}>
          + Add
        </button>
      </div>

      {saved && (
        <div style={{ padding: '10px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', marginBottom: '16px', fontSize: '0.85rem' }}>
          ✅ Contact saved!
        </div>
      )}

      {/* Contacts list */}
      {Object.keys(contacts).length === 0 ? (
        <p style={{ color: '#374151', fontSize: '0.9rem' }}>No contacts yet. Add one above.</p>
      ) : (
        Object.entries(contacts).map(([key, phone]) => (
          <div key={key} style={s.card}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{key}</p>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.82rem' }}>+{phone}</p>
            </div>
            <button
              onClick={() => deleteContact(key)}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem' }}
            >🗑️ Delete</button>
          </div>
        ))
      )}

      <p style={{ color: '#374151', fontSize: '0.78rem', marginTop: '20px' }}>
        💡 Say "send to loki I am busy" — Vaiga will find Loki from this list
      </p>
    </div>
  )
}