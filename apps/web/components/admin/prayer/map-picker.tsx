"use client";

import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";

export interface MapPickerProps {
	latitude: number;
	longitude: number;
	onCoordinatesChange: (lat: number, lon: number) => void;
	height?: string;
}

function MapSkeleton({ height = "320px" }: { height?: string }) {
	return (
		<div
			style={{ height }}
			className="w-full rounded-2xl border border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 animate-pulse space-y-2"
		>
			<MapPin className="h-8 w-8 text-slate-300 animate-bounce" />
			<span className="text-xs font-medium text-slate-500">Memuat peta interaktif...</span>
		</div>
	);
}

const DynamicMapPickerView = dynamic(() => import("./map-picker-view"), {
	ssr: false,
	loading: () => <MapSkeleton />,
});

export function MapPicker(props: MapPickerProps) {
	return <DynamicMapPickerView {...props} />;
}
