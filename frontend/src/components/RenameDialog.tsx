"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, FileText } from "lucide-react"

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTitle: string
  onRename: (newTitle: string) => void
  isLoading?: boolean
}

export default function ImprovedRenameDialog({
  open,
  onOpenChange,
  currentTitle,
  onRename,
  isLoading = false,
}: RenameDialogProps) {
  const [title, setTitle] = useState(currentTitle)

  useEffect(() => {
    if (open) {
      setTitle(currentTitle)
    }
  }, [open, currentTitle])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && title.trim() !== currentTitle) {
      onRename(title.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#F6F5F2] border-black/10">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C0C9EE] rounded-full flex items-center justify-center">
              <Edit className="w-4 h-4 text-black/70" />
            </div>
            <DialogTitle className="text-lg font-semibold text-black">Rename Conversation</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-2">
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40" />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter conversation title..."
                className="pl-10 h-11 bg-white border-0 focus:border-0 focus:ring-0 text-black placeholder:text-black/40 focus:outline-none"
                autoFocus
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-black/50 mt-2">
              Choose a descriptive name to help you find this conversation later
            </p>
          </div>

          <DialogFooter className="pt-6 flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-6 bg-transparent border-black/20 text-black/70 hover:bg-black/5 hover:text-black transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || title.trim() === currentTitle || isLoading}
              className="px-6 bg-black hover:bg-black/90 text-white transition-all duration-200 hover:shadow-md transform hover:translate-y-[-1px] active:translate-y-0"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Renaming...
                </div>
              ) : (
                "Rename"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
