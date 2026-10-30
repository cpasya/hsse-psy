// "use client";

// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import { EmployeeForm } from "./employee-form";
// import { type EmployeeFormValues } from "../schemas";

// interface EmployeeDialogProps {
//     isOpen: boolean;
//     onClose: () => void;
//     initialData?: EmployeeFormValues | null; // Kalau null berarti mode Add, kalau ada isinya berarti mode Edit
//     onSubmit: (data: EmployeeFormValues) => Promise<void>;
//     isLoading?: boolean;
// }

// export function EmployeeDialog({
//     isOpen,
//     onClose,
//     initialData,
//     onSubmit,
//     isLoading,
// }: EmployeeDialogProps) {
//     const isEditing = !!initialData;

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="sm:max-w-[425px]">
//                 <DialogHeader>
//                     <DialogTitle>
//                         {isEditing ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
//                     </DialogTitle>
//                 </DialogHeader>

//                 {/* Render Form */}
//                 <EmployeeForm
//                     initialData={initialData}
//                     onSubmit={onSubmit}
//                     isLoading={isLoading}
//                 />
//             </DialogContent>
//         </Dialog>
//     );
// }