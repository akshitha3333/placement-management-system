// LocationView.jsx
// Read-only map — shows a pinned location from saved lat/lng
// Used in: Company Profile, Interview location, Tutor student-location page
//
// Props:
//   lat     {string|number}
//   lng     {string|number}
//   label   {string}  — optional label shown on the pin popup
//   height  {number}  — map height in px (default 250)
//
// Usage:
//   <LocationView lat={company.latitude} lng={company.longitude} label={company.companyName} />

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 15);
  }, [center[0], center[1]]);
  return null;
}

function LocationView({ lat, lng, label = "Location", height = 250 }) {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const valid = !isNaN(parsedLat) && !isNaN(parsedLng);

  if (!valid) {
    return (
      <div style={{
        height, borderRadius: 10, border: "1px solid var(--border-color)",
        background: "var(--gray-100)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <p className="fs-p9 text-secondary">No location set.</p>
      </div>
    );
  }

  const center = [parsedLat, parsedLng];

  return (
    <div>
      <div style={{ height, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-color)" }}>
        <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false} dragging={true} zoomControl={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />
          <Marker position={center}>
            <Popup>{label}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <p className="fs-p8 text-secondary mt-1">
        {parsedLat.toFixed(5)}, {parsedLng.toFixed(5)}
        {" · "}
        <a
          href={`https://www.google.com/maps?q=${parsedLat},${parsedLng}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--info)" }}
        >
          Open in Google Maps
        </a>
      </p>
    </div>
  );
}

export default LocationView;