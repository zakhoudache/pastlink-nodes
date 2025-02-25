// import { useState, useCallback, useRef, useEffect } from 'react';
// import { Handle, Position } from 'reactflow';
// import { Card } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Pencil, Trash } from 'lucide-react';

// export type NodeType =
//   | 'event'
//   | 'person'
//   | 'cause'
//   | 'political'
//   | 'economic'
//   | 'social'
//   | 'cultural'
//   | 'term'
//   | 'date'
//   | 'goal'
//   | 'indicator'
//   | 'country'
//   | 'other';

// export interface HistoricalNodeData extends Record<string, unknown> {
//   label: string;
//   type: NodeType;
//   description?: string;
// }

// interface Props {
//   data: HistoricalNodeData;
//   isConnectable: boolean;
//   id: string;
//   selected: boolean;
// }

// const typeIcons: Record<NodeType, string> = {
//   event: '📅',
//   person: '👤',
//   cause: '⚡',
//   political: '🏛️',
//   economic: '💰',
//   social: '👥',
//   cultural: '🎭',
//   term: '📖',
//   date: '⏰',
//   goal: '🎯',
//   indicator: '📊',
//   country: '🌍',
//   other: '❔',
// };

// const typeLabels: Record<NodeType, string> = {
//   event: 'حدث',
//   person: 'شخصية',
//   cause: 'سبب',
//   political: 'سياسي',
//   economic: 'اقتصادي',
//   social: 'اجتماعي',
//   cultural: 'ثقافي',
//   term: 'مصطلح',
//   date: 'تاريخ',
//   goal: 'هدف',
//   indicator: 'مؤشر',
//   country: 'دولة',
//   other: 'آخر',
// };

// const typeColors: Record<NodeType, { bg: string; border: string; text: string; shape: string }> = {
//   event: { 
//     bg: 'bg-blue-100', 
//     border: 'border-blue-500', 
//     text: 'text-blue-900',
//     shape: 'rounded-lg' 
//   },
//   person: { 
//     bg: 'bg-purple-100', 
//     border: 'border-purple-500', 
//     text: 'text-purple-900',
//     shape: 'rounded-full' 
//   },
//   cause: { 
//     bg: 'bg-red-100', 
//     border: 'border-red-500', 
//     text: 'text-red-900',
//     shape: 'rounded-lg' 
//   },
//   political: { 
//     bg: 'bg-indigo-100', 
//     border: 'border-indigo-500', 
//     text: 'text-indigo-900',
//     shape: 'rounded-lg' 
//   },
//   economic: { 
//     bg: 'bg-amber-100', 
//     border: 'border-amber-500', 
//     text: 'text-amber-900',
//     shape: 'rounded-lg' 
//   },
//   social: { 
//     bg: 'bg-pink-100', 
//     border: 'border-pink-500', 
//     text: 'text-pink-900',
//     shape: 'rounded-lg' 
//   },
//   cultural: { 
//     bg: 'bg-teal-100', 
//     border: 'border-teal-500', 
//     text: 'text-teal-900',
//     shape: 'rounded-lg' 
//   },
//   term: { 
//     bg: 'bg-slate-100', 
//     border: 'border-slate-500', 
//     text: 'text-slate-900',
//     shape: 'rounded-lg' 
//   },
//   date: { 
//     bg: 'bg-orange-100', 
//     border: 'border-orange-500', 
//     text: 'text-orange-900',
//     shape: 'rounded-lg' 
//   },
//   goal: { 
//     bg: 'bg-emerald-100', 
//     border: 'border-emerald-500', 
//     text: 'text-emerald-900',
//     shape: 'rounded-diamond' 
//   },
//   indicator: { 
//     bg: 'bg-cyan-100', 
//     border: 'border-cyan-500', 
//     text: 'text-cyan-900',
//     shape: 'rounded-lg' 
//   },
//   country: { 
//     bg: 'bg-green-100', 
//     border: 'border-green-500', 
//     text: 'text-green-900',
//     shape: 'rounded-lg' 
//   },
//   other: { 
//     bg: 'bg-gray-100', 
//     border: 'border-gray-500', 
//     text: 'text-gray-900',
//     shape: 'rounded-lg' 
//   },
// };

// export default function HistoricalNode({ data, isConnectable, id, selected }: Props) {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editedData, setEditedData] = useState<HistoricalNodeData>(data);
//   const [isHovered, setIsHovered] = useState(false);
//   const nodeRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!isDialogOpen) {
//       setEditedData(data);
//     }
//   }, [isDialogOpen, data]);

