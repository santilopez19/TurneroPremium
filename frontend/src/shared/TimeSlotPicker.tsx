type Props = {
  slots: string[]
  selected: string
  onSelect: (s: string) => void
}

export default function TimeSlotPicker({ slots, selected, onSelect }: Props) {
  if (!slots?.length) {
    return <div className="empty">No hay horarios disponibles para esta fecha.</div>
  }
  return (
    <div className="slots">
      {slots.map(s => (
        <button
          key={s}
          type="button"
          className={s === selected ? 'slot selected' : 'slot'}
          onClick={() => onSelect(s)}
        >
          {s}
        </button>
      ))}
    </div>
  )
}


