'use client'

import React from 'react'

type AlertType = 'success' | 'warning' | 'error' | 'info'

interface AlertProps {
  type: AlertType
  title: string
  message?: string
  onClose?: () => void
  icon?: string
}

const defaultIcons = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
}

export default function Alert({
  type,
  title,
  message,
  onClose,
  icon,
}: AlertProps) {
  return (
    <div className={`alert alert-${type}`}>
      <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>
        {icon || defaultIcons[type]}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, marginBottom: message ? '0.25rem' : 0 }}>
          {title}
        </p>
        {message && (
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{message}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            opacity: 0.7,
            padding: 0,
          }}
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  )
}
