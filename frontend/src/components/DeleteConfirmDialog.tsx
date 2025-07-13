"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onConfirm: () => void
  isLoading?: boolean
}

export default function ImprovedDeleteDialog({
  open,
  onOpenChange,
  title,
  onConfirm,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

      return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-[#F6F5F2] border-black/10">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-black">Delete Conversation</DialogTitle>
            </div>
          </DialogHeader>

          <div className="py-2">
            <div className="p-4 bg-white rounded-lg border border-black/10 mb-4">
              <p className="font-medium text-black text-sm mb-1">"{title}"</p>
              <p className="text-xs text-black/50">Conversation will be permanently deleted</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> All messages and the PDF document will be permanently deleted.
              </p>
            </div>
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
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-6 bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:shadow-md transform hover:translate-y-[-1px] active:translate-y-0"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
}
