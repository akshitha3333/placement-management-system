// LocationPicker.jsx
// Reusable map component — drop it anywhere in the project
// Props:
//   lat        {string|number} — current latitude value
//   lng        {string|number} — current longitude value
//   onChange   {function(lat, lng)} — called when user picks a location
//   height     {number} — map height in px (default 320)
//
// Usage:
//   <LocationPicker lat={latitude} lng={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix broken default marker icons in webpack/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Inner: listens for map clicks
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(
        e.latlng.lat.toFixed(6),
        e.latlng.lng.toFixed(6)
      );
    },
  });
  return null;
}

// Inner: flies map to new center when GPS fires
function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1 });
  }, [center]);
  return null;
}

function LocationPicker({ lat, lng, onChange, height = 320 }) {
  const [locLoading, setLocLoading] = useState(false);
  const [flyTarget,  setFlyTarget]  = useState(null);
  const [address,    setAddress]    = useState("");

  const defaultCenter = [20.5937, 78.9629]; // India center
  const markerPos = lat && lng
    ? [parseFloat(lat), parseFloat(lng)]
    : null;

  // Reverse geocode using Nominatim (free, no key)
  const reverseGeocode = async (latVal, lngVal) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latVal}&lon=${lngVal}&format=json`
      );
      const data = await res.json();
      setAddress(data.display_name || "");
    } catch {
      setAddress("");
    }
  };

  const handlePick = (latVal, lngVal) => {
    console.log("Location picked — lat:", latVal, "lng:", lngVal);
    onChange(latVal, lngVal);
    reverseGeocode(latVal, lngVal);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latVal = pos.coords.latitude.toFixed(6);
        const lngVal = pos.coords.longitude.toFixed(6);
        console.log("GPS — lat:", latVal, "lng:", lngVal);
        handlePick(latVal, lngVal);
        setFlyTarget([parseFloat(latVal), parseFloat(lngVal)]);
        setLocLoading(false);
      },
      (err) => {
        console.error("GPS error:", err.message);
        setLocLoading(false);
        alert("Could not get GPS location. Click on the map to pick manually.");
      },
      { timeout: 10000 }
    );
  };

  return (
    <div>
      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button
          type="button"
          onClick={handleGPS}
          disabled={locLoading}
          style={{
            padding: "7px 16px", borderRadius: 8,
            fontSize: "0.82rem", fontWeight: 600,
            background: "var(--primary)", color: "#fff",
            border: "none", cursor: locLoading ? "not-allowed" : "pointer",
            opacity: locLoading ? 0.7 : 1,
          }}
        >
          {locLoading ? "Detecting..." : "Use My GPS Location"}
        </button>
        {lat && lng && (
          <button
            type="button"
            onClick={() => { onChange("", ""); setAddress(""); }}
            style={{
              padding: "7px 14px", borderRadius: 8,
              fontSize: "0.82rem", fontWeight: 600,
              background: "#fff", color: "var(--danger)",
              border: "1px solid var(--danger)", cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Map */}
      <div style={{ height, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-color)" }}>
        <MapContainer
          center={markerPos || defaultCenter}
          zoom={markerPos ? 14 : 5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {flyTarget && <FlyTo center={flyTarget} />}
          {markerPos && <Marker position={markerPos} />}
        </MapContainer>
      </div>

      <p className="fs-p8 text-secondary mt-1">
        Click anywhere on the map to drop a pin, or use GPS to auto-detect.
      </p>

      {/* Coordinates + address display */}
      {lat && lng && (
        <div style={{
          marginTop: 8, padding: "10px 14px", borderRadius: 8,
          background: "rgba(22,163,74,0.07)",
          border: "1px solid rgba(22,163,74,0.25)",
        }}>
          <p className="fs-p9 bold" style={{ color: "#16a34a" }}>
            {lat}, {lng}
          </p>
          {address && (
            <p className="fs-p8 text-secondary mt-1">{address}</p>
          )}
        </div>
      )}

      {/* Manual inputs */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="form-control-label">Latitude</label>
          <input
            className="form-control"
            type="text"
            value={lat}
            placeholder="Auto-filled"
            onChange={(e) => onChange(e.target.value, lng)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-control-label">Longitude</label>
          <input
            className="form-control"
            type="text"
            value={lng}
            placeholder="Auto-filled"
            onChange={(e) => onChange(lat, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default LocationPicker;