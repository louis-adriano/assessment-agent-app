'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Copy } from 'lucide-react'

interface ShareResultsButtonProps {
  submissionId: string
}

export function ShareResultsButton({ submissionId }: ShareResultsButtonProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/results/${submissionId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      console.error('Failed to copy link:', error)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopyLink}
      className="text-xs"
    >
      {copied ? (
        <>
          <CheckCircle className="mr-2 h-3 w-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-3 w-3" />
          Copy Link
        </>
      )}
    </Button>
  )
}