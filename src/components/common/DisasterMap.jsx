import React, { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

/**
 * Relief Operations Map
 *
 * Displays camps (red=urgent, orange=partial, green=met),
 * supply points (blue), and in-transit trucks.
 * Lines connect matched donor→camp.
 */
export const ReliefMap = ({
  camps = [],
  supplies = [],
  shipments = [],
  matches = [],
  onSelectCamp,
  height = "460px",
  showLayers = { camps: true, supply: true, trips: true },
}) => {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef({})

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.3, 72.6], // Gujarat center
        zoom: 7,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      layersRef.current = {
        camps: L.layerGroup().addTo(map),
        supply: L.layerGroup().addTo(map),
        trips: L.layerGroup().addTo(map),
        routes: L.layerGroup().addTo(map),
      }
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const { camps: campLayer, supply: supplyLayer, trips: tripsLayer, routes: routesLayer } = layersRef.current
    campLayer.clearLayers()
    supplyLayer.clearLayers()
    tripsLayer.clearLayers()
    routesLayer.clearLayers()

    const bounds = []

    // ─── Camp Markers ───
    if (showLayers.camps) {
      camps.forEach((camp) => {
        if (!camp.lat || !camp.lng) return
        bounds.push([camp.lat, camp.lng])

        // Determine camp status color
        const urgency = camp.urgencyLevel || "met" // urgent, partial, met
        const color = urgency === "urgent" ? "#dc2626" : urgency === "partial" ? "#ea580c" : "#16a34a"
        const pulseHtml = urgency === "urgent"
          ? `<div style="position:absolute;inset:-4px;border-radius:9999px;background:rgba(220,38,38,0.4);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>`
          : ""

        const html = `
          <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            ${pulseHtml}
            <div style="width:24px;height:24px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 4px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">
              ⛺
            </div>
          </div>
        `
        const icon = L.divIcon({ html, className: "relief-map-camp", iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] })
        const marker = L.marker([camp.lat, camp.lng], { icon }).addTo(campLayer)

        marker.bindPopup(`
          <div style="font-family:inherit;min-width:180px;">
            <div style="font-weight:bold;font-size:13px;color:#001d36;margin-bottom:4px;">${camp.name || "Camp"}</div>
            <div style="font-size:11px;color:#64748b;">Pop: ${camp.population || "—"}</div>
            <div style="font-size:11px;color:${color};font-weight:bold;margin-top:4px;">${urgency.toUpperCase()}</div>
          </div>
        `)

        marker.on("click", () => {
          if (onSelectCamp) onSelectCamp(camp)
        })
      })
    }

    // ─── Supply Markers ───
    if (showLayers.supply) {
      supplies.forEach((s) => {
        if (!s.lat || !s.lng) return
        bounds.push([s.lat, s.lng])

        const html = `
          <div style="width:20px;height:20px;border-radius:9999px;background:#2563eb;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">
            📦
          </div>
        `
        const icon = L.divIcon({ html, className: "relief-map-supply", iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10] })
        L.marker([s.lat, s.lng], { icon }).addTo(supplyLayer)
          .bindPopup(`
            <div style="font-family:inherit;min-width:160px;">
              <div style="font-weight:bold;font-size:12px;color:#001d36;">${s.donor || "Donor"}</div>
              <div style="font-size:11px;color:#64748b;">${s.itemKey} — ${s.qtyAvailable || 0}/${s.qtyTotal || 0}</div>
              ${s.expiryDate ? `<div style="font-size:10px;color:#ea580c;margin-top:2px;">Expires: ${typeof s.expiryDate === 'string' ? s.expiryDate : 'soon'}</div>` : ""}
            </div>
          `)
      })
    }

    // ─── Trip / Truck Markers ───
    if (showLayers.trips) {
      shipments.forEach((trip) => {
        if (!trip.lastLocation) return
        const loc = trip.lastLocation
        if (!loc.lat || !loc.lng) return
        bounds.push([loc.lat, loc.lng])

        const html = `
          <div style="width:24px;height:24px;border-radius:9999px;background:#7c3aed;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;">
            🚚
          </div>
        `
        const icon = L.divIcon({ html, className: "relief-map-truck", iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] })
        L.marker([loc.lat, loc.lng], { icon }).addTo(tripsLayer)
          .bindPopup(`
            <div style="font-family:inherit;min-width:140px;">
              <div style="font-weight:bold;font-size:12px;color:#001d36;">Shipment</div>
              <div style="font-size:11px;color:#7c3aed;font-weight:bold;">${(trip.status || "assigned").toUpperCase()}</div>
            </div>
          `)
      })
    }

    // ─── Match Route Lines ───
    matches.forEach((m) => {
      if (m.supplyLat && m.supplyLng && m.campLat && m.campLng) {
        const line = L.polyline(
          [[m.supplyLat, m.supplyLng], [m.campLat, m.campLng]],
          { color: "#D98B3A", weight: 2, opacity: 0.6, dashArray: "6 4" }
        ).addTo(routesLayer)
        line.bindPopup(`<div style="font-size:11px;">${m.itemKey || "Supply"} → ${m.campName || "Camp"} (${m.qty} units)</div>`)
      }
    })

    // Fit bounds
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 10)
      } else {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
      }
    }
  }, [camps, supplies, shipments, matches, showLayers, onSelectCamp])

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: "100%", zIndex: 1 }}
      className="rounded-lg overflow-hidden border border-[#E7DED2]"
    />
  )
}

export default ReliefMap
