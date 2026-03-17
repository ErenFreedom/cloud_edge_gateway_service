
export const forwardGeocode = async (address: string) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
  );

  const data = await res.json();

  // 🔥 allow partial matches
  if (!data.results || data.results.length === 0) {
    return null;
  }

  const location = data.results[0].geometry.location;

  return {
    lat: location.lat,
    lng: location.lng
  };
};

export const reverseGeocode = async (lat: number, lng: number) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  );

  const data = await res.json();

  if (data.status !== "OK") return null;

  const result = data.results[0];

  let address_line1 = result.formatted_address;
  let state = "";
  let country = "";

  result.address_components.forEach((comp: any) => {
    if (comp.types.includes("administrative_area_level_1")) {
      state = comp.long_name;
    }
    if (comp.types.includes("country")) {
      country = comp.long_name;
    }
  });

  return {
    address_line1,
    state,
    country
  };
};