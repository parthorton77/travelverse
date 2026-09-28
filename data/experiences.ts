import type { DaySlot, Dining, Experience, ExperienceKind, Interest, StayTier } from "@/lib/types";

/**
 * Experiences and dining (sample data). Costs are INR per person and are
 * illustrative planning estimates only.
 */

type ExperienceSeed = [
  id: string,
  title: string,
  kind: ExperienceKind,
  tags: Interest[],
  slot: DaySlot,
  hours: number,
  cost: number,
  location: string,
  intensity: number,
  description: string,
  flags?: { arrival?: boolean; signature?: boolean },
];

type DiningSeed = [id: string, name: string, cuisine: string, location: string, cost: number, tier: StayTier, description: string];

const catalogue: Record<string, { experiences: ExperienceSeed[]; dining: DiningSeed[] }> = {
  goa: {
    experiences: [
      ["sunset-cliffs", "Sunset at Cabo de Rama cliffs", "beach", ["beach", "nature", "relaxation"], "evening", 2, 0, "Cabo de Rama, South Goa", 0.2, "Walk the old fort ramparts to a cliff edge made for golden hour.", { arrival: true }],
      ["river-cruise", "Mandovi river sunset cruise", "water", ["relaxation", "nightlife"], "evening", 1.5, 900, "Panaji", 0.1, "Folk music, a slow river and the lights of Panaji coming on.", { arrival: true }],
      ["water-sports", "Jet-ski, parasail & kayak session", "water", ["adventure", "beach"], "morning", 3, 2200, "Baga & Calangute", 0.8, "A morning on the water — speed first, then a calm paddle back to shore."],
      ["grande-island", "Grande Island snorkel & dolphin run", "island", ["adventure", "nature", "beach"], "full-day", 7, 2100, "Grande Island, off Vasco", 0.6, "Reef snorkelling, a dolphin run past the headland and lunch on the boat.", { signature: true }],
      ["chefs-table", "Private chef's table on the sand", "luxury", ["luxury", "food"], "evening", 3, 3800, "Agonda Beach", 0.1, "Seven Goan courses, lanterns in the sand and the tide for a soundtrack.", { signature: true }],
      ["fontainhas", "Fontainhas heritage walk & tasting", "culture", ["culture", "food"], "morning", 3, 1200, "Fontainhas, Panaji", 0.3, "Azulejos, chapels and bebinca in Goa's Latin quarter."],
      ["spice-farm", "Spice plantation lunch", "food", ["food", "nature"], "afternoon", 3, 1000, "Ponda", 0.3, "Walk the pepper vines, then a banana-leaf lunch under the areca palms."],
      ["night-market", "Arpora Saturday night market", "nightlife", ["nightlife", "shopping", "food"], "evening", 3, 300, "Arpora", 0.3, "Live music, street food and stalls from across the country."],
      ["butterfly-kayak", "Dawn kayak to Butterfly Beach", "adventure", ["adventure", "beach", "nature"], "morning", 3, 1500, "Palolem", 0.6, "Paddle out before the heat to a cove reachable only by water."],
      ["goa-spa", "Ayurvedic spa ritual", "wellness", ["wellness", "relaxation", "luxury"], "afternoon", 2, 3200, "South Goa", 0, "Abhyanga oil massage and a herbal steam in a garden pavilion."],
    ],
    dining: [
      ["goa-tavern", "Family-run tavern", "Goan", "Fontainhas", 900, "comfort", "Fish curry rice and a feni cocktail in a 19th-century house."],
      ["goa-shack", "Beach shack seafood thali", "Coastal", "Palolem", 700, "comfort", "Kingfish, prawns and sol kadhi with your feet in the sand."],
      ["goa-tasting", "Modern Goan tasting menu", "Contemporary Goan", "Assagao", 2800, "luxury", "Heirloom recipes reimagined in a leafy villa."],
    ],
  },
  rajasthan: {
    experiences: [
      ["amber-fort", "Amber Fort at opening hour", "culture", ["culture"], "morning", 3, 900, "Jaipur", 0.4, "Walk the ramparts and the Sheesh Mahal before the crowds arrive.", { signature: true }],
      ["balloon", "Hot-air balloon over the Aravallis", "adventure", ["adventure", "luxury", "nature"], "morning", 3, 14000, "Jaipur", 0.3, "Drift over forts and village fields as the sun comes up.", { signature: true }],
      ["dunes-camp", "Sam dunes camel ride & desert camp", "desert", ["adventure", "nature", "culture"], "evening", 5, 3500, "Jaisalmer", 0.5, "Ride into the dunes for sunset, folk music and a sky full of stars."],
      ["pichola", "Lake Pichola boat at sunset", "water", ["relaxation", "culture"], "evening", 1.5, 900, "Udaipur", 0.1, "Glide past the City Palace as the lake turns to copper.", { arrival: true }],
      ["bazaar-trail", "Old city bazaar & food trail", "food", ["food", "culture", "shopping"], "evening", 3, 1200, "Jaipur old city", 0.3, "Pyaaz kachori, lassi in clay cups and the lanes of Johari Bazaar.", { arrival: true }],
      ["mehrangarh", "Mehrangarh & blue city walk", "culture", ["culture"], "morning", 4, 800, "Jodhpur", 0.5, "A cliff-top fortress above a sea of indigo houses."],
      ["bundi", "Bundi stepwells & murals", "culture", ["culture", "hidden-gems"], "full-day", 8, 2500, "Bundi", 0.4, "A lesser-known town of stepwells and palace murals."],
      ["palace-dinner", "Royal courtyard dinner", "luxury", ["luxury", "food", "culture"], "evening", 3, 6500, "Udaipur", 0.1, "Laal maas and candlelight in a heritage courtyard."],
    ],
    dining: [
      ["raj-thali", "Dal baati churma thali", "Rajasthani", "Jaipur", 600, "comfort", "The classic, served with ghee and generosity."],
      ["raj-rooftop", "Rooftop kachori breakfast", "Street food", "Jodhpur", 300, "comfort", "Mirchi vada with a view of Mehrangarh."],
      ["raj-palace", "Heritage palace dinner", "Royal Rajasthani", "Udaipur", 5500, "luxury", "Lakeside tables inside former royal quarters."],
    ],
  },
  dubai: {
    experiences: [
      ["desert-safari", "Dune drive & desert camp at dusk", "desert", ["adventure", "nature"], "afternoon", 5, 4500, "Al Marmoom desert", 0.6, "Red dunes, falcons and dinner under a Bedouin sky.", { signature: true }],
      ["burj-sunset", "At the Top, Burj Khalifa at sunset", "city", ["luxury", "culture"], "evening", 2, 3500, "Downtown Dubai", 0.1, "Watch the city switch on from 555 metres.", { arrival: true }],
      ["creek-souks", "Abra crossing & old Dubai souks", "culture", ["culture", "food", "shopping"], "morning", 3, 400, "Deira & Al Fahidi", 0.3, "Cross the creek by wooden boat into the spice and gold souks."],
      ["food-walk", "Old Dubai street food walk", "food", ["food", "culture"], "evening", 3, 3200, "Al Karama & Deira", 0.2, "Emirati, Iranian and Indian flavours in a single evening."],
      ["dhow-dinner", "Marina dhow dinner cruise", "nightlife", ["luxury", "nightlife", "food"], "evening", 2.5, 3800, "Dubai Marina", 0.1, "A lantern-lit dhow gliding between towers.", { arrival: true }],
      ["museum-future", "Museum of the Future", "culture", ["culture"], "afternoon", 2, 3700, "Sheikh Zayed Road", 0.1, "A torus of calligraphy and speculative design."],
      ["beach-club", "Beach club afternoon at JBR", "beach", ["beach", "relaxation", "luxury"], "afternoon", 4, 2500, "JBR", 0, "Loungers, the Gulf and a skyline behind you."],
    ],
    dining: [
      ["dxb-breakfast", "Emirati breakfast", "Emirati", "Al Fahidi", 1500, "comfort", "Balaleet, chebab and cardamom coffee in a wind-tower courtyard."],
      ["dxb-karak", "Shawarma & karak crawl", "Street food", "Karama", 600, "comfort", "The city's best cheap eats, done properly."],
      ["dxb-skyline", "Skyline dining", "Modern", "Sheikh Zayed Road", 7500, "luxury", "Tasting menu sixty floors above the city."],
    ],
  },
  paris: {
    experiences: [
      ["seine-dusk", "The Seine at dusk by boat", "water", ["relaxation", "culture"], "evening", 1.5, 1600, "Pont Neuf", 0.1, "The city's monuments slide by as the lamps come on.", { arrival: true, signature: true }],
      ["orsay", "Musée d'Orsay, impressionist hour", "culture", ["culture"], "morning", 3, 1500, "Rive Gauche", 0.2, "Monet, Degas and the great station clock."],
      ["marais-food", "Le Marais food walk", "food", ["food", "culture"], "afternoon", 3, 7500, "Le Marais", 0.3, "Fromage, falafel and patisserie with a local guide."],
      ["eiffel-summit", "Eiffel Tower summit", "city", ["culture", "luxury"], "evening", 2, 3200, "Champ de Mars", 0.2, "Up to the top for the sparkle on the hour."],
      ["montmartre", "Montmartre at first light", "culture", ["culture", "nature"], "morning", 2.5, 0, "Montmartre", 0.4, "Empty cobbles, Sacré-Cœur and a café crème."],
      ["versailles", "Versailles by bike", "adventure", ["culture", "adventure", "nature"], "full-day", 7, 6800, "Versailles", 0.6, "Palace, gardens and a picnic by the Grand Canal."],
      ["jazz-cellar", "Left Bank jazz cellar", "nightlife", ["nightlife", "culture"], "evening", 3, 2600, "Saint-Germain", 0.1, "Vaulted stone, a trio and a glass of Bordeaux."],
      ["pastry", "Pastry atelier masterclass", "food", ["food", "luxury"], "afternoon", 3, 9500, "Saint-Germain", 0.1, "Laminate, fold and bake your own croissants."],
    ],
    dining: [
      ["par-bistro", "Bistro prix-fixe", "French", "Le Marais", 3500, "comfort", "Steak frites and a carafe of house red."],
      ["par-market", "Covered market lunch", "Market", "Marché des Enfants Rouges", 2000, "comfort", "Paris's oldest covered market, for lunch."],
      ["par-tasting", "Seine-view chef's tasting", "Haute cuisine", "Quai de la Tournelle", 18000, "luxury", "A long lunch overlooking Notre-Dame."],
    ],
  },
  tokyo: {
    experiences: [
      ["shibuya-night", "Shibuya & Shinjuku after dark", "city", ["nightlife", "culture"], "evening", 3, 0, "Shibuya", 0.3, "The Scramble, Omoide Yokocho and the neon canyons of Kabukicho.", { arrival: true, signature: true }],
      ["tsukiji", "Tsukiji outer market breakfast", "food", ["food"], "morning", 2.5, 3500, "Tsukiji", 0.2, "Tamagoyaki, tuna and matcha before 9am."],
      ["sensoji", "Senso-ji before the crowds", "culture", ["culture"], "morning", 2, 0, "Asakusa", 0.2, "Incense and lanterns in the soft light of dawn."],
      ["fuji-day", "Mt Fuji & Lake Kawaguchi day trip", "mountain", ["nature", "adventure"], "full-day", 10, 9500, "Fuji Five Lakes", 0.5, "The classic view, a lakeside walk and a pagoda framed by the peak."],
      ["omakase", "Counter-seat omakase", "luxury", ["food", "luxury"], "evening", 2, 22000, "Ginza", 0.1, "Twenty pieces, one chef, zero rush."],
      ["izakaya", "Yurakucho izakaya crawl", "nightlife", ["food", "nightlife"], "evening", 3, 4500, "Yurakucho", 0.2, "Yakitori and highballs under the train tracks."],
      ["digital-art", "Immersive digital art museum", "culture", ["culture"], "afternoon", 2.5, 2600, "Toyosu", 0.2, "Walk through water and light."],
      ["hakone", "Hakone onsen day", "wellness", ["wellness", "relaxation", "nature"], "full-day", 9, 8500, "Hakone", 0.2, "Hot springs, a ropeway over the volcano and a lake cruise."],
    ],
    dining: [
      ["tyo-ramen", "Ramen counter", "Ramen", "Shinjuku", 1400, "comfort", "Order from the machine, sit at the counter, slurp."],
      ["tyo-depachika", "Depachika picnic", "Department store food hall", "Nihonbashi", 1800, "comfort", "Bento, wagashi and fruit you will photograph."],
      ["tyo-kaiseki", "Kaiseki dinner", "Kaiseki", "Ginza", 20000, "luxury", "Seasonal courses in a hushed tatami room."],
    ],
  },
  bali: {
    experiences: [
      ["batur-sunrise", "Mount Batur sunrise trek", "adventure", ["adventure", "nature", "mountains"], "morning", 6, 3500, "Kintamani", 0.9, "Start at 3am, reach the rim as the sky catches fire.", { signature: true }],
      ["terraces", "Tegallalang rice terraces", "nature", ["nature"], "morning", 3, 1200, "Ubud", 0.4, "Subak irrigation, jungle swings and coconut on the ridge."],
      ["uluwatu-kecak", "Uluwatu temple & Kecak fire dance", "culture", ["culture"], "evening", 3, 1500, "Uluwatu", 0.2, "A clifftop temple, a hundred voices and the sunset.", { arrival: true }],
      ["nusa-penida", "Nusa Penida island day", "island", ["beach", "adventure", "nature"], "full-day", 10, 5500, "Nusa Penida", 0.7, "Kelingking cliffs and snorkelling with manta rays."],
      ["surf", "Beginner surf at Canggu", "water", ["adventure", "beach"], "morning", 3, 2800, "Canggu", 0.8, "Soft sand, gentle breaks and a patient instructor."],
      ["bali-spa", "Balinese spa & flower bath", "wellness", ["wellness", "relaxation", "luxury"], "afternoon", 2.5, 3200, "Ubud", 0, "Boreh scrub and a bath of frangipani."],
      ["jimbaran", "Jimbaran seafood at sunset", "food", ["food", "beach", "relaxation"], "evening", 2.5, 2400, "Jimbaran Bay", 0.1, "Grilled fish, candles and your toes in the sand.", { arrival: true }],
      ["cliff-club", "Clifftop beach club", "nightlife", ["nightlife", "luxury", "beach"], "afternoon", 4, 4000, "Uluwatu", 0.1, "An infinity pool that meets the Indian Ocean."],
    ],
    dining: [
      ["bal-warung", "Warung nasi campur", "Balinese", "Ubud", 500, "comfort", "A little of everything, all of it good."],
      ["bal-guling", "Babi guling lunch", "Balinese", "Gianyar", 700, "comfort", "The island's celebrated spit-roast."],
      ["bal-jungle", "Jungle-view tasting menu", "Modern Indonesian", "Ubud", 7500, "luxury", "Nine courses above the Ayung river."],
    ],
  },
  switzerland: {
    experiences: [
      ["jungfraujoch", "Jungfraujoch, top of Europe", "mountain", ["mountains", "nature", "luxury"], "full-day", 8, 21000, "Bernese Oberland", 0.4, "Cog railway through the Eiger to a world of ice.", { signature: true }],
      ["lauterbrunnen", "Valley of waterfalls hike", "nature", ["nature", "adventure"], "morning", 4, 0, "Lauterbrunnen", 0.6, "Staubbach falls, meadows and cowbells."],
      ["paraglide", "Tandem paraglide over Interlaken", "adventure", ["adventure"], "morning", 2.5, 17000, "Interlaken", 0.7, "Launch from Beatenberg and land between two lakes."],
      ["lucerne", "Lucerne old town & Chapel Bridge", "culture", ["culture"], "afternoon", 3, 0, "Lucerne", 0.2, "Painted gables and the oldest covered bridge in Europe.", { arrival: true }],
      ["brienz", "Lake Brienz turquoise cruise", "water", ["relaxation", "nature"], "afternoon", 2, 4200, "Brienz", 0.1, "Glacial water the colour of a gemstone.", { arrival: true }],
      ["fondue", "Fondue in an alpine hut", "food", ["food"], "evening", 2, 4500, "Grindelwald", 0.1, "Gruyère, kirsch and a view of the Eiger north face.", { arrival: true }],
      ["glacier-express", "Glacier Express panorama ride", "luxury", ["luxury", "nature"], "full-day", 8, 26000, "Zermatt → St. Moritz", 0.1, "291 bridges, 91 tunnels and a very slow lunch."],
      ["alpine-spa", "Thermal spa with alpine view", "wellness", ["wellness", "relaxation", "luxury"], "afternoon", 3, 7000, "Interlaken", 0, "Warm water, cold air, snowy peaks."],
    ],
    dining: [
      ["ch-rosti", "Rösti at a valley inn", "Swiss", "Wengen", 3500, "comfort", "Crisp potato, alpine cheese, mountain air."],
      ["ch-choc", "Chocolate atelier tasting", "Chocolate", "Interlaken", 3000, "comfort", "Single-origin bars and a hot chocolate."],
      ["ch-tasting", "Alpine tasting menu", "Modern Alpine", "Gstaad", 16000, "luxury", "Foraged herbs and lake fish, beautifully plated."],
    ],
  },
  "new-york": {
    experiences: [
      ["brooklyn-bridge", "Brooklyn Bridge at golden hour", "city", ["culture", "nature"], "evening", 2, 0, "DUMBO", 0.4, "Walk west into the skyline as the towers light up.", { arrival: true, signature: true }],
      ["central-park", "Central Park by bike", "nature", ["nature", "adventure"], "morning", 3, 3500, "Central Park", 0.5, "Bethesda Terrace, the Reservoir and hidden bridges."],
      ["chelsea-food", "Chelsea Market & High Line food walk", "food", ["food", "culture"], "afternoon", 3, 6500, "Chelsea", 0.3, "Tacos, lobster rolls and an elevated park."],
      ["broadway", "Broadway show night", "nightlife", ["nightlife", "culture", "luxury"], "evening", 3, 13000, "Theater District", 0.1, "Orchestra seats and Times Square after the curtain."],
      ["met", "The Met, curated route", "culture", ["culture"], "morning", 3, 2500, "Upper East Side", 0.3, "Temple of Dendur to Van Gogh in two hours."],
      ["jazz-club", "Harlem jazz supper club", "nightlife", ["nightlife", "food"], "evening", 3, 7500, "Harlem", 0.1, "Soul food and a late set."],
      ["heli", "Manhattan helicopter flight", "luxury", ["luxury", "adventure"], "afternoon", 1, 22000, "Downtown Heliport", 0.2, "Liberty, Midtown and the Hudson in fifteen minutes."],
      ["ferry", "Staten Island ferry skyline run", "water", ["relaxation"], "afternoon", 1.5, 0, "Whitehall", 0.1, "The best free view in the city."],
    ],
    dining: [
      ["ny-bagel", "Bagel & lox breakfast", "Deli", "Lower East Side", 1500, "comfort", "Hand-rolled, with a schmear."],
      ["ny-pizza", "Pizza slice crawl", "Pizza", "Greenwich Village", 1800, "comfort", "Four slices, four legends."],
      ["ny-tasting", "Tasting menu with skyline views", "New American", "Hudson Yards", 25000, "luxury", "A long dinner above the Hudson."],
    ],
  },
  kerala: {
    experiences: [
      ["houseboat", "Backwater houseboat day", "water", ["relaxation", "nature"], "full-day", 7, 4000, "Alleppey", 0.1, "Drift past paddy fields and village life on a kettuvallam.", { signature: true }],
      ["munnar-tea", "Munnar tea estate walk", "nature", ["nature", "mountains"], "morning", 4, 1200, "Munnar", 0.5, "Mist, tea pickers and a tasting at the factory."],
      ["kathakali", "Kathakali performance", "culture", ["culture"], "evening", 2, 600, "Fort Kochi", 0.1, "Watch the make-up go on, then the story unfold.", { arrival: true }],
      ["kochi-cycle", "Fort Kochi heritage cycle", "culture", ["culture", "food"], "morning", 3, 1000, "Fort Kochi", 0.4, "Chinese fishing nets, Jew Town and spice warehouses."],
      ["ayurveda", "Ayurveda abhyanga ritual", "wellness", ["wellness", "relaxation"], "afternoon", 2, 3500, "Kumarakom", 0, "Warm oils, synchronised hands, total stillness."],
      ["varkala", "Varkala cliff sunset", "beach", ["beach", "relaxation"], "evening", 2, 0, "Varkala", 0.2, "Red cliffs, a long beach and the Arabian Sea.", { arrival: true }],
      ["village-canoe", "Village canoe at dawn", "nature", ["nature", "adventure", "hidden-gems"], "morning", 3, 1500, "Kainakary", 0.4, "Narrow canals a houseboat can't reach."],
      ["sadya", "Cooking class: Kerala sadya", "food", ["food", "culture"], "afternoon", 3, 2200, "Kumarakom", 0.2, "Twenty dishes on a banana leaf — and you made them."],
    ],
    dining: [
      ["ker-karimeen", "Karimeen pollichathu by the water", "Keralan", "Alleppey", 900, "comfort", "Pearl spot fish baked in banana leaf."],
      ["ker-toddy", "Toddy shop lunch", "Keralan", "Kuttanad", 500, "comfort", "Tapioca, fish curry and very fresh toddy."],
      ["ker-tasting", "Spice-coast tasting menu", "Modern Keralan", "Fort Kochi", 4500, "luxury", "Pepper, cardamom and the morning's catch."],
    ],
  },
  ladakh: {
    experiences: [
      ["pangong", "Pangong Tso overnight", "nature", ["nature", "adventure"], "full-day", 10, 3500, "Pangong", 0.6, "Cross Chang La to a lake that changes colour by the hour.", { signature: true }],
      ["khardung", "Khardung La pass drive", "adventure", ["adventure", "mountains"], "full-day", 8, 2500, "Khardung La", 0.6, "Prayer flags at 5,359 m, then down into Nubra."],
      ["thiksey", "Thiksey monastery morning prayers", "culture", ["culture"], "morning", 2, 200, "Thiksey", 0.3, "Horns, chanting and butter tea at sunrise."],
      ["rafting", "Zanskar river rafting", "water", ["adventure"], "morning", 4, 3500, "Nimmu", 0.9, "Grade III rapids through a desert canyon."],
      ["nubra", "Nubra dunes at sunset", "desert", ["nature", "adventure"], "evening", 3, 1500, "Hunder", 0.4, "Bactrian camels on silver dunes."],
      ["old-leh", "Old Leh town & palace", "culture", ["culture", "hidden-gems"], "afternoon", 3, 300, "Leh", 0.3, "An easy first-day wander while you acclimatise.", { arrival: true }],
      ["stargazing", "High-altitude stargazing", "nature", ["nature", "hidden-gems"], "evening", 2, 1500, "Leh outskirts", 0.1, "The Milky Way, bright enough to cast shadows."],
    ],
    dining: [
      ["lad-thukpa", "Thukpa & momos in the old town", "Ladakhi", "Leh", 400, "comfort", "Warm noodle soup at altitude."],
      ["lad-orchard", "Apricot orchard lunch", "Ladakhi", "Nubra", 700, "comfort", "Skyu stew under the apricot trees."],
      ["lad-farm", "Farm-to-table Ladakhi dinner", "Ladakhi", "Stok", 2500, "luxury", "Heritage recipes in a restored farmhouse."],
    ],
  },
  meghalaya: {
    experiences: [
      ["root-bridge", "Double-decker living root bridge trek", "adventure", ["adventure", "nature", "hidden-gems"], "full-day", 7, 1500, "Nongriat", 0.9, "3,500 steps down to a bridge that has grown for 200 years.", { signature: true }],
      ["dawki", "Dawki crystal river boat", "water", ["nature", "relaxation"], "morning", 3, 1200, "Dawki", 0.2, "A boat that appears to hover over the river bed."],
      ["mawlynnong", "Mawlynnong village walk", "culture", ["culture", "hidden-gems"], "afternoon", 2, 300, "Mawlynnong", 0.2, "Bamboo sky-walks and flower-lined paths."],
      ["caves-falls", "Mawsmai caves & Seven Sisters falls", "nature", ["adventure", "nature"], "morning", 4, 800, "Sohra", 0.5, "Limestone caves and seven ribbons of water."],
      ["shillong-music", "Shillong live music evening", "nightlife", ["nightlife", "culture"], "evening", 3, 1200, "Shillong", 0.1, "India's rock capital, in a tiny club.", { arrival: true }],
      ["laitlum", "Laitlum canyons at sunrise", "nature", ["nature"], "morning", 3, 0, "Laitlum", 0.4, "Mist pouring over the edge of the plateau."],
      ["khasi-food", "Khasi food trail", "food", ["food", "culture"], "evening", 2, 900, "Police Bazaar, Shillong", 0.1, "Jadoh, smoked pork and black sesame.", { arrival: true }],
    ],
    dining: [
      ["meg-jadoh", "Jadoh & dohneiiong lunch", "Khasi", "Shillong", 400, "comfort", "Red rice cooked with pork, the local staple."],
      ["meg-cafe", "Café hop in Laitumkhrah", "Cafés", "Shillong", 800, "comfort", "Hill-town coffee and pine-view terraces."],
      ["meg-pine", "Pine-forest chef dinner", "Modern Northeast", "Upper Shillong", 2800, "luxury", "Foraged greens and fermented flavours."],
    ],
  },
  maldives: {
    experiences: [
      ["house-reef", "House reef snorkel with turtles", "water", ["nature", "adventure", "beach"], "morning", 2, 0, "Resort house reef", 0.4, "Step off the villa deck into a coral garden."],
      ["sandbank", "Private sandbank picnic", "island", ["beach", "luxury", "relaxation"], "afternoon", 4, 9500, "North Malé Atoll", 0.1, "A shade sail, a hamper and nothing else for miles.", { signature: true }],
      ["manta", "Manta & whale shark excursion", "adventure", ["adventure", "nature"], "full-day", 6, 12000, "South Ari Atoll", 0.6, "Swim alongside the ocean's gentlest giants."],
      ["dolphin-cruise", "Sunset dolphin cruise", "water", ["relaxation", "nature"], "evening", 2, 4500, "North Malé", 0.1, "Spinner dolphins in the golden hour.", { arrival: true }],
      ["overwater-spa", "Overwater spa ritual", "wellness", ["wellness", "luxury", "relaxation"], "afternoon", 2, 11000, "Resort", 0, "Glass floors, reef fish below and warm coconut oil."],
      ["reef-dining", "Reef-level dining room", "luxury", ["luxury", "food"], "evening", 2.5, 28000, "South Ari Atoll", 0.1, "Dinner five metres below the surface."],
      ["local-island", "Local island & Malé fish market", "culture", ["culture", "food"], "morning", 3, 1500, "Malé", 0.3, "Tuna auctions and the Friday Mosque."],
      ["beach-cinema", "Beach cinema under the stars", "nightlife", ["relaxation", "nightlife"], "evening", 2, 0, "Resort", 0, "A screen on the sand and a blanket of stars.", { arrival: true }],
    ],
    dining: [
      ["mv-mashuni", "Mas huni breakfast", "Maldivian", "Resort", 1200, "comfort", "Tuna, coconut and chilli with warm roshi."],
      ["mv-bbq", "Reef-fish barbecue on the sand", "Seafood", "Resort beach", 4500, "premium", "Catch of the day, grilled at your table."],
      ["mv-tasting", "Chef's overwater tasting", "Modern", "Resort", 16000, "luxury", "Eight courses above the lagoon."],
    ],
  },
};

export const experiences: Experience[] = Object.entries(catalogue).flatMap(([destinationId, entry]) =>
  entry.experiences.map(([id, title, kind, tags, slot, durationHours, costPerPerson, location, intensity, description, flags]) => ({
    id: `${destinationId}-${id}`,
    destinationId,
    title,
    kind,
    tags,
    slot,
    durationHours,
    costPerPerson,
    location,
    intensity,
    description,
    arrivalFriendly: flags?.arrival,
    signature: flags?.signature,
  })),
);

export const dining: Dining[] = Object.entries(catalogue).flatMap(([destinationId, entry]) =>
  entry.dining.map(([id, name, cuisine, location, costPerPerson, tier, description]) => ({
    id,
    destinationId,
    name,
    cuisine,
    location,
    costPerPerson,
    tier,
    description,
  })),
);