//   const handleEdit = useCallback((event: React.MouseEvent) => {
//     event.stopPropagation();
//     setIsDialogOpen(true);
//   }, []);

//   const handleDelete = useCallback((event: React.MouseEvent) => {
//     event.stopPropagation();
//     const event2 = new CustomEvent('deleteNode', {
//       detail: { id },
//     });
//     window.dispatchEvent(event2);
//   }, [id]);

//   const handleSave = useCallback(() => {
//     if (!editedData.label.trim()) {
//       return; // Don't save if label is empty
//     }
//     const event = new CustomEvent('updateNodeData', {
//       detail: { id, data: editedData },
//     });
//     window.dispatchEvent(event);
//     setIsDialogOpen(false);
//   }, [id, editedData]);

//   if (!data) {
//     return <div>خطأ: لم يتم توفير البيانات</div>;
//   }

//   const { type, label, description } = data;
//   const colors = typeColors[type] || typeColors.other;

//   return (
//     <>
//       <Card
//         className={`relative shadow-md ${colors.bg} ${colors.border} border-2 ${colors.shape} ${
//           selected ? 'ring-2 ring-blue-500' : ''
//         } transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2`}
//         dir="rtl"
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//         tabIndex={0}
//         ref={nodeRef}
//         style={{ 
//           width: 160,
//           minHeight: 60,
//           maxHeight: 100
//         }}
//       >
//         <Handle
//           type="target"
//           position={Position.Top}
//           isConnectable={isConnectable}
//           style={{ backgroundColor: colors.border.replace('border-', 'bg-') }}
//         />
        
//         {/* Edit/Delete Controls */}
//         {isHovered && (
//           <div className="absolute top-1 left-1 flex gap-1 bg-white/80 rounded p-1 backdrop-blur-sm">
//             <Button
//               size="sm"
//               variant="ghost"
//               className={`h-6 w-6 p-0 ${colors.text} hover:${colors.bg}`}
//               onClick={handleEdit}
//             >
//               <Pencil className="h-4 w-4" />
//             </Button>
//             <Button
//               size="sm"
//               variant="ghost"
//               className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
//               onClick={handleDelete}
//             >
//               <Trash className="h-4 w-4" />
//             </Button>
//           </div>
//         )}

//         <div className="p-2">
//           <div className="flex items-center gap-2 mb-1">
//             <span className="text-base" role="img" aria-label={typeLabels[type]}>
//               {typeIcons[type]}
//             </span>
//             <div>
//               <div className={`text-xs font-medium ${colors.text}`}>
//                 {typeLabels[type]}
//               </div>
//               <div className={`font-semibold text-sm leading-tight ${colors.text}`}>
//                 {label}
//               </div>
//             </div>
//           </div>
//           {description && (
//             <p className={`text-xs ${colors.text} opacity-75 line-clamp-2`}>
//               {description}
//             </p>
//           )}
//         </div>
//         <Handle
//           type="source"
//           position={Position.Bottom}
//           isConnectable={isConnectable}
//           style={{ backgroundColor: colors.border.replace('border-', 'bg-') }}
//         />
//       </Card>

//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>تحرير العنصر</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <label className="text-sm font-medium">العنوان</label>
//               <Input
//                 value={editedData.label}
//                 onChange={(e) => setEditedData((prev) => ({ ...prev, label: e.target.value }))}
//                 className="mt-1"
//                 dir="rtl"
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium">الوصف</label>
//               <Textarea
//                 value={editedData.description || ''}
//                 onChange={(e) => setEditedData((prev) => ({ ...prev, description: e.target.value }))}
//                 className="mt-1"
//                 dir="rtl"
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium">النوع</label>
//               <Select 
//                 value={editedData.type}
//                 onValueChange={(value: NodeType) => setEditedData((prev) => ({ ...prev, type: value }))}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="اختر النوع" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {Object.entries(typeLabels).map(([key, label]) => (
//                     <SelectItem key={key} value={key}>
//                       <span className="flex items-center gap-2">
//                         <span>{typeIcons[key as NodeType]}</span>
//                         <span>{label}</span>
//                       </span>
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={() => setIsDialogOpen(false)}
//                 className="ml-2"
//               >
//                 إلغاء
//               </Button>
//               <Button 
//                 onClick={handleSave}
//                 disabled={!editedData.label.trim()}
//               >
//                 حفظ
//               </Button>
//             </DialogFooter>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
