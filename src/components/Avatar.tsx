import { initialsOf } from '../store'

type Props = {
  name: string
  photo: string | null
  size?: number
  ring?: boolean
}

export default function Avatar({ name, photo, size = 64, ring = false }: Props) {
  return (
    <span
      className={ring ? 'avatar ring' : 'avatar'}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden={photo ? undefined : true}
    >
      {photo ? <img src={photo} alt={name} /> : <span>{initialsOf(name) || 'L'}</span>}
    </span>
  )
}
