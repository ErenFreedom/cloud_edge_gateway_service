import {
    GoogleMap,
    Marker,
    useLoadScript
} from "@react-google-maps/api";

interface Props {
    latitude: number;
    longitude: number;
    onChange: (lat: number, lng: number) => void;
}

const containerStyle = {
  width: "100%",
  height: "100%"
};

const SiteLocationPicker = ({
    latitude,
    longitude,
    onChange
}: Props) => {

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ["places"] 
    })

    if (!isLoaded) return <p>Loading map...</p>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: latitude, lng: longitude }}
            zoom={12}
            onLoad={(map) => {
                setTimeout(() => {
                    window.google.maps.event.trigger(map, "resize");
                }, 200);
            }}
            onClick={(e) => {
                const lat = e.latLng?.lat();
                const lng = e.latLng?.lng();

                if (lat && lng) {
                    onChange(lat, lng);
                }
            }}
        >
            <Marker
                position={{ lat: latitude, lng: longitude }}
                draggable
                onDragEnd={(e) => {
                    const lat = e.latLng?.lat();
                    const lng = e.latLng?.lng();

                    if (lat && lng) {
                        onChange(lat, lng);
                    }
                }}
            />
        </GoogleMap>
    );
};

export default SiteLocationPicker;