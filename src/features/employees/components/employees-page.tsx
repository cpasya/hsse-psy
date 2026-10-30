// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { EmployeeDialog } from "./employee-dialog";
// import { type EmployeeFormValues } from "../schemas";
// // Import DataTable lu di sini
// // import { DataTable } from "@/components/shared/data-table"; 

// export default function EmployeesPage() {
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [selectedEmployee, setSelectedEmployee] = useState<EmployeeFormValues | null>(null);
//     const [isLoading, setIsLoading] = useState(false);

//     // Trigger untuk tombol "Add"
//     const handleAddClick = () => {
//         setSelectedEmployee(null); // Reset data untuk form kosong
//         setIsDialogOpen(true);
//     };

//     // Trigger untuk tombol "Edit" di baris tabel
//     const handleEditClick = (employee: EmployeeFormValues) => {
//         setSelectedEmployee(employee); // Isi data ke form
//         setIsDialogOpen(true);
//     };

//     const handleCloseDialog = () => {
//         setIsDialogOpen(false);
//         setSelectedEmployee(null);
//     };

//     const handleSubmit = async (data: EmployeeFormValues) => {
//         setIsLoading(true);
//         try {
//             if (selectedEmployee) {
//                 // Panggil fungsi Update API (misal dari React Query mutation)
//                 console.log("Update Data:", data);
//             } else {
//                 // Panggil fungsi Create API
//                 console.log("Create Data:", data);
//             }

//             // Tutup modal setelah sukses
//             handleCloseDialog();
//         } catch (error) {
//             console.error(error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="flex flex-col gap-4 p-6">
//             <div className="flex items-center justify-between">
//                 <h1 className="text-2xl font-bold">Data Karyawan</h1>
//                 <Button onClick={handleAddClick}>
//                     Tambah Karyawan
//                 </Button>
//             </div>

//             {/* Mocking Tabel - Aslinya ganti pakai DataTable lu */}
//             <div className="border rounded-md p-4 mt-4">
//                 <p>Tabel Karyawan (Data Table) render di sini</p>
//                 <Button
//                     variant="outline"
//                     // size="sm"
//                     className="mt-2"
//                     onClick={() => handleEditClick({ name: "John Doe", position: "IT Staff", department: "IT" })}
//                 >
//                     Mock: Edit Karyawan "John Doe"
//                 </Button>
//             </div>

//             {/* Dialog Modal */}
//             <EmployeeDialog
//                 isOpen={isDialogOpen}
//                 onClose={handleCloseDialog}
//                 initialData={selectedEmployee}
//                 onSubmit={handleSubmit}
//                 isLoading={isLoading}
//             />
//         </div>
//     );
// }