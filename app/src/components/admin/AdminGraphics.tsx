/* eslint-disable @next/next/no-img-element -- static brand assets in the Payload admin */

// AllSeattle branding in the admin: the full logo on the login screen, the pin
// in the navigation.
export function AdminLogo() {
  return <img src="/brand/logo.png" alt="AllSeattle" width={280} height={90} style={{ height: 'auto', maxWidth: '100%' }} />
}

export function AdminIcon() {
  return <img src="/brand/favicon.svg" alt="AllSeattle" width={24} height={24} />
}
