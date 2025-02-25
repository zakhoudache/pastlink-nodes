// import React, { useState } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Button } from '@/components/ui/button'; // Import Button

// interface EdgeDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: (type: string) => void;
//   defaultType?: string;
// }

// export function EdgeDialog({
//   isOpen,
//   onClose,
//   onConfirm,
//   defaultType = 'related-to',
// }: EdgeDialogProps) {
//   const [selectedValue, setSelectedValue] = useState(defaultType);

//   const handleConfirm = () => {
//     onConfirm(selectedValue);
//     onClose();
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Select Relationship Type</DialogTitle>
//         </DialogHeader>
//         <div className="grid gap-4 py-4">
//           <Select value={selectedValue} onValueChange={setSelectedValue}>
//             <SelectTrigger>
//               <SelectValue placeholder="اختر نوع العلاقة" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="related-to">مرتبط بـ</SelectItem>
//               <SelectItem value="causes">يسبب</SelectItem>
//               <SelectItem value="influences">يؤثر على</SelectItem>
//               <SelectItem value="part-of">جزء من</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//         <DialogFooter>
//           <Button type="button" variant="secondary" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button onClick={handleConfirm}>Confirm</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }