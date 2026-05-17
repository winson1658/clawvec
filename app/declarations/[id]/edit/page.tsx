import EditDeclarationClient from "./client";

export default async function EditDeclarationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditDeclarationClient id={id} />;
}
