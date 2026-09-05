import { listAllInstructions } from "@/features/admin-instructions/queries";
import { InstructionsManager } from "@/components/admin/InstructionsManager";

export const metadata = { title: "Instructions • Admin CLUP" };

export default async function AdminInstructionsPage() {
  const instructions = await listAllInstructions();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Instructions</h1>
      <p className="mt-1 text-gray-600">Manage the instructions shown on the public page.</p>
      <div className="mt-6">
        <InstructionsManager instructions={instructions} />
      </div>
    </div>
  );
}
