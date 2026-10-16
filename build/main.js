import { initAuth } from './auth.js';
import { errorModal, restaurantModal, restaurantRow } from './components.js';
import { fetchData } from './functions.js';
import { apiUrl, positionOptions } from './variables.js';
const modal = document.querySelector('dialog');
if (!modal) {
    throw new Error('Modal not found');
}
modal.addEventListener('click', () => {
    modal.close();
});
initAuth().catch((err) => console.error('initAuth failed:', err));
const calculateDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
const createTable = (restaurants) => {
    const table = document.querySelector('tbody');
    if (!table) {
        throw new Error('Table body not found');
    }
    table.innerHTML = '';
    restaurants.forEach((restaurant) => {
        const tr = restaurantRow(restaurant);
        table.appendChild(tr);
        tr.addEventListener('click', async () => {
            try {
                // remove all highlights
                const allHighs = document.querySelectorAll('.highlight');
                allHighs.forEach((high) => {
                    high.classList.remove('highlight');
                });
                // add highlight
                tr.classList.add('highlight');
                // add restaurant data to modal
                modal.innerHTML = '';
                // fetch menu
                const menu = await fetchData(apiUrl + `/restaurants/daily/${restaurant._id}/fi`);
                console.log(menu);
                const menuHtml = restaurantModal(restaurant, menu);
                modal.insertAdjacentHTML('beforeend', menuHtml);
                modal.showModal();
            }
            catch (error) {
                modal.innerHTML = errorModal(error.message);
                modal.showModal();
            }
        });
    });
};
const fillSelect = (select, values) => {
    const uniqueValues = Array.from(new Set(values)).sort();
    uniqueValues.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
};
const setupFilters = (restaurants) => {
    const citySelect = document.querySelector('#city-filter');
    const companySelect = document.querySelector('#company-filter');
    const searchInput = document.querySelector('#search');
    const resetBtn = document.querySelector('#reset');
    if (!citySelect || !companySelect || !searchInput || !resetBtn) {
        throw new Error('Filter elements not found');
    }
    fillSelect(citySelect, restaurants.map((restaurant) => restaurant.city));
    fillSelect(companySelect, restaurants.map((restaurant) => restaurant.company));
    const applyFilters = () => {
        const filtered = restaurants.filter((restaurant) => (!citySelect.value || restaurant.city === citySelect.value) &&
            (!companySelect.value || restaurant.company === companySelect.value) &&
            restaurant.name.toLowerCase().includes(searchInput.value.toLowerCase()));
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
const error = (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
};
const success = async (pos) => {
    try {
        const crd = pos.coords;
        const restaurants = await fetchData(apiUrl + '/restaurants');
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
    }
    catch (error) {
        modal.innerHTML = errorModal(error.message);
        modal.showModal();
    }
};
navigator.geolocation.getCurrentPosition(success, error, positionOptions);
