import { customerFrom, overPhotoLimit, payloadClient, PHOTO_LIMIT_ERROR, storePhoto } from '@/lib/cabinet'
import { MAX_BYTES, PHOTO_TYPES, badPhoto } from '@/lib/forms'
import { mediaUrl } from '@/lib/media'

// POST /api/account/photos — one car photo from the listing form, uploaded as soon
// as it is picked (multipart, field `file`). Vercel takes at most 4.5 MB per request,
// so ten photos can't travel with the form; the form sends only their ids when it
// saves (lib/cabinet.ts takePhotos). The file is stored in Media as the account's own
// and `staged`: the daily cron deletes it after 24 hours unless a listing took it.

export const maxDuration = 30

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request) {
  const customer = await customerFrom(req)
  if (!customer) return json({ error: 'Please log in first.' }, 401)
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return json({ error: 'Could not read the photo. It may be too large.' }, 400)
  }
  const file = fd.get('file')
  if (typeof file !== 'object' || file === null || !('size' in file) || !file.size) return json({ error: 'No photo was sent.' }, 400)
  if (!PHOTO_TYPES.includes(file.type)) return json({ error: 'JPEG, PNG or WebP only.' }, 400)
  if (file.size > MAX_BYTES) return json({ error: 'The photo is larger than 10 MB.' }, 400)
  if (await badPhoto(file as File)) return json({ error: "The picture can't be read, or it is not a JPEG, PNG or WebP." }, 400)

  const payload = await payloadClient()
  if (await overPhotoLimit(payload, customer.id)) return json({ error: PHOTO_LIMIT_ERROR }, 429)
  try {
    const m = await storePhoto(payload, customer, file as File, 'Car photo', true)
    // Parallel requests can all pass the check above: look again now that this photo exists.
    if (await overPhotoLimit(payload, customer.id, m.id)) {
      await payload.delete({ collection: 'media', id: m.id, overrideAccess: true }).catch((e) => console.error('[photos] could not drop an over-limit photo', e))
      return json({ error: PHOTO_LIMIT_ERROR }, 429)
    }
    return json({ id: m.id, url: mediaUrl(m, 'thumb') ?? '' })
  } catch (e) {
    console.error('[photos] could not store a photo', e)
    return json({ error: 'Could not upload the photo. Please try again.' }, 500)
  }
}
