import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/modules/components/ui/dialog';
import { Button } from '@/modules/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/modules/components/ui/select';

interface StatusUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  currentStatus: string;
  onSubmit: (newStatus: string, reason: string) => void;
}

export function StatusUpdateDialog({ open, onClose, currentStatus, onSubmit }: StatusUpdateDialogProps) {
  const [newStatus, setNewStatus] = useState<string>(currentStatus);
  const [reason, setReason] = useState<string>('');

  const handleSave = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for status change.');
      return;
    }
    onSubmit(newStatus, reason);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Shipment Status</DialogTitle>
          <DialogDescription>Provide a reason for the change. This will be recorded for audit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <label className="block text-sm font-medium text-[#1A5D56]">New Status</label>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Transit">In Transit</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <label className="block text-sm font-medium text-[#1A5D56]">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-[#39B5A8]/10 p-2 text-sm focus-visible:border-[#39B5A8]/30 focus-visible:ring-[#39B5A8]/15"
            placeholder="Reason for status change..."
          />
        </div>
        <DialogFooter className="flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
