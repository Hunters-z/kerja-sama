// Verifikasi sidik jari via WebAuthn (platform authenticator)
export const webauthnSupported = () => !!window.PublicKeyCredential
export async function enroll(user) {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'zonakerja.' },
      user: { id: new TextEncoder().encode(user.id), name: user.username, displayName: user.name },
      pubKeyCredParams: [{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection: { authenticatorAttachment:'platform', userVerification:'required', residentKey:'preferred' },
      timeout: 60000,
    },
  })
  return cred.id
}
export async function verify() {
  await navigator.credentials.get({
    publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), userVerification:'required', timeout:60000 },
  })
  return true
}
