import NotionLinkScreen from "@/components/screens/notion-link-screen"

export default async function NotionLinkPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  return <NotionLinkScreen projectId={projectId} />
}