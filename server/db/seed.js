'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { initDb, getDb } = require('./connect');

const destinations = [
  // ─── Famous Indian Destinations ──────────────────────────────────────────
  {
    name: 'Goa', slug: 'goa', country: 'India', state: 'Goa', region: 'Western India',
    lat: 15.2993, lng: 74.1240, type: 'beach',
    tags: ['beach', 'party', 'nightlife', 'water-sports', 'heritage', 'seafood'],
    best_months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    language: 'Konkani, English, Hindi', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '1800-209-3516',
    overview: 'India\'s smallest state and a premier beach destination. Known for its stunning beaches, Portuguese heritage, vibrant nightlife, and incredible seafood. A perfect blend of Indian and Western cultures.',
    highlights: JSON.stringify(['Baga Beach', 'Anjuna Flea Market', 'Basilica of Bom Jesus', 'Dudhsagar Falls', 'Spice Plantations', 'Old Goa Churches']),
    hidden_gems: JSON.stringify(['Butterfly Beach (only accessible by boat)', 'Cola Beach (hidden lagoon)', 'Goa Velha (ancient temples)', 'Cabo de Rama Fort', 'Divar Island']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaskar', 'Thank you': 'Dev borem korum', 'How much?': 'Kitlem?', 'How are you?': 'Koso asa?' }),
    featured: 1,
  },
  {
    name: 'Manali', slug: 'manali', country: 'India', state: 'Himachal Pradesh', region: 'North India',
    lat: 32.2396, lng: 77.1887, type: 'mountain',
    tags: ['adventure', 'snow', 'trekking', 'honeymoon', 'skiing', 'camping'],
    best_months: ['Mar', 'Apr', 'May', 'Jun', 'Oct'],
    language: 'Hindi, Manali dialect', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '01902-252116',
    overview: 'A high-altitude Himalayan resort town in Himachal Pradesh. Famous for its snow-capped peaks, adventure sports, serene valleys, and the famous Rohtang Pass. A paradise for trekkers, honeymooners, and adventure seekers.',
    highlights: JSON.stringify(['Rohtang Pass', 'Solang Valley', 'Hadimba Devi Temple', 'Old Manali', 'Beas River Rafting', 'Naggar Castle']),
    hidden_gems: JSON.stringify(['Chandratal Lake', 'Malana Village (cannabis valley)', 'Hampta Pass Trek', 'Jana Waterfall', 'Sethan Village']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaste', 'Thank you': 'Dhanyavaad', 'How much?': 'Kitna hai?', 'Good': 'Achha' }),
    featured: 1,
  },
  {
    name: 'Jaipur', slug: 'jaipur', country: 'India', state: 'Rajasthan', region: 'North India',
    lat: 26.9124, lng: 75.7873, type: 'heritage',
    tags: ['heritage', 'culture', 'architecture', 'shopping', 'royal', 'desert'],
    best_months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    language: 'Hindi, Rajasthani', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '0141-2385858',
    overview: 'The Pink City — capital of Rajasthan and one of India\'s most visited heritage destinations. Home to magnificent palaces, imposing forts, vibrant bazaars, and rich Rajasthani culture.',
    highlights: JSON.stringify(['Amber Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Johari Bazaar', 'Jal Mahal']),
    hidden_gems: JSON.stringify(['Panna Meena Ka Kund (stepwell)', 'Anokhi Museum of Hand Printing', 'Samode Palace village', 'Kanak Vrindavan Garden', 'Galta Ji Monkey Temple']),
    local_phrases: JSON.stringify({ 'Hello': 'Khamma Ghani', 'Thank you': 'Dhanyavaad', 'Welcome': 'Padharo Sa', 'Good': 'Chokho' }),
    featured: 1,
  },
  {
    name: 'Rishikesh', slug: 'rishikesh', country: 'India', state: 'Uttarakhand', region: 'North India',
    lat: 30.0869, lng: 78.2676, type: 'spiritual',
    tags: ['yoga', 'adventure', 'spiritual', 'rafting', 'trekking', 'camping', 'solo-friendly'],
    best_months: ['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'],
    language: 'Hindi, Garhwali', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '0135-2430372',
    overview: 'The Yoga Capital of the World. Nestled in the Himalayan foothills on the banks of the sacred Ganges, Rishikesh is a perfect blend of spirituality and adventure. World-class white water rafting, yoga ashrams, and the famous Laxman Jhula.',
    highlights: JSON.stringify(['Laxman Jhula', 'Ram Jhula', 'White Water Rafting', 'Ganga Aarti', 'Beatles Ashram', 'Neelkanth Mahadev Temple']),
    hidden_gems: JSON.stringify(['Kunjapuri Devi Temple (sunrise)', 'Rajaji National Park', 'Phool Chatti Ashram', 'Neergarh Waterfall', 'Swarg Ashram']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaste', 'Thank you': 'Dhanyavaad', 'Peace': 'Shanti', 'Sacred': 'Pavitra' }),
    featured: 1,
  },
  {
    name: 'Ladakh', slug: 'ladakh', country: 'India', state: 'Ladakh (UT)', region: 'North India',
    lat: 34.1526, lng: 77.5770, type: 'mountain',
    tags: ['adventure', 'high-altitude', 'monastery', 'biking', 'photography', 'solo-friendly'],
    best_months: ['Jun', 'Jul', 'Aug', 'Sep'],
    language: 'Ladakhi, Hindi, Tibetan', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '01982-252094',
    overview: 'The Land of High Passes — one of the most breathtaking destinations on Earth. Ancient Buddhist monasteries perched on cliffsides, azure high-altitude lakes, dramatic barren landscapes, and the mighty Himalayas.',
    highlights: JSON.stringify(['Pangong Tso Lake', 'Nubra Valley', 'Thiksey Monastery', 'Khardung La Pass', 'Magnetic Hill', 'Hemis Festival']),
    hidden_gems: JSON.stringify(['Tso Moriri Lake', 'Zanskar Valley', 'Lamayuru Moonland', 'Shey Palace', 'Dah Hanu (Aryan village)']),
    local_phrases: JSON.stringify({ 'Hello': 'Juley', 'Thank you': 'Juley (also thank you)', 'Good': 'Yaks', 'Beautiful': 'Chamba' }),
    featured: 1,
  },
  {
    name: 'Munnar', slug: 'munnar', country: 'India', state: 'Kerala', region: 'South India',
    lat: 10.0889, lng: 77.0595, type: 'hill-station',
    tags: ['tea-gardens', 'nature', 'honeymoon', 'trekking', 'wildlife', 'misty'],
    best_months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    language: 'Malayalam, Tamil', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '04865-231516',
    overview: 'Queen of hill stations in Kerala. Endless tea plantations stretching across undulating hills, misty valleys, rare Neelakurinji flowers that bloom once every 12 years, and the iconic Eravikulam National Park.',
    highlights: JSON.stringify(['Eravikulam National Park', 'Mattupetty Dam', 'Top Station', 'Tea Museum', 'Anamudi Peak', 'Echo Point']),
    hidden_gems: JSON.stringify(['Lockhart Gap', 'Rajamala Hills', 'Nyayamakad Waterfalls', 'Chinnar Wildlife Sanctuary', 'Kolukkumalai Tea Estate']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaskaram', 'Thank you': 'Nanni', 'How much?': 'Enthu vila?', 'Good': 'Nallath' }),
    featured: 1,
  },
  {
    name: 'Varanasi', slug: 'varanasi', country: 'India', state: 'Uttar Pradesh', region: 'North India',
    lat: 25.3176, lng: 82.9739, type: 'spiritual',
    tags: ['spiritual', 'heritage', 'ghats', 'culture', 'food', 'solo-friendly'],
    best_months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    language: 'Hindi, Bhojpuri', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '0542-2500345',
    overview: 'One of the oldest continuously inhabited cities in the world. The spiritual capital of India, Varanasi sits on the banks of the Ganges. Morning boat rides, evening Ganga Aarti, ancient ghats, silk sarees, and the finest street food.',
    highlights: JSON.stringify(['Dashashwamedh Ghat', 'Morning Boat Ride', 'Evening Ganga Aarti', 'Kashi Vishwanath Temple', 'Sarnath', 'Assi Ghat']),
    hidden_gems: JSON.stringify(['Manikarnika Ghat at dawn', 'Chunar Fort', 'Ramnagar Fort', 'Rajghat Bridge View', 'Bharat Mata Mandir']),
    local_phrases: JSON.stringify({ 'Hello': 'Pranam / Namaste', 'Thank you': 'Dhanyavaad', 'Sacred river': 'Ganga Maiya', 'Peace': 'Shanti' }),
    featured: 1,
  },
  {
    name: 'Andaman Islands', slug: 'andaman', country: 'India', state: 'Andaman & Nicobar (UT)', region: 'East India',
    lat: 11.7401, lng: 92.6586, type: 'island',
    tags: ['beach', 'diving', 'snorkeling', 'water-sports', 'tropical', 'honeymoon'],
    best_months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    language: 'Hindi, Bengali, Tamil', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '03192-232694',
    overview: 'A tropical paradise in the Bay of Bengal. Crystal-clear waters, pristine white sandy beaches, vibrant coral reefs, and lush rainforests. Radhanagar Beach is rated one of Asia\'s best beaches.',
    highlights: JSON.stringify(['Radhanagar Beach', 'Cellular Jail', 'Havelock Island', 'Ross Island', 'Neil Island', 'Scuba Diving at Elephant Beach']),
    hidden_gems: JSON.stringify(['Barren Island Volcano', 'Strait Island', 'Jolly Buoy Island', 'Cinque Island', 'Little Andaman']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaste', 'Thank you': 'Shukriya', 'Beautiful sea': 'Sundar samudra', 'Good': 'Achha' }),
    featured: 1,
  },

  // ─── Lesser-Known / Hidden Gems ──────────────────────────────────────────
  {
    name: 'Jibhi', slug: 'jibhi', country: 'India', state: 'Himachal Pradesh', region: 'North India',
    lat: 31.7972, lng: 77.2683, type: 'village',
    tags: ['offbeat', 'village', 'trekking', 'solo-friendly', 'budget', 'nature', 'quiet'],
    best_months: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    language: 'Hindi, local Pahari', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '01906-222340',
    overview: 'A tiny, magical village tucked in the Tirthan Valley of Himachal Pradesh. Far from tourist crowds, Jibhi offers dense forests of deodar cedars, trout streams, traditional wooden guesthouses, and some of the most peaceful trekking trails in the Himalayas.',
    highlights: JSON.stringify(['Jibhi Waterfall', 'Chhoie Waterfall Trek', 'Serolsar Lake Trek', 'Jalori Pass', 'Raghupur Fort']),
    hidden_gems: JSON.stringify(['Lambri Top Meadows', 'Shoja Village Stay', 'Tirthan River Fishing', 'Bashleo Pass', 'Local Homestay Dal Roti Evenings']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaste', 'Thank you': 'Shukriya', 'Good': 'Achha', 'Beautiful nature': 'Sundar prakriti' }),
    featured: 0,
  },
  {
    name: 'Shojha', slug: 'shojha', country: 'India', state: 'Himachal Pradesh', region: 'North India',
    lat: 31.8500, lng: 77.3000, type: 'village',
    tags: ['offbeat', 'village', 'trekking', 'solo-friendly', 'budget', 'meadows'],
    best_months: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    language: 'Hindi, local Pahari', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '01906-222340',
    overview: 'A quiet hamlet above Jibhi offering stunning meadows, apple orchards, and Himalayan panoramas. The gateway to Jalori Pass treks and one of the most underrated villages in Himachal. Perfect for slow travel and stargazing.',
    highlights: JSON.stringify(['Jalori Pass', 'Serolsar Lake', 'Raghupur Fort Ruins', 'Apple Orchards', 'Himalayan Views']),
    hidden_gems: JSON.stringify(['Lambri Top (360° panoramic views)', 'Shojha Meadows at Sunset', 'Night Sky Stargazing', 'Local Woodcraft Workshops']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaste', 'Thank you': 'Dhanyavaad', 'Good': 'Badhiya' }),
    featured: 0,
  },
  {
    name: 'Tirthan Valley', slug: 'tirthan-valley', country: 'India', state: 'Himachal Pradesh', region: 'North India',
    lat: 31.7500, lng: 77.3000, type: 'valley',
    tags: ['offbeat', 'fishing', 'trekking', 'solo-friendly', 'nature', 'wildlife', 'budget'],
    best_months: ['Mar', 'Apr', 'May', 'Jun', 'Sep', 'Oct'],
    language: 'Hindi, local Pahari', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '01906-222340',
    overview: 'Named after the Tirthan River, this pristine valley is part of the Great Himalayan National Park buffer zone. Famous for fly-fishing for trout, dense forests, crystal rivers, and traditional stone-and-wood homestays. A UNESCO World Heritage ecosystem.',
    highlights: JSON.stringify(['Great Himalayan National Park', 'Fly Fishing in Tirthan River', 'Waterfall Treks', 'Chhoie Waterfall', 'Gushaini Village']),
    hidden_gems: JSON.stringify(['Rolla Village', 'Bahu Forest Trek', 'Tirthan River Camping', 'Bashleo Wildlife Sighting', 'Handmade Trout Fishing with Locals']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaste', 'Thank you': 'Shukriya', 'River': 'Nadi', 'Forest': 'Jungle' }),
    featured: 0,
  },
  {
    name: 'Chitkul', slug: 'chitkul', country: 'India', state: 'Himachal Pradesh', region: 'North India',
    lat: 31.3500, lng: 78.4372, type: 'village',
    tags: ['offbeat', 'border-village', 'last-village', 'high-altitude', 'adventure', 'solo-friendly'],
    best_months: ['Jun', 'Jul', 'Aug', 'Sep'],
    language: 'Hindi, Kinnauri', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '01786-222016',
    overview: 'The last inhabited village before the Indo-Tibet border on the Hindustan-Tibet highway. Sitting at 3,450m in the Sangla Valley, Chitkul is famous for the pristine Baspa River, ancient temples, and apple orchards with views of snow-capped peaks. A true end-of-the-world feeling.',
    highlights: JSON.stringify(['Baspa River', 'Chitkul Temple', 'Apple Orchards', 'Last Tea Stall (ITBP checkpoint)', 'Sangla Valley views']),
    hidden_gems: JSON.stringify(['Chitkul Meadows Trek', 'Rupin Pass (3-day trek)', 'Sangla Meadows', 'Kamru Fort', 'Local Kinnauri Homestay']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaste / Juley', 'Thank you': 'Dhanyavaad', 'Snow peaks': 'Himshikhar', 'Village': 'Gaon' }),
    featured: 0,
  },
  {
    name: 'Spiti Valley', slug: 'spiti-valley', country: 'India', state: 'Himachal Pradesh', region: 'North India',
    lat: 32.2464, lng: 78.0349, type: 'valley',
    tags: ['adventure', 'high-altitude', 'monastery', 'desert', 'biking', 'photography', 'solo-friendly'],
    best_months: ['Jun', 'Jul', 'Aug', 'Sep'],
    language: 'Hindi, Spitian/Tibetan', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '01906-222500',
    overview: 'A cold desert mountain valley in the trans-Himalayan region — often called "Little Tibet." Stunning barren landscapes, ancient Buddhist monasteries (Key, Tabo, Dhankar), fossil-rich cliffs, and some of the darkest night skies on Earth.',
    highlights: JSON.stringify(['Key Monastery', 'Chandratal Lake', 'Kunzum Pass', 'Dhankar Monastery', 'Tabo Cave Monastery', 'Pin Valley National Park']),
    hidden_gems: JSON.stringify(['Hikkim (world\'s highest post office)', 'Komic Village', 'Langza Fossil Village', 'Kibber Wildlife Sanctuary', 'Lhalung Monastery']),
    local_phrases: JSON.stringify({ 'Hello': 'Juley', 'Thank you': 'Thuji Che', 'Good': 'Yagpo', 'Beautiful': 'Nyingje' }),
    featured: 0,
  },
  {
    name: 'Coorg', slug: 'coorg', country: 'India', state: 'Karnataka', region: 'South India',
    lat: 12.3375, lng: 75.8069, type: 'hill-station',
    tags: ['coffee-plantations', 'nature', 'trekking', 'wildlife', 'honeymoon', 'budget'],
    best_months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    language: 'Kodava, Kannada', currency: 'INR', timezone: 'Asia/Kolkata',
    emergency_police: '100', emergency_ambulance: '108', emergency_tourist: '08272-225708',
    overview: 'The Scotland of India — a stunning hill destination in Karnataka famous for vast coffee plantations, misty green hills, and the Cauvery River. Known for the proud Kodava warrior culture, homemade rice wine, and the freshest filter coffee you\'ll ever taste.',
    highlights: JSON.stringify(['Abbey Falls', 'Raja\'s Seat', 'Namdroling Monastery (Golden Temple)', 'Talakaveri (Cauvery origin)', 'Dubare Elephant Camp', 'Iruppu Falls']),
    hidden_gems: JSON.stringify(['Mandalpatti Peak (4x4 jeep)', 'Tadiandamol Trek (highest peak)', 'Nishane Gudde Sunrise', 'Chelavara Falls', 'Brahmagiri Wildlife Sanctuary']),
    local_phrases: JSON.stringify({ 'Hello': 'Namaskaara', 'Thank you': 'Dhanyavadagalu', 'Coffee': 'Kaapi', 'Good': 'Channagide' }),
    featured: 1,
  },
];

const seedReviews = [
  {
    destination_slug: 'goa', author_name: 'Priya Sharma', rating: 5,
    title: 'Absolutely Magical!', body: 'Spent 5 days in Goa and it was the perfect mix of beaches, history, and food. Baga at night is unreal. Hired a scooter for ₹300/day and explored everything!',
    tags: JSON.stringify(['beach', 'nightlife', 'food', 'scooter']),
    accommodation_name: 'The Postcard Cuelim', accommodation_type: 'boutique',
    accommodation_rating: 5, accommodation_link: '#',
  },
  {
    destination_slug: 'jibhi', author_name: 'Arjun Mehta', rating: 5,
    title: 'Best Solo Trip I\'ve Taken', body: 'Jibhi completely blew my mind. Zero tourists, incredible forests, a waterfall I had entirely to myself. Stayed in a wooden homestay for ₹800/night with home-cooked meals. DO IT.',
    tags: JSON.stringify(['solo', 'offbeat', 'homestay', 'trekking']),
    accommodation_name: 'Himalayan Trout House', accommodation_type: 'homestay',
    accommodation_rating: 5, accommodation_link: '#',
  },
  {
    destination_slug: 'ladakh', author_name: 'Sneha Iyer', rating: 5,
    title: 'Life-changing Landscape', body: 'Pangong Lake at sunrise will stay with me forever. Spent 10 days on a Royal Enfield across Ladakh. Acclimatize properly — altitude sickness is real!',
    tags: JSON.stringify(['biking', 'adventure', 'high-altitude', 'photography']),
    accommodation_name: 'The Abi Guest House', accommodation_type: 'guesthouse',
    accommodation_rating: 4, accommodation_link: '#',
  },
  {
    destination_slug: 'chitkul', author_name: 'Rohan Das', rating: 5,
    title: 'The Last Village Feeling', body: 'Driving to Chitkul felt like reaching the edge of the world. The Baspa River is surreal. Ate the best rajma chawal of my life at a tiny dhaba. 11/10.',
    tags: JSON.stringify(['offbeat', 'food', 'scenic', 'road-trip']),
    accommodation_name: 'Local Homestay (Chitkul)', accommodation_type: 'homestay',
    accommodation_rating: 4, accommodation_link: '#',
  },
];

async function seed() {
  await initDb();
  const db = getDb();

  console.log('🌱 Seeding destinations into Firestore...');
  
  // Use batches for efficient writes
  let batch = db.batch();
  let destDocIds = {}; // Map slug -> doc id for reviews

  const imageMap = {
    'goa': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/f/fc/BeachFun.jpg/960px-BeachFun.jpg',
    'manali': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/03/Manali_City.jpg/960px-Manali_City.jpg',
    'jaipur': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/960px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
    'rishikesh': '/images/destinations/rishikesh.jpg',
    'ladakh': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Road_Padum_Zanskar_Range_Jun24_A7CR_00818.jpg/960px-Road_Padum_Zanskar_Range_Jun24_A7CR_00818.jpg',
    'munnar': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Munnar_Overview.jpg/960px-Munnar_Overview.jpg',
    'varanasi': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Varanasi%2C_India%2C_Ghats%2C_Cremation_ceremony_in_progress.jpg/960px-Varanasi%2C_India%2C_Ghats%2C_Cremation_ceremony_in_progress.jpg',
    'andaman': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/1/19/Havelock_Island%2C_Sandy_lagoon%2C_Andaman_Islands.jpg/960px-Havelock_Island%2C_Sandy_lagoon%2C_Andaman_Islands.jpg',
    'jibhi': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Himalayn_National_Park_01.jpg/960px-Himalayn_National_Park_01.jpg',
    'shojha': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/03/Manali_City.jpg/960px-Manali_City.jpg',
    'tirthan-valley': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Himalayn_National_Park_01.jpg/960px-Himalayn_National_Park_01.jpg',
    'chitkul': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/02/Temple_at_Chitkul.JPG/960px-Temple_at_Chitkul.JPG',
    'spiti-valley': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/49/1000_Year_loop.jpg/960px-1000_Year_loop.jpg',
    'coorg': 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/1/17/Tadiandamol_Valley%2C_Western_Ghats.jpg/960px-Tadiandamol_Valley%2C_Western_Ghats.jpg'
  };

  const { FieldValue } = require('firebase-admin/firestore');

  for (const row of destinations) {
    row.image_url = imageMap[row.slug] || 'https://images.unsplash.com/photo-1506461883276-594c8cb25638?auto=format&fit=crop&w=800&q=80';
    
    // Create a new doc reference so we have the ID instantly
    const docRef = db.collection('destinations').doc(row.slug); 
    destDocIds[row.slug] = row.slug; 
    
    batch.set(docRef, row);
  }

  await batch.commit();
  console.log(`✅ ${destinations.length} destinations seeded`);

  console.log('🌱 Seeding reviews...');
  let reviewBatch = db.batch();

  for (const review of seedReviews) {
    const destSlug = review.destination_slug;
    const destinationId = destDocIds[destSlug];
    
    if (!destinationId) continue;
    
    const docRef = db.collection('reviews').doc();
    reviewBatch.set(docRef, {
      ...review,
      destination_id: destinationId,
      destination_name: destinations.find(d => d.slug === destSlug)?.name || null,
      created_at: FieldValue.serverTimestamp(),
      helpful: 0
    });
  }

  await reviewBatch.commit();
  console.log(`✅ ${seedReviews.length} reviews seeded`);

  console.log('\n🎉 Firestore Database seeded successfully!\n');
  process.exit(0);
}

seed();
