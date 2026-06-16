'use client'

import React from 'react'

interface ModalAction {
  label: string
  onClick: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

interface ModalProps {
  isOpen?: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  actions?: ModalAction[]
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({
  isOpen = true,
  onClose,
  title,
  children,
  footer,
  actions,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const getButtonClass = (action: ModalAction) => {
    const baseClass =
      'px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    }
    return `${baseClass} ${variants[action.variant || 'secondary']}`
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`modal-content ${sizeClasses[size]}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            onClick={onClose}
            className="close-btn"
            aria-label="Close modal"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {(footer || actions) && (
          <div className="modal-footer">
            {actions ? (
              <div className="flex gap-2 justify-end">
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={getButtonClass(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              footer
            )}
          </div>
        )}
      </div>
    </div>
  )
}
