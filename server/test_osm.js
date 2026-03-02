const query = `
    [out:json][timeout:10];
    area[name~"Bhubaneswar", i]->.searchArea;
    (
      node["amenity"="cafe"](area.searchArea);
      way["amenity"="cafe"](area.searchArea);
      relation["amenity"="cafe"](area.searchArea);
    );
    out center 3;
`;

fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RedThreadBot/1.0 (https://github.com/ayush/redthread)'
    }
})
    .then(r => r.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            console.log("Success. Elements:", data.elements?.length);
        } catch (e) {
            console.log("Failed to parse JSON. Raw response:");
            console.log(text.substring(0, 500));
        }
    })
    .catch(err => console.error("Fetch error:", err));
