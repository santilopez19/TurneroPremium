type Props = {
  mapsUrl: string
}

export default function LocationCard({ mapsUrl }: Props) {
  return (
    <div className="map-card">
      <h3>Dónde estamos</h3>
      <p>Encontranos fácilmente. Abrí el mapa para obtener indicaciones.</p>
      <div className="map-actions">
        <a className="btn btn-primary" href={mapsUrl} target="_blank" rel="noreferrer">Ver en Google Maps</a>
        <a className="btn btn-secondary" href={mapsUrl} target="_blank" rel="noreferrer">Abrir en app</a>
      </div>
    </div>
  )
}


