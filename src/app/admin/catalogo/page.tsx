import { listCatalog } from "@/features/admin-catalog/queries";
import { CatalogManager } from "@/components/admin/CatalogManager";

export const metadata = { title: "Catalog • Admin CLUP" };

export default async function CatalogoPage() {
  const faculties = await listCatalog();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
      <p className="mt-1 text-gray-600">
        Faculties and their programs. Students pick one during onboarding; the passing minimum can
        be overridden per faculty or per program on each exam.
      </p>

      <div className="mt-6">
        <CatalogManager
          faculties={faculties.map((faculty) => ({
            id: faculty.id,
            name: faculty.name,
            order: faculty.order,
            isExternal: faculty.isExternal,
            active: faculty.active,
            careers: faculty.careers.map((career) => ({
              id: career.id,
              name: career.name,
              order: career.order,
              active: career.active,
            })),
          }))}
        />
      </div>
    </div>
  );
}
