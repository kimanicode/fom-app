import * as Location from 'expo-location';

export const DEFAULT_LOCATION_LABEL = 'Current location';

export const formatReverseGeocode = (
  item?: Location.LocationGeocodedAddress | null,
  fallback = DEFAULT_LOCATION_LABEL
) => {
  if (!item) return fallback;
  const parts = [
    item.city,
    item.district,
    item.subregion,
    item.region,
    item.country,
  ].filter((value): value is string => Boolean(value));
  return parts[0] || fallback;
};

export const getCurrentLocationDetails = async (fallback = DEFAULT_LOCATION_LABEL) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { granted: false as const, label: fallback };
  }

  const current = await Location.getCurrentPositionAsync({});
  const reverse = await Location.reverseGeocodeAsync({
    latitude: current.coords.latitude,
    longitude: current.coords.longitude,
  });

  return {
    granted: true as const,
    coords: current.coords,
    label: formatReverseGeocode(reverse[0], fallback),
  };
};
