let googleMapsPromise: Promise<any> | null = null;

function getGoogleMapsApiKey() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    ""
  ).trim();
}

export function hasGoogleMapsApiKey() {
  return Boolean(getGoogleMapsApiKey());
}

export async function loadGoogleMapsApi() {
  if (typeof window === "undefined") {
    throw new Error("Google Maps is only available in the browser.");
  }

  if (window.google?.maps?.places) {
    return window.google;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Add it to frontend/.env.local to enable Google Maps.",
    );
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-loader="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", () => {
        googleMapsPromise = null;
        reject(new Error("Unable to load Google Maps."));
      });
      return;
    }

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}` +
      "&libraries=places,marker&v=weekly";
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("Unable to load Google Maps."));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
