import {initAuth} from './auth.js';
import {errorModal, restaurantModal, restaurantRow} from './components.js';
import {fetchData} from './functions.js';
import {flyToRestaurant, initMap, showRestaurantMarkers, showUserLocation} from './map.js';
import {Menu} from './types/Menu';
import {Restaurant} from './types/Restaurant';
import {apiUrl, positionOptions} from './variables.js';

const modal = document.querySelector('dialog');
if (!modal) {
  throw new Error('Modal not found');
}

modal.addEventListener('click', () => {
  modal.close();
});

initAuth().catch((err) => console.error('initAuth failed:', err));

try {
  initMap();
} catch (err) {
  console.error('Map failed to start:', err);
}

const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const selectRestaurant = async (restaurant: Restaurant) => {
  try {
    // remove all highlights
    document.querySelectorAll('.highlight').forEach((high) => {
      high.classList.remove('highlight');
    });
    // highlight the matching table row
    document
      .querySelector(`tr[data-id="${restaurant._id}"]`)
      ?.classList.add('highlight');

    flyToRestaurant(restaurant);

    // add restaurant data to modal
    modal.innerHTML = '';
    const menu = await fetchData<Menu>(
      apiUrl + `/restaurants/daily/${restaurant._id}/fi`
    );
    console.log(menu);

    const menuHtml = restaurantModal(restaurant, menu);
    modal.insertAdjacentHTML('beforeend', menuHtml);

    modal.showModal();
  } catch (error) {
    modal.innerHTML = errorModal((error as Error).message);
    modal.showModal();
  }
};

const createTable = (restaurants: Restaurant[]) => {
  const table = document.querySelector('tbody');
  if (!table) {
    throw new Error('Table body not found');
  }
  table.innerHTML = '';
  restaurants.forEach((restaurant) => {
    const tr = restaurantRow(restaurant);
    tr.dataset.id = restaurant._id;
    tr.addEventListener('click', () => selectRestaurant(restaurant));
    table.appendChild(tr);
  });

  // keep the map markers in sync with the table
  showRestaurantMarkers(restaurants, selectRestaurant);
};

const fillSelect = (select: HTMLSelectElement, values: string[]) => {
  const uniqueValues = Array.from(new Set(values)).sort();
  uniqueValues.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
};

const setupFilters = (restaurants: Restaurant[]) => {
  const citySelect = document.querySelector<HTMLSelectElement>('#city-filter');
  const companySelect =
    document.querySelector<HTMLSelectElement>('#company-filter');
  const searchInput = document.querySelector<HTMLInputElement>('#search');
  const resetBtn = document.querySelector<HTMLButtonElement>('#reset');

  if (!citySelect || !companySelect || !searchInput || !resetBtn) {
    throw new Error('Filter elements not found');
  }

  fillSelect(
    citySelect,
    restaurants.map((restaurant) => restaurant.city)
  );
  fillSelect(
    companySelect,
    restaurants.map((restaurant) => restaurant.company)
  );

  const applyFilters = () => {
    const searchText = searchInput.value.trim().toLowerCase();
    const filtered = restaurants.filter(
      (restaurant) =>
        (!citySelect.value || restaurant.city === citySelect.value) &&
        (!companySelect.value || restaurant.company === companySelect.value) &&
        restaurant.name.toLowerCase().includes(searchText)
    );
    createTable(filtered);
  };

  citySelect.addEventListener('change', applyFilters);
  companySelect.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);

  resetBtn.addEventListener('click', () => {
    citySelect.value = '';
    companySelect.value = '';
    searchInput.value = '';
    applyFilters();
  });
};

const error = (err: GeolocationPositionError) => {
  console.warn(`ERROR(${err.code}): ${err.message}`);
};

const success = async (pos: GeolocationPosition) => {
  try {
    const crd = pos.coords;
    const restaurants = await fetchData<Restaurant[]>(apiUrl + '/restaurants');
    console.log(restaurants);
    restaurants.sort((a, b) => {
      const x1 = crd.latitude;
      const y1 = crd.longitude;
      const x2a = a.location.coordinates[1];
      const y2a = a.location.coordinates[0];
      const distanceA = calculateDistance(x1, y1, x2a, y2a);
      const x2b = b.location.coordinates[1];
      const y2b = b.location.coordinates[0];
      const distanceB = calculateDistance(x1, y1, x2b, y2b);
      return distanceA - distanceB;
    });
    createTable(restaurants);
    setupFilters(restaurants);
    showUserLocation(crd.latitude, crd.longitude);
  } catch (error) {
    modal.innerHTML = errorModal((error as Error).message);
    modal.showModal();
  }
};

navigator.geolocation.getCurrentPosition(success, error, positionOptions);


