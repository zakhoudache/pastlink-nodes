// EdgeDialog.tsx
'use client';

import React, { useState, useCallback } from 'react';  // IMPORT these 
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EdgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string, customLabel?: string) => void;
  defaultType?: string;
  defaultLabel?: string;
}

export function EdgeDialog({ isOpen, onClose, onConfirm, defaultType = 'related-to', defaultLabel }: EdgeDialogProps) {
  const [customLabel, setCustomLabel] = useState<string | undefined>(defaultLabel);
  const [selectedType, setSelectedType] = useState<string>(defaultType);

  const handleConfirm = () => {
    onConfirm(selectedType, customLabel);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Relationship Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <Select defaultValue={defaultType} onValueChange={(value) => setSelectedType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose relationship type" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase().replace(/ /g, '-')}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Custom Label (Optional)</Label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter custom label"
              value={customLabel || ''}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const relationshipTypes = [
  'Caused by',
  'Led to',
  'Influenced',
  'Part of',
  'Opposed to',
  'Related to',
];