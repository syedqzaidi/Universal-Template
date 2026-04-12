'use client'

import React, { useState } from 'react'

const DeployButton: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')

  const handleDeploy = async () => {
    setStatus('deploying')
    try {
      // Proxy through server-side API route to avoid CORS issues
      // with external webhook URLs (Vercel, Cloudflare deploy hooks)
      const res = await fetch('/api/deploy', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        alert(data.error || 'Deploy failed')
        setStatus('error')
      }
    } catch (err) {
      console.error('Deploy failed:', err)
      setStatus('error')
    }
  }

  return (
    <button
      onClick={handleDeploy}
      disabled={status === 'deploying'}
      style={{
        padding: '8px 16px',
        backgroundColor: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: status === 'deploying' ? 'wait' : 'pointer',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {status === 'idle' && 'Deploy Astro Site'}
      {status === 'deploying' && 'Deploying...'}
      {status === 'success' && 'Deploy Triggered!'}
      {status === 'error' && 'Deploy Failed - Retry'}
    </button>
  )
}

export default DeployButton
