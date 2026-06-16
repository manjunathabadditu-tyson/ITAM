'use client'

import React from 'react'

interface SkeletonCardProps {
  count?: number
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
        </div>
      ))}
    </>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
}

export function SkeletonTable({ rows = 5, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <div className="skeleton skeleton-text" style={{ width: '100%', height: '1rem' }}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j}>
                    <div className="skeleton skeleton-text" style={{ width: '100%', height: '1rem' }}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface SkeletonGridProps {
  count?: number
  columns?: number
}

export function SkeletonGrid({ count = 6, columns = 3 }: SkeletonGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '1.5rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: '1rem' }}></div>
          <div className="skeleton skeleton-text" style={{ marginBottom: '1rem' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '1rem' }}></div>
          <div style={{ paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
            <div className="skeleton skeleton-text" style={{ width: '100%', height: '2rem' }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonStatCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: '1rem' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '80%', height: '2.5rem', marginBottom: '1rem' }}></div>
          <div className="skeleton" style={{ width: '4rem', height: '0.25rem', borderRadius: '4px' }}></div>
        </div>
      ))}
    </div>
  )
}

interface SkeletonProps {
  type?: 'text' | 'card' | 'table' | 'grid' | 'statCards'
  count?: number
  columns?: number
}

export default function SkeletonLoader({
  type = 'card',
  count = 1,
  columns = 3,
}: SkeletonProps) {
  switch (type) {
    case 'text':
      return <div className="skeleton skeleton-text"></div>
    case 'table':
      return <SkeletonTable rows={count} columns={columns} />
    case 'grid':
      return <SkeletonGrid count={count} columns={columns} />
    case 'statCards':
      return <SkeletonStatCards />
    case 'card':
    default:
      return <SkeletonCard count={count} />
  }
}
