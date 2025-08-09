type Props = {
  whatsapp: string
  instagram: string
}

export default function SocialBar({ whatsapp, instagram }: Props) {
  return (
    <div className="social-bar">
      <a className="social-item" href={`https://wa.me/${whatsapp.replace(/[^\\d]/g,'')}`} target="_blank" rel="noreferrer">
        <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.52 3.48C18.24 1.2 15.24 0 12 0 5.37 0 0 5.37 0 12c0 2.1.54 4.14 1.56 5.94L0 24l6.18-1.62C7.92 23.46 9.96 24 12 24c6.63 0 12-5.37 12-12 0-3.24-1.2-6.24-3.48-8.52ZM12 21.6c-1.8 0-3.54-.48-5.1-1.38l-.36-.24-3.66.96.96-3.6-.24-.36C2.7 15.42 2.4 13.74 2.4 12 2.4 6.69 6.69 2.4 12 2.4c2.58 0 5.01 1 6.84 2.82A9.6 9.6 0 0 1 21.6 12c0 5.31-4.29 9.6-9.6 9.6Zm5.46-7.2c-.3-.15-1.77-.87-2.04-.96-.27-.09-.45-.15-.66.15-.21.3-.75.96-.93 1.17-.18.21-.33.24-.63.09-.3-.15-1.26-.46-2.4-1.47-.9-.78-1.5-1.74-1.68-2.04-.18-.3-.02-.45.13-.6.13-.13.3-.33.45-.51.15-.18.21-.3.3-.51.09-.21.03-.39-.03-.54-.06-.15-.66-1.59-.9-2.19-.24-.57-.48-.48-.66-.48-.18 0-.39-.03-.6-.03-.21 0-.54.09-.81.39-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.08 2.88 1.23 3.09.15.21 2.13 3.24 5.16 4.55.72.31 1.29.49 1.73.63.72.23 1.38.2 1.89.12.57-.09 1.77-.72 2.01-1.41.24-.69.24-1.29.18-1.41-.06-.12-.27-.18-.57-.33Z" fill="#25D366"/>
        </svg>
        <span className="label">{formatPhone(whatsapp)}</span>
      </a>
      <a className="social-item" href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">
        <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 2C4.239 2 2 4.239 2 7v10c0 2.761 2.239 5 5 5h10c2.761 0 5-2.239 5-5V7c0-2.761-2.239-5-5-5H7zm0 2h10c1.668 0 3 1.332 3 3v10c0 1.668-1.332 3-3 3H7c-1.668 0-3-1.332-3-3V7c0-1.668 1.332-3 3-3zm11 1a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" fill="#E1306C"/>
        </svg>
        <span className="label">@{instagram}</span>
      </a>
      <a className="social-item" href={`https://maps.app.goo.gl/SwDDanPtfydrRJdb6`} target="_blank" rel="noreferrer">
        <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5Z" fill="#00E676"/>
        </svg>
        <span className="label">Ubicación</span>
      </a>
    </div>
  )
}

function formatPhone(input: string) {
  const digits = input.replace(/[^\\d]/g,'')
  if (digits.length >= 10) {
    return `${digits.slice(0,3)} ${digits.slice(3,6)}-${digits.slice(6,10)}`
  }
  return input
}


