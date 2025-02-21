import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface EdgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string, customLabel?: string) => void;
  defaultType?: string;
  defaultLabel?: string;
}

const relationshipTypes = [
  'Caused by',
  'Led to',
  'Influenced',
  'Part of',
  'Opposed to',
  'Related to',
] as const;

export function EdgeDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  defaultType = 'related-to', 
  defaultLabel 
}: EdgeDialogProps) {
  const [customLabel, setCustomLabel] = useState<string>(defaultLabel || '');
  const [selectedType, setSelectedType] = useState<string>(defaultType);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedType, customLabel || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Relationship Type</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="relationship-type">Relationship Type</Label>
            <Select
              value={selectedType}
              onValueChange={setSelectedType}
            >
              <SelectTrigger id="relationship-type">
                <SelectValue placeholder="Choose relationship type" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem 
                    key={type} 
                    value={type.toLowerCase().replace(/ /g, '-')}
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="custom-label">Custom Label (Optional)</Label>
            <Input
              id="custom-label"
              type="text"
              placeholder="Enter custom label"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}