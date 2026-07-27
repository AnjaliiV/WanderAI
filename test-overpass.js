const url = 'https://overpass-api.de/api/interpreter';
const query = `
  [out:json][timeout:25];
  (
    node["tourism"~"attraction|viewpoint|museum|artwork|picnic_site|camp_site|information"](around:5000,32.2396,77.1887);
    way["tourism"~"attraction|viewpoint|museum|artwork|picnic_site|camp_site|information"](around:5000,32.2396,77.1887);
    node["amenity"~"restaurant|cafe|food_court"](around:5000,32.2396,77.1887);
    way["amenity"~"restaurant|cafe|food_court"](around:5000,32.2396,77.1887);
    node["tourism"="hotel"](around:5000,32.2396,77.1887);
    way["tourism"="hotel"](around:5000,32.2396,77.1887);
    node["natural"~"peak|waterfall|glacier|beach|bay|cave_entrance"](around:5000,32.2396,77.1887);
    node["historic"~"fort|monument|memorial|ruins|temple"](around:5000,32.2396,77.1887);
    way["historic"~"fort|monument|memorial|ruins|temple"](around:5000,32.2396,77.1887);
  );
  out center 60;
`;

const t0 = Date.now();
fetch(url, {
  method: 'POST',
  body: `data=${encodeURIComponent(query)}`,
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'User-Agent': 'WanderAI/1.0 (Trip Planner App)'
  }
})
.then(r => r.text())
.then(data => {
  console.log(`Took ${Date.now() - t0}ms`);
  try {
    const json = JSON.parse(data);
    console.log(`Found ${json.elements?.length} elements`);
  } catch(e) {
    console.log(data);
  }
})
.catch(console.error);
