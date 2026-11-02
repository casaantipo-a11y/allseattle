// Which hosts are business subdomains. One rule for src/proxy.ts (server) and the header
// (browser), so the page the proxy rewrites and the page the header recognises never differ.

export const RESERVED_SUBDOMAINS = new Set(['www', 'admin', 'api', 'app', 'mail'])

/** `mvstar` for `mvstar.allseattle.org` (a port is ignored); null for the root domain, a
 *  reserved name or a deeper host. `root` is ROOT_DOMAIN, lower case, no port. */
export function businessSubdomainOf(host: string, root: string): string | null {
  const name = host.toLowerCase().split(':')[0]
  if (name === root || !name.endsWith(`.${root}`)) return null
  const sub = name.slice(0, -(root.length + 1))
  if (!sub || sub.includes('.') || RESERVED_SUBDOMAINS.has(sub)) return null
  return sub
}
