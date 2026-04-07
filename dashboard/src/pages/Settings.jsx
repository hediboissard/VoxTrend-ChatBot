import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../lib/axios'

export default function Settings() {
  const [form, setForm] = useState({
    primaryColor: '#7C3AED',
    textColor: '#ffffff',
    greeting: 'Bonjour 👋',
    subtitle: 'Une question ? Nous répondons en quelques minutes.',
    faq: [],
    height: 600,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')

  useEffect(() => {
    api.get('/widget/settings').then(r => {
      setForm({
        primaryColor: r.data.primaryColor || '#7C3AED',
        textColor: r.data.textColor || '#ffffff',
        greeting: r.data.greeting || '',
        subtitle: r.data.subtitle || '',
        faq: r.data.faq || [],
        height: r.data.height || 600,
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await api.put('/widget/settings', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function addQuestion() {
    const q = newQuestion.trim()
    if (!q) return
    setForm(f => ({ ...f, faq: [...f.faq, q] }))
    setNewQuestion('')
  }

  function removeQuestion(i) {
    setForm(f => ({ ...f, faq: f.faq.filter((_, idx) => idx !== i) }))
  }

  function updateQuestion(i, val) {
    setForm(f => {
      const faq = [...f.faq]
      faq[i] = val
      return { ...f, faq }
    })
  }

  if (loading) return (
    <div style={s.layout}>
      <Navbar />
      <main style={s.main}><p style={{ color: '#aaa', fontSize: 14 }}>Chargement...</p></main>
    </div>
  )

  return (
    <div style={s.layout}>
      <Navbar />
      <main style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>Personnalisation du widget</h1>
          <p style={s.desc}>Modifiez l'apparence et les textes affichés dans votre chatbot.</p>
        </div>

        <div style={s.card}>
          <Section label="Couleur principale">
            <ColorPicker value={form.primaryColor} onChange={v => setForm(f => ({ ...f, primaryColor: v }))} />
          </Section>

          <Divider />

          <Section label="Couleur secondaire (textes & icônes)">
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>
              Cette couleur s'applique à tout ce qui s'affiche <strong>sur fond de couleur principale</strong> : le titre, le sous-titre, le badge "En ligne", les icônes des boutons, les numéros de ticket et les bulles de messages envoyés par le visiteur.
              <br /><br />
              Réglez-la en blanc <span style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '1px 5px', borderRadius: 4 }}>#ffffff</span> si votre couleur principale est foncée, ou en noir <span style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '1px 5px', borderRadius: 4 }}>#000000</span> si elle est très claire.
            </p>
            <ColorPicker value={form.textColor} onChange={v => setForm(f => ({ ...f, textColor: v }))} />
            <div style={{ marginTop: 12, background: form.primaryColor, borderRadius: 10, padding: '14px 16px', display: 'inline-flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontSize: 11, color: form.textColor, fontWeight: 500 }}>En ligne maintenant</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: form.textColor }}>Bonjour 👋</span>
              <span style={{ fontSize: 12, color: form.textColor, opacity: 0.7 }}>Une question ? Nous répondons vite.</span>
            </div>
          </Section>

          <Divider />

          <Section label="Texte d'accueil">
            <input
              type="text"
              value={form.greeting}
              onChange={e => setForm(f => ({ ...f, greeting: e.target.value }))}
              style={s.input}
              placeholder="Bonjour 👋"
            />
          </Section>

          <Divider />

          <Section label="Sous-titre">
            <input
              type="text"
              value={form.subtitle}
              onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              style={s.input}
              placeholder="Une question ? Nous répondons en quelques minutes."
            />
          </Section>

          <Divider />

          <Section label={`Hauteur du widget — ${form.height}px`}>
            <input
              type="range"
              min={400}
              max={800}
              step={10}
              value={form.height}
              onChange={e => setForm(f => ({ ...f, height: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: '#11243e' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb', marginTop: 4 }}>
              <span>400px</span>
              <span>800px</span>
            </div>
          </Section>

          <Divider />

          <Section label="Questions fréquentes">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.faq.map((q, i) => (
                <div key={i} style={s.faqRow}>
                  <input
                    type="text"
                    value={q}
                    onChange={e => updateQuestion(i, e.target.value)}
                    style={{ ...s.input, flex: 1 }}
                  />
                  <button onClick={() => removeQuestion(i)} style={s.removeBtn} title="Supprimer">
                    <IconTrash />
                  </button>
                </div>
              ))}
              <div style={s.faqRow}>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addQuestion()}
                  style={{ ...s.input, flex: 1 }}
                  placeholder="Nouvelle question..."
                />
                <button onClick={addQuestion} style={s.addBtn}>
                  + Ajouter
                </button>
              </div>
            </div>
          </Section>
        </div>

        <div style={s.saveRow}>
          {saved && <span style={s.savedMsg}>Enregistré avec succes</span>}
          <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </main>
    </div>
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 44, height: 36, border: '1px solid #e0e0e0', borderRadius: 8, padding: 2, cursor: 'pointer', background: 'none' }} />
      <span style={{ fontSize: 13, color: '#555', fontFamily: 'monospace' }}>{value}</span>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: value, border: '1px solid rgba(0,0,0,0.08)' }} />
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#f0f0f0' }} />
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

const s = {
  layout: { display: 'flex', minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" },
  main: { marginLeft: 230, flex: 1, padding: '40px 48px', maxWidth: 680 },
  header: { marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 700, color: '#11243e', margin: 0, marginBottom: 6 },
  desc: { fontSize: 13, color: '#888', margin: 0 },
  card: { background: '#fff', borderRadius: 14, border: '1px solid #eaeaea', padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 24 },
  label: { fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { border: '1px solid #e0e0e0', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#111', outline: 'none', fontFamily: 'inherit', background: '#fafafa', width: '100%', boxSizing: 'border-box' },
  colorInput: { width: 44, height: 36, border: '1px solid #e0e0e0', borderRadius: 8, padding: 2, cursor: 'pointer', background: 'none' },
  colorHex: { fontSize: 13, color: '#555', fontFamily: 'monospace' },
  colorPreview: { width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(0,0,0,0.08)' },
  faqRow: { display: 'flex', alignItems: 'center', gap: 8 },
  removeBtn: { background: 'none', border: '1px solid #f0f0f0', borderRadius: 7, padding: '7px 9px', cursor: 'pointer', color: '#bbb', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.1s,border-color 0.1s' },
  addBtn: { background: '#11243e', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' },
  saveRow: { marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 },
  savedMsg: { fontSize: 13, color: '#22c55e', fontWeight: 500 },
  saveBtn: { background: '#11243e', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}
