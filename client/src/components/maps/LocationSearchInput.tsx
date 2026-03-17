import { useRef } from "react";

interface Props {
  onSelect: (data: {
    lat: number;
    lng: number;
    address: string;
    state: string;
    country: string;
  }) => void;
}

const LocationSearchInput = ({ onSelect }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleLoad = () => {
    if (!inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: []
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry) return;

      const lat = place.geometry.location?.lat();
      const lng = place.geometry.location?.lng();

      let state = "";
      let country = "";

      place.address_components?.forEach((comp) => {
        if (comp.types.includes("administrative_area_level_1")) {
          state = comp.long_name;
        }
        if (comp.types.includes("country")) {
          country = comp.long_name;
        }
      });

      onSelect({
        lat: lat!,
        lng: lng!,
        address: place.formatted_address || "",
        state,
        country
      });
    });
  };

  return (
    <input
      ref={inputRef}
      placeholder="🔍 Search location..."
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "10px"
      }}
      onFocus={handleLoad}
    />
  );
};

export default LocationSearchInput;