// Google Maps API loader utility
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
  // Check if Google Maps is already available
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Return existing promise if loading is in progress
  if (loadPromise) {
    return loadPromise;
  }

  // Start loading Google Maps
  loadPromise = new Promise((resolve, reject) => {
    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = (): boolean => {
  return !!(window.google && window.google.maps);
};