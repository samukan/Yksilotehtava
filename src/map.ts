import mapboxgl from 'mapbox-gl';
import {fetchData} from './functions';
import {apiUrl} from './variables';

interface Restaurant {
  _id: string;
  name: string;
  address: string;
  company: string; // 'Sodexo' tai 'Compass Group'
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
}

// Mapbox API-avain
mapboxgl.accessToken =
  'pk.eyJ1IjoiaWxra2FtdGsiLCJhIjoiY20xZzNvMmJ5MXI4YzJrcXpjMWkzYnZlYSJ9.niDiGDLgFfvA2DMqxbB1QQ';

// Globaalit muuttujat
let showSodexo = true;
let showCompass = true;
let restaurantsData: Restaurant[] = [];
let mapInstance: mapboxgl.Map;
let userLocation: [number, number];
let markers: mapboxgl.Marker[] = [];

// Funktio etäisyyden laskemiseen
function getDistance(
  userLng: number,
  userLat: number,
  restaurantLng: number,
  restaurantLat: number
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(restaurantLat - userLat);
  const dLon = toRad(restaurantLng - userLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(userLat)) *
      Math.cos(toRad(restaurantLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

// Hae ravintolat API:sta
const getRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const restaurants = await fetchData<Restaurant[]>(`${apiUrl}/restaurants`);

    if (Array.isArray(restaurants) && restaurants.length > 0) {
      return restaurants;
    } else {
      console.error('No restaurants found or incorrect format.');
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch restaurants:', error);
    return [];
  }
};

// Lisää ravintolat kartalle
const addRestaurantsToMap = (
  restaurants: Restaurant[],
  map: mapboxgl.Map,
  userLocation: [number, number]
): void => {
  markers.forEach((marker) => marker.remove());
  markers = [];

  // Laske etäisyydet ja löydä lähin ravintola
  let closestRestaurant: Restaurant | null = null;
  let minDistance = Infinity;

  // Suodatetut ravintolat
  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (
      (!showSodexo && restaurant.company === 'Sodexo') ||
      (!showCompass && restaurant.company === 'Compass Group')
    ) {
      return false;
    }
    return true;
  });

  filteredRestaurants.forEach((restaurant) => {
    const [restLng, restLat] = restaurant.location.coordinates;
    const distance = getDistance(
      userLocation[0],
      userLocation[1],
      restLng,
      restLat
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestRestaurant = restaurant;
    }
  });

  filteredRestaurants.forEach((restaurant) => {
    const [longitude, latitude] = restaurant.location.coordinates;

    // Luo HTML-elementti markkerille
    const el = document.createElement('div');
    el.className = 'custom-marker';

    // Lisää ikoni markkeriin palveluntarjoajan mukaan
    let iconClass = 'fa-solid fa-utensils';

    if (restaurant.company === 'Sodexo') {
      iconClass = 'fa-solid fa-apple-whole';
    } else if (restaurant.company === 'Compass Group') {
      iconClass = 'fa-solid fa-burger';
    }

    // Lisää lähimmän ravintolan korostus
    if (closestRestaurant && restaurant._id === closestRestaurant._id) {
      el.classList.add('closest');
    }

    el.innerHTML = `<i class="${iconClass}"></i>`;

    // Luo popup
    const popup = new mapboxgl.Popup({offset: 25}).setHTML(`
      <h3>${restaurant.name}</h3>
      <p>${restaurant.address}</p>
      <button class="button menu-today-button" data-id="${restaurant._id}">Katso päivän menu</button><br><br>
      <button class="button menu-week-button" data-id="${restaurant._id}">Katso viikon menu</button><br><br>
      <button class="button add-favorite-button" data-id="${restaurant._id}">Lisää suosikkeihin</button>
    `);

    // Lisää markkeri kartalle
    const marker = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .setPopup(popup)
      .addTo(map);

    // Lisää markkeri taulukkoon
    markers.push(marker);

    // Tapahtumankuuntelijat popupin avautuessa
    popup.on('open', () => {
      const popupElement = popup.getElement();
      if (popupElement) {
        const popupContent = popupElement.querySelector(
          '.mapboxgl-popup-content'
        );
        if (popupContent) {
          const menuTodayButton = popupContent.querySelector(
            '.menu-today-button'
          ) as HTMLButtonElement | null;
          if (menuTodayButton) {
            menuTodayButton.addEventListener('click', (event) => {
              event.stopPropagation();
              const restaurantId = menuTodayButton.dataset?.id;
              if (restaurantId) {
                showMenuForToday(restaurantId);
              } else {
                console.error('Restaurant ID not defined in dataset.');
              }
            });
          }

          const menuWeekButton = popupContent.querySelector(
            '.menu-week-button'
          ) as HTMLButtonElement | null;
          if (menuWeekButton) {
            menuWeekButton.addEventListener('click', (event) => {
              event.stopPropagation();
              const restaurantId = menuWeekButton.dataset?.id;
              if (restaurantId) {
                showMenuForWeek(restaurantId);
              } else {
                console.error('Restaurant ID not defined in dataset.');
              }
            });
          }

          const addFavoriteButton = popupContent.querySelector(
            '.add-favorite-button'
          ) as HTMLButtonElement | null;
          if (addFavoriteButton) {
            addFavoriteButton.addEventListener('click', (event) => {
              event.stopPropagation();
              addToFavorites();
            });
          }
        } else {
          console.error('Popup content element not found.');
        }
      } else {
        console.error('Popup element is not available.');
      }
    });
  });
};

