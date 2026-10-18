import { mapboxToken } from './config.js';
let map = null;
let markers = [];
let userMarker = null;
// the API gives coordinates as [longitude, latitude], which is also Mapbox's order
const toLngLat = (restaurant) => [
    restaurant.location.coordinates[0],
    restaurant.location.coordinates[1],
];
const initMap = () => {
    mapboxgl.accessToken = mapboxToken;
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [24.9384, 60.1699],
        zoom: 10,
    });
    map.addControl(new mapboxgl.NavigationControl());
    map.on('error', (e) => console.warn('Map error:', e.error?.message));
};
const showRestaurantMarkers = (restaurants, onClick) => {
    if (!map)
        return;
    markers.forEach((marker) => marker.remove());
    markers = [];
    restaurants.forEach((restaurant) => {
        const marker = new mapboxgl.Marker().setLngLat(toLngLat(restaurant)).addTo(map);
        marker.getElement().style.cursor = 'pointer';
        marker.getElement().addEventListener('click', (event) => {
            event.stopPropagation();
            onClick(restaurant);
        });
        markers.push(marker);
    });
    // zoom so all visible markers fit on screen
    if (restaurants.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        restaurants.forEach((restaurant) => bounds.extend(toLngLat(restaurant)));
        map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
};
const showUserLocation = (latitude, longitude) => {
    if (!map)
        return;
    userMarker?.remove();
    userMarker = new mapboxgl.Marker({ color: '#e63946' })
        .setLngLat([longitude, latitude])
        .addTo(map);
};
const flyToRestaurant = (restaurant) => {
    if (!map)
        return;
    map.flyTo({ center: toLngLat(restaurant), zoom: 15 });
};
export { initMap, showRestaurantMarkers, showUserLocation, flyToRestaurant };
