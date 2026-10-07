/* eslint-disable @next/next/no-img-element -- static brand assets in the Payload admin */

// AllSeattle branding in the admin: the full logo on the login screen, the pin
// in the navigation. The login screen follows the admin theme, and in the dark one
// the navy "Seattle" of the regular logo was lost on the dark background — there the
// copy with white lettering shows instead (client, 07.10.2026; switch in custom.scss).
export function AdminLogo() {
  const style = { height: 'auto', maxWidth: '100%' }
  return (
    <>
      <img className="as-admin-logo as-admin-logo--light" src="/brand/logo.png" alt="AllSeattle" width={280} height={90} style={style} />
      <img className="as-admin-logo as-admin-logo--dark" src="/brand/logo-dark.png" alt="AllSeattle" width={280} height={90} style={style} />
    </>
  )
}

export function AdminIcon() {
  return <img src="/brand/favicon.svg" alt="AllSeattle" width={24} height={24} />
}
