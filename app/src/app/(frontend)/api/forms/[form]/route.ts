import { FORMS, type FormKey, handleForm } from '@/lib/forms'

// POST /api/forms/{business-registration|ad-inquiry} — the public forms'
// only way into the database. (Payload's own REST API refuses to create
// submissions: `create: () => false`.)
export async function POST(req: Request, { params }: { params: Promise<{ form: string }> }) {
  const { form } = await params
  if (!(form in FORMS)) return Response.json({ error: 'Unknown form' }, { status: 404 })
  return handleForm(form as FormKey, req)
}
