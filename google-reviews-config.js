/*
 * Google yorumları entegrasyonu
 *
 * 1. Google Cloud'da Maps JavaScript API ve Places API (New) hizmetlerini açın.
 * 2. API anahtarını yalnızca bu site alan adına (HTTP referrer) ve bu iki API'ye kısıtlayın.
 * 3. Aşağıdaki apiKey ve placeId alanlarını doldurun.
 *
 * Tarayıcı anahtarı kaynak kodunda görünür; güvenlik alan adı ve API kısıtlarıyla sağlanır.
 */
window.GOOGLE_REVIEWS_CONFIG = Object.freeze({
    apiKey: 'AIzaSyAbSTOPCxyUcIshFZPSV0lvhI5SU7ajZhA',
    placeId: 'ChIJ6b-mfi5rQmkRfqokwlcsa44',
    fallbackUrl: 'https://www.google.com/maps/search/?api=1&query=%C4%B0LYA%20Ta%C5%9F%C4%B1mac%C4%B1l%C4%B1k%20Pendik'
});
