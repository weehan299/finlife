type DecisionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DecisionDetailPage({
  params,
}: DecisionDetailPageProps) {
  const { id } = await params;

  return (
    <h1 className="text-2xl font-semibold">Decision {id} (placeholder)</h1>
  );
}
