"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

const UNIDA_DEFAULT = {
	lat: -7.8652,
	lon: 111.4617,
	name: "UNIDA Gontor",
};

interface MapPickerViewProps {
	latitude: number;
	longitude: number;
	onCoordinatesChange: (lat: number, lon: number) => void;
	height?: string;
}

function createPinIcon() {
	return L.divIcon({
		className: "custom-unida-marker",
		html: `
			<div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
				<div style="background-color: #123B6D; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid white;">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
						<circle cx="12" cy="10" r="3"/>
					</svg>
				</div>
				<div style="position: absolute; bottom: -3px; width: 8px; height: 3px; background: rgba(0,0,0,0.35); border-radius: 9999px; filter: blur(1px);"></div>
			</div>
		`,
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		popupAnchor: [0, -32],
	});
}

export default function MapPickerView({
	latitude,
	longitude,
	onCoordinatesChange,
	height = "320px",
}: MapPickerViewProps) {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);
	const markerRef = useRef<L.Marker | null>(null);
	const isInternalUpdateRef = useRef(false);

	// Inisialisasi peta sekali saat mount
	useEffect(() => {
		if (!mapContainerRef.current) return;

		const validLat = Number.isFinite(latitude) ? latitude : UNIDA_DEFAULT.lat;
		const validLon = Number.isFinite(longitude) ? longitude : UNIDA_DEFAULT.lon;

		const map = L.map(mapContainerRef.current, {
			center: [validLat, validLon],
			zoom: 16,
			scrollWheelZoom: true,
			zoomControl: true,
		});

		L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
			maxZoom: 19,
		}).addTo(map);

		const marker = L.marker([validLat, validLon], {
			draggable: true,
			icon: createPinIcon(),
		}).addTo(map);

		marker.on("dragend", () => {
			const pos = marker.getLatLng();
			const newLat = Number(pos.lat.toFixed(6));
			const newLon = Number(pos.lng.toFixed(6));
			isInternalUpdateRef.current = true;
			onCoordinatesChange(newLat, newLon);
		});

		map.on("click", (e: L.LeafletMouseEvent) => {
			const newLat = Number(e.latlng.lat.toFixed(6));
			const newLon = Number(e.latlng.lng.toFixed(6));
			marker.setLatLng([newLat, newLon]);
			isInternalUpdateRef.current = true;
			onCoordinatesChange(newLat, newLon);
		});

		mapInstanceRef.current = map;
		markerRef.current = marker;

		const timer = setTimeout(() => {
			map.invalidateSize();
		}, 200);

		return () => {
			clearTimeout(timer);
			map.remove();
			mapInstanceRef.current = null;
			markerRef.current = null;
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Sinkronisasi saat koordinat berubah dari luar (mis. input manual / search result)
	useEffect(() => {
		if (!mapInstanceRef.current || !markerRef.current) return;

		if (isInternalUpdateRef.current) {
			isInternalUpdateRef.current = false;
			return;
		}

		if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
			const currentPos = markerRef.current.getLatLng();
			const diffLat = Math.abs(currentPos.lat - latitude);
			const diffLon = Math.abs(currentPos.lng - longitude);

			// Hanya re-center jika perpindahan signifikan (> 0.00005)
			if (diffLat > 0.00005 || diffLon > 0.00005) {
				markerRef.current.setLatLng([latitude, longitude]);
				mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
			}
		}
	}, [latitude, longitude]);

	const handleResetToUnida = () => {
		if (mapInstanceRef.current && markerRef.current) {
			markerRef.current.setLatLng([UNIDA_DEFAULT.lat, UNIDA_DEFAULT.lon]);
			mapInstanceRef.current.flyTo([UNIDA_DEFAULT.lat, UNIDA_DEFAULT.lon], 16, {
				duration: 0.8,
			});
			isInternalUpdateRef.current = true;
			onCoordinatesChange(UNIDA_DEFAULT.lat, UNIDA_DEFAULT.lon);
		}
	};

	const handleGetMyLocation = () => {
		if (!navigator.geolocation) {
			alert("Geolokasi tidak didukung oleh browser Anda.");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const myLat = Number(pos.coords.latitude.toFixed(6));
				const myLon = Number(pos.coords.longitude.toFixed(6));
				if (mapInstanceRef.current && markerRef.current) {
					markerRef.current.setLatLng([myLat, myLon]);
					mapInstanceRef.current.flyTo([myLat, myLon], 16, { duration: 0.8 });
					isInternalUpdateRef.current = true;
					onCoordinatesChange(myLat, myLon);
				}
			},
			(err) => {
				alert(`Gagal mendeteksi lokasi perangkat: ${err.message}`);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	return (
		<div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
			<div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-0" />

			{/* Floating Controls Bar */}
			<div className="absolute top-3 right-3 z-[1000] flex flex-col sm:flex-row gap-1.5 pointer-events-auto">
				<button
					type="button"
					onClick={handleResetToUnida}
					title="Kembali ke koordinat UNIDA Gontor"
					className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[#123B6D] bg-white/95 hover:bg-white backdrop-blur-xs rounded-xl shadow-md border border-slate-200/80 transition active:scale-95 cursor-pointer"
				>
					<RotateCcw className="h-3.5 w-3.5 text-[#1D5FA7]" />
					<span>Ke UNIDA</span>
				</button>

				<button
					type="button"
					onClick={handleGetMyLocation}
					title="Gunakan titik koordinat perangkat saya saat ini"
					className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[#102A46] bg-white/95 hover:bg-white backdrop-blur-xs rounded-xl shadow-md border border-slate-200/80 transition active:scale-95 cursor-pointer"
				>
					<LocateFixed className="h-3.5 w-3.5 text-[#16835D]" />
					<span>Lokasi Saya</span>
				</button>
			</div>

			{/* Floating Coordinate Info Badge */}
			<div className="absolute bottom-2 left-2 z-[1000] pointer-events-none">
				<div className="inline-flex items-center gap-2 bg-[#102A46]/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wide shadow-md">
					<span>
						Lat: <strong>{latitude ? latitude.toFixed(6) : "-"}</strong>
					</span>
					<span className="text-slate-400">|</span>
					<span>
						Lng: <strong>{longitude ? longitude.toFixed(6) : "-"}</strong>
					</span>
				</div>
			</div>
		</div>
	);
}
