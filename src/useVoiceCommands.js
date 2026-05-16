import { useRef, useCallback } from 'react'

export function getContacts() {
  return JSON.parse(localStorage.getItem('vaiga_contacts') || '{}')
}

const openURL = (url) => {
  window.parent.postMessage({ type: 'vaiga-open-url', url }, '*')
  setTimeout(() => window.open(url, '_blank'), 300)
}

export function useVoiceCommands() {
  const pendingCommandRef = useRef(null)

  const handleVoiceCommand = useCallback((text) => {
    const t        = text.toLowerCase().trim()
    const CONTACTS = getContacts()

    // ── WhatsApp confirmation ──
    if (pendingCommandRef.current) {
      if (t.includes('yes') || t.includes('send') || t.includes('ok') || t.includes('sure')) {
        const { phone, message, name } = pendingCommandRef.current
        pendingCommandRef.current = null
        window.parent.postMessage({ type: 'vaiga-whatsapp-send', phone, message }, '*')
        return `Message sent to ${name}!`
      }
      if (t.includes('no') || t.includes('cancel') || t.includes('stop')) {
        pendingCommandRef.current = null
        return 'Cancelled. Message not sent.'
      }
    }

    // ── WhatsApp send ──
    const waMatch =
      t.match(/send (?:message )?to (\w+)\s+(.+)/) ||
      t.match(/whatsapp (?:to )?(\w+)\s+(.+)/) ||
      t.match(/message (\w+)\s+(.+)/)
    if (waMatch) {
      const name    = waMatch[1].toLowerCase()
      const message = waMatch[2]
      const phone   = CONTACTS[name]
      if (!phone) return `I don't have ${name}'s number. Add it in Contacts.`
      pendingCommandRef.current = { phone, message, name }
      return `Sending "${message}" to ${name}. Say yes to confirm or no to cancel.`
    }

    // ── YouTube ──
    const ytMatch =
      t.match(/play (.+?) (?:on youtube|on yt|song|music)/) ||
      t.match(/youtube (.+)/)
    if (ytMatch) {
      openURL(`https://youtube.com/search?q=${encodeURIComponent(ytMatch[1])}`)
      return `Opening YouTube for "${ytMatch[1]}"`
    }

    // ── Open apps ──
    if (t.includes('open gmail'))        { openURL('https://gmail.com');           return 'Opening Gmail' }
    if (t.includes('open youtube'))      { openURL('https://youtube.com');         return 'Opening YouTube' }
    if (t.includes('open whatsapp'))     { openURL('https://web.whatsapp.com');    return 'Opening WhatsApp Web' }
    if (t.includes('open maps') || t.includes('open google maps')) { openURL('https://maps.google.com'); return 'Opening Google Maps' }
    if (t.includes('open instagram'))    { openURL('https://instagram.com');       return 'Opening Instagram' }
    if (t.includes('open twitter') || t.includes('open x')) { openURL('https://x.com'); return 'Opening X' }
    if (t.includes('open linkedin'))     { openURL('https://linkedin.com');        return 'Opening LinkedIn' }
    if (t.includes('open github'))       { openURL('https://github.com');          return 'Opening GitHub' }
    if (t.includes('open netflix'))      { openURL('https://netflix.com');         return 'Opening Netflix' }
    if (t.includes('open spotify'))      { openURL('https://open.spotify.com');    return 'Opening Spotify' }
    if (t.includes('open drive') || t.includes('open google drive')) { openURL('https://drive.google.com'); return 'Opening Google Drive' }
    if (t.includes('open calendar'))     { openURL('https://calendar.google.com'); return 'Opening Calendar' }
    if (t.includes('open azure'))        { openURL('https://portal.azure.com');    return 'Opening Azure' }

    // ── Open website ──
    const siteMatch = t.match(/open ([\w.-]+\.(com|org|in|net|io|edu|gov))/)
    if (siteMatch) {
      openURL(`https://${siteMatch[1]}`)
      return `Opening ${siteMatch[1]}`
    }

    // ── Google search ──
    const searchMatch =
      t.match(/search (?:for |about )?(.+)/) ||
      t.match(/google (.+)/)
    if (searchMatch) {
      openURL(`https://google.com/search?q=${encodeURIComponent(searchMatch[1])}`)
      return `Searching for "${searchMatch[1]}"`
    }

    return null
  }, [])

  return { handleVoiceCommand }
}