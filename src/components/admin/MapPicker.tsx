"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js/Webpack
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    latitude: number | null;
    longitude: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onSelect }: { lat: number, lng: number, onSelect: (lat: number, lng: number) => void }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);

    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return lat && lng ? (
        <Marker position={[lat, lng]} />
    ) : null;
}

export default function MapPicker({ latitude, longitude, onLocationSelect }: MapPickerProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return (
        <div className="w-full h-[300px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
            Loading Map...
        </div>
    );

    const center: [number, number] = latitude && longitude ? [latitude, longitude] : [19.432608, -99.133209]; // Default to CDMX if none

    return (
        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-10">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    lat={latitude || 0}
                    lng={longitude || 0}
                    onSelect={onLocationSelect}
                />
            </MapContainer>
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 shadow-sm border border-slate-200">
                Click on the map to set location
            </div>
        </div>
    );
}
