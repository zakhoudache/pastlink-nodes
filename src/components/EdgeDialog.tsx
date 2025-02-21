
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EdgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string, customLabel?: string) => void;
  defaultType?: string;
}

export function EdgeDialog({ isOpen, onClose, onConfirm, defaultType = 'related-to' }: EdgeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>نوع العلاقة</DialogTitle>
        </DialogHeader>
        <Select onValueChange={(value) => onConfirm(value)} defaultValue={defaultType}>
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع العلاقة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="related-to">مرتبط بـ</SelectItem>
            <SelectItem value="causes">يسبب</SelectItem>
            <SelectItem value="influences">يؤثر على</SelectItem>
            <SelectItem value="part-of">جزء من</SelectItem>
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>
  );
}
