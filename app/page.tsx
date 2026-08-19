'use client'

import { useState, useEffect } from 'react'

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
      body: JSON.stringify({ title, author, description }),
    })
    setTitle(''); setAuthor(''); setDescription('')
    await fetchBooks()
    setLoading(false)
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <h1>Litgraph</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
        <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Book'}</button>
      </form>
      <ul style={{ marginTop: 24 }}>
        {books.map((b) => <li key={b.id}><strong>{b.title}</strong> by {b.author}</li>)}
      </ul>
    </main>
  )
}