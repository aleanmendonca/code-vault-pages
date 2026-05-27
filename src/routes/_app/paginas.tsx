import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/_app/paginas")({
  head: () => ({ meta: [{ title: "Páginas — Cloud Code Vault" }] }),
  component: () => <ProjectsList type="pagina" title="Páginas" />,
});