// Funktio käyttäjän suosikkeihin lisäämiseen
const addToFavorites = (): void => {
  const modal = document.getElementById('favoriteModal')!;
  const modalContent = document.getElementById('favoriteModalContent')!;
  modalContent.innerHTML = `<h1>Ravintola lisätty suosikiksi</h1>`;
  modal.style.display = 'block';
};

// Funktio päivän menun näyttämiseen
const showMenuForToday = async (restaurantId: string): Promise<void> => {
  try {
    const menu = await fetchData<{
      courses: {name: string; price: string; diets: string}[];
    }>(`${apiUrl}/restaurants/daily/${restaurantId}/fi`);

    let modalContent = `<h3>Tämän päivän menu</h3>`;

    if (menu && menu.courses && menu.courses.length > 0) {
      const menuList = menu.courses
        .map(
          (course) =>
            `<li><strong>${course.name}</strong> (${course.price}) - ${course.diets}</li>`
        )
        .join('');

      modalContent += `<ul>${menuList}</ul>`;
    } else {
      modalContent += `<p>Ei tarjoilua tälle päivälle.</p>`;
    }

    document.getElementById('menuModalContent')!.innerHTML = modalContent;

    const modal = document.getElementById('menuModal')!;
    modal.style.display = 'block';
  } catch (error) {
    console.error("Failed to fetch today's menu:", error);
  }
};

// Funktio viikon menun näyttämiseen
const showMenuForWeek = async (restaurantId: string): Promise<void> => {
  try {
    const menu = await fetchData<{
      days: {
        date: string;
        courses: {name: string; price: string; diets: string}[];
      }[];
    }>(`${apiUrl}/restaurants/weekly/${restaurantId}/fi`);

    let modalContent = `<h3>Viikon menu</h3>`;

    if (menu && menu.days && menu.days.length > 0) {
      const weeklyMenu = menu.days
        .map((day) => {
          let dayContent = '';
          const date = new Date(day.date);
          const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          };
          const formattedDate = date.toLocaleDateString('fi-FI', options);

          if (day.courses && day.courses.length > 0) {
            const courses = day.courses
              .map(
                (course) =>
                  `<li><strong>${course.name}</strong> (${course.price}) - ${course.diets}</li>`
              )
              .join('');
            dayContent = `<h4>${formattedDate}</h4><ul>${courses}</ul>`;
          } else {
            dayContent = `<h4>${formattedDate}</h4><p>Ei tarjoilua tälle päivälle.</p>`;
          }
          return dayContent;
        })
        .join('');

      modalContent += `${weeklyMenu}`;
    } else {
      modalContent += `<p>Ei tarjoilua tälle viikolle.</p>`;
    }

    document.getElementById('menuModalContent')!.innerHTML = modalContent;

    const modal = document.getElementById('menuModal')!;
    modal.style.display = 'block';
  } catch (error) {
    console.error('Failed to fetch weekly menu:', error);
  }
};

// Hae käyttäjän sijainti
const getUserLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    } else {
      reject(new Error('Geolocation is not supported by this browser.'));
    }
  });
};

// Alusta kartta
const initializeMap = (longitude: number, latitude: number): void => {
  userLocation = [longitude, latitude];
  mapInstance = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [longitude, latitude],
    zoom: 12,
  });

  // Lisää käyttäjän sijainnin markkeri
  new mapboxgl.Marker({
    color: 'red',
  })
    .setLngLat(userLocation)
    .addTo(mapInstance);

  mapInstance.on('load', async () => {
    restaurantsData = await getRestaurants();
    if (restaurantsData.length > 0) {
      addRestaurantsToMap(restaurantsData, mapInstance, userLocation);
    } else {
      console.error(
        'No restaurants available to display on the map after fetching.'
      );
    }
  });
};

(async () => {
  try {
    const position = await getUserLocation();
    const {longitude, latitude} = position.coords;
    initializeMap(longitude, latitude);
  } catch (error) {
    console.error('Failed to get user location:', error);
    initializeMap(24.945831, 60.192059);
  }
})();

// Suodatusnapit
const sodexoFilterButton = document.getElementById(
  'sodexo-filter'
) as HTMLButtonElement;
const compassFilterButton = document.getElementById(
  'compass-filter'
) as HTMLButtonElement;

sodexoFilterButton.addEventListener('click', () => {
  showSodexo = !showSodexo;
  sodexoFilterButton.classList.toggle('active', showSodexo);
  addRestaurantsToMap(restaurantsData, mapInstance, userLocation);
});

compassFilterButton.addEventListener('click', () => {
  showCompass = !showCompass;
  compassFilterButton.classList.toggle('active', showCompass);
  addRestaurantsToMap(restaurantsData, mapInstance, userLocation);
});

// Sulje menu-modal napista
document.getElementById('close-menu-modal')!.addEventListener('click', () => {
  const modal = document.getElementById('menuModal')!;
  modal.style.display = 'none';
});

// Sulje menu-modal klikkaamalla modalin ulkopuolelle
window.addEventListener('click', (event) => {
  const modal = document.getElementById('menuModal')!;
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Sulje favorite-modal napista
document
  .getElementById('close-favorite-modal')!
  .addEventListener('click', () => {
    const modal = document.getElementById('favoriteModal')!;
    modal.style.display = 'none';
  });

// Sulje favorite-modal klikkaamalla modalin ulkopuolelle
window.addEventListener('click', (event) => {
  const modal = document.getElementById('favoriteModal')!;
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});
