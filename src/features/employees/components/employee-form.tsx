// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Button } from "@/components/ui/button";
// // Sesuaikan import ini dengan schema asli lu
// import { employeeSchema, type EmployeeFormValues } from "../schemas";

// interface EmployeeFormProps {
//     initialData?: EmployeeFormValues | null;
//     onSubmit: (data: EmployeeFormValues) => void;
//     isLoading?: boolean;
// }

// export function EmployeeForm({ initialData, onSubmit, isLoading }: EmployeeFormProps) {
//     const form = useForm<EmployeeFormValues>({
//         resolver: zodResolver(employeeSchema),
//         defaultValues: initialData || {
//             name: "",
//             position: "",
//             department: "",
//         },
//     });

//     return (
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             {/* Field Nama */}
//             <div className="space-y-2">
//                 <label className="text-sm font-medium">Nama Lengkap</label>
//                 <input
//                     {...form.register("name")}
//                     className="w-full p-2 border rounded-md"
//                     placeholder="Masukkan nama"
//                 />
//                 {form.formState.errors.name && (
//                     <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
//                 )}
//             </div>

//             {/* Field Posisi */}
//             <div className="space-y-2">
//                 <label className="text-sm font-medium">Jabatan</label>
//                 <input
//                     {...form.register("position")}
//                     className="w-full p-2 border rounded-md"
//                     placeholder="Masukkan jabatan"
//                 />
//             </div>

//             <div className="pt-4 flex justify-end">
//                 <Button type="submit" disabled={isLoading}>
//                     {isLoading ? "Menyimpan..." : "Simpan Data"}
//                 </Button>
//             </div>
//         </form>
//     );
// }