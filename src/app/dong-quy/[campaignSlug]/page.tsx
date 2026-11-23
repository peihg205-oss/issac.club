import MemberPaymentPortalClient from '@/components/finance/MemberPaymentPortalClient'

export function generateStaticParams() {
  return [
    { campaignSlug: 'quy-thang-11-2026' },
    { campaignSlug: 'su-kien-first-meeting' },
  ]
}

export default async function Page({
  params,
}: {
  params: Promise<{ campaignSlug: string }>
}) {
  const resolved = await params
  return <MemberPaymentPortalClient campaignSlug={resolved.campaignSlug} />
}

