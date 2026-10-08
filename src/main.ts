import {errorModal, restaurantModal, restaurantRow} from './components';
import {fetchData} from './functions';
import {Menu} from './types/Menu';
import {Restaurant} from './types/Restaurant';
import {apiUrl, positionOptions} from './variables';

const modal = document.querySelector('dialog');
if (!modal) {
  throw new Error('Modal not found');
}

modal.addEventListener('click', () => {
  modal.close();
});

const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const createTable = (restaurants: Restaurant[]) => {
  // ...unchanged...
};

const sortByDistance = (restaurants: Restaurant[], crd: GeolocationCoordinates) =>
  [...restaurants].sort((a, b) => {
    const distanceA = calculateDistance(
      crd.latitude,
      crd.longitude,
      a.location.coordinates[1],
      a.location.coordinates[0]
    );
    const distanceB = calculateDistance(
      crd.latitude,
      crd.longitude,
      b.location.coordinates[1],
      b.location.coordinates[0]
    );
    return distanceA - distanceB;
  });

// Wrap geolocation in a promise that resolves to null on failure
const getPosition = (): Promise<GeolocationPosition | null> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        resolve(null);
      },
      positionOptions
    );
  });

const setupFilters = (restaurants: Restaurant[]) => {
  const sodexoBtn = document.querySelector('#sodexo');
  const compassBtn = document.querySelector('#compass');
  const resetBtn = document.querySelector('#reset');

  if (!sodexoBtn || !compassBtn || !resetBtn) {
    throw new Error('Filter buttons not found');
  }

  sodexoBtn.addEventListener('click', () => {
    createTable(restaurants.filter((r) => r.company === 'Sodexo'));
  });
  compassBtn.addEventListener('click', () => {
    createTable(restaurants.filter((r) => r.company === 'Compass Group'));
  });
  resetBtn.addEventListener('click', () => {
    createTable(restaurants);
  });
};

const main = async () => {
  try {
    let restaurants = await fetchData<Restaurant[]>(apiUrl + '/restaurants');

    // Render immediately so the page is usable without location
    createTable(restaurants);
    setupFilters(restaurants);

    // Then try to improve the order using location
    const pos = await getPosition();
    if (pos) {
      restaurants = sortByDistance(restaurants, pos.coords);
      createTable(restaurants);
      // re-attach filters with the sorted list
      setupFilters(restaurants);
    }
  } catch (error) {
    modal.innerHTML = errorModal((error as Error).message);
    modal.showModal();
  }
};

main();
