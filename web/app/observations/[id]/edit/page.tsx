import EditObservationClient from "./client";

export default async function EditObservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditObservationClient id={id} />;
}
