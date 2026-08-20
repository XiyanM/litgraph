'use client'

import { useState, useEffect } from 'react'
import { CsvImportPanel } from '@/components/CsvImportPanel'

type Book = { id: string; title: string; author: string; description: string | null }

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchBooks = async () => {
    const res = await fetch('/api/books')
    setBooks(await res.json())
  }

  useEffect(() => { fetchBooks() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, description, workKey: selectedWorkKey }),
    })
    setTitle(''); setAuthor(''); setDescription(''); setSelectedWorkKey(null)
    await fetchBooks()
    setLoading(false)
  }

  type Suggestion = { title: string; author: string; workKey: string; coverUrl: string | null }

  // inside Home component, alongside your existing state:
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedWorkKey, setSelectedWorkKey] = useState<string | null>(null)

  useEffect(() => {
    if (selectedWorkKey) return // already picked one — don't re-search
    if (title.trim().length < 2) { setSuggestions([]); return }

    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search-books?q=${encodeURIComponent(title)}`)
      setSuggestions(await res.json())
      setShowSuggestions(true)
    }, 300)

    return () => clearTimeout(timeout) // cancels the pending call if title changes again first
  }, [title, selectedWorkKey])

  const handleSelectSuggestion = (s: Suggestion) => {
    setTitle(s.title)
    setAuthor(s.author)
    setSelectedWorkKey(s.workKey)
    setShowSuggestions(false)
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <h1>Litgraph</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setSelectedWorkKey(null) }}
            required
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul style={{ border: '1px solid #444', marginTop: -4, listStyle: 'none', padding: 0 }}>
              {suggestions.map((s) => (
                <li
                  key={s.workKey}
                  onClick={() => handleSelectSuggestion(s)}
                  style={{ padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {s.coverUrl && <img src={s.coverUrl} alt="" style={{ width: 32, height: 48, objectFit: 'cover' }} />}
                  <span><strong>{s.title}</strong> — {s.author}</span>
                </li>

              ))}
            </ul>
          )}
        </div>
        <input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
        <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Book'}</button>
      </form>
      <CsvImportPanel onImported={fetchBooks} />
      <ul style={{ marginTop: 24 }}>
        {books.map((b) => <li key={b.id}><strong>{b.title}</strong> by {b.author}</li>)}
      </ul>
    </main>
  )
}

