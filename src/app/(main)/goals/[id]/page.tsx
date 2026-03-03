type GoalDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { id } = await params;

  return <h1 className="text-2xl font-semibold">Goal {id} (placeholder)</h1>;
}
