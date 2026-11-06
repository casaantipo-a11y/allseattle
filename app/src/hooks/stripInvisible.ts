import type { CollectionBeforeValidateHook } from 'payload'

import { stripInvisibleDeep } from '../lib/invisible'

/** Cleans the named fields of what an editor pasted in (see lib/invisible.ts) before it is validated and saved. */
export const stripInvisibleFrom =
  (...fields: string[]): CollectionBeforeValidateHook =>
  ({ data }) => {
    if (!data) return data
    const d = data as Record<string, unknown>
    for (const f of fields) if (d[f] != null) d[f] = stripInvisibleDeep(d[f])
    return data
  }
