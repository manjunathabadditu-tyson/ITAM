'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'asset' | 'user' | 'location' | 'invoice' | 'assetName'
  [key: string]: any
}

interface SearchResults {
  assets: SearchResult[]
  users: SearchResult[]
  locations: SearchResult[]
  invoices: SearchResult[]
  assetNames: SearchResult[]
}

export default function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.getElementById('global-search-input') as HTMLInputElement
        input?.focus()
      }
      if (e.key === 'Escape') {
        setShowResults(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch search results
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`)
        const data = await res.json()
        setResults(data)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [query])

  const saveSearch = (searchQuery: string) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleAssetClick = (id: string, tag: string) => {
    saveSearch(tag)
    router.push(`/inventory?asset=${id}`)
  }

  const handleUserClick = (id: string, name: string) => {
    saveSearch(name)
    router.push(`/admin/users?user=${id}`)
  }

  const handleViewAll = () => {
    if (query.length >= 2) {
      saveSearch(query)
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return '#22c55e'
      case 'Assigned':
        return '#3b82f6'
      case 'Repair':
        return '#f97316'
      case 'Retired':
        return '#78716c'
      case 'Disposed':
        return '#dc2626'
      default:
        return '#5A5A5A'
    }
  }

  const totalResults =
    (results?.assets.length || 0) +
    (results?.users.length || 0) +
    (results?.locations.length || 0) +
    (results?.invoices.length || 0) +
    (results?.assetNames.length || 0)

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          id="global-search-input"
          type="text"
          placeholder="Search assets, users, invoices... (Cmd+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="w-full px-4 py-2 pl-10 pr-4 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white transition"
          style={{ '--color': 'var(--primary)' } as any}
        />
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-4">
              {recentSearches.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Recent Searches
                  </p>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(search)
                          setShowResults(true)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"
                      >
                        🕐 {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="p-4 text-center">
              <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : totalResults === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm">No results for "{query}"</p>
            </div>
          ) : (
            <>
              {/* Assets */}
              {results?.assets && results.assets.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    Assets ({results.assets.length})
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => handleAssetClick(asset.id, asset.tag)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between gap-2 group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {asset.tag}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {asset.model} • {asset.currentHolder || 'Unassigned'}
                          </p>
                        </div>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: `${getStatusColor(asset.status)}15`,
                            color: getStatusColor(asset.status),
                          }}
                        >
                          {asset.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results?.users && results.users.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    Users ({results.users.length})
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserClick(user.id, user.name)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email} • {user.deviceCount} devices
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
                          {user.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {results?.locations && results.locations.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    Locations ({results.locations.length})
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.locations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => {
                          saveSearch(location.name)
                          router.push(`/inventory?location=${location.id}`)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {location.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {location.address}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {location.assetCount} assets
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {results?.invoices && results.invoices.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    Invoices ({results.invoices.length})
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.invoices.map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => {
                          saveSearch(invoice.invoiceNumber)
                          router.push(`/purchase?invoice=${invoice.id}`)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {invoice.vendor} • ${invoice.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {invoice.lineItemCount} items
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View All */}
              {totalResults > 0 && (
                <div className="p-3 border-t border-gray-100 text-center">
                  <button
                    onClick={handleViewAll}
                    className="text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    View all {totalResults} results →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
