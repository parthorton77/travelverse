# TravelVerse

**Explore the world before you book it.** A working prototype of an immersive travel-discovery product, and a demo of the engine underneath it that partners could license: a 3D destination globe, an AI journey engine, an interactive journey simulator and walkable stays.

> Prototype data: destinations and landmarks are real. Stays are fictional concept properties. Every price, fare and duration is an illustrative **estimate** from sample data, never a live offer or availability.

## Run it

Requires Node.js 20.9+.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
npm start            # http://localhost:3000
```

Checks: `npx tsc --noEmit` and `npm run lint`.

No environment variables are needed. See `.env.example` for the server-side provider switch.

## What's inside

| Route | Experience |
| --- | --- |
| `/` | Hero globe → manifesto → destination rail → AI trip builder → interactive journey → Travel DNA → Walk Before You Book → experiences → TravelVerse Engine (B2B) → final CTA |
| `/explore` | Sticky globe that follows the list, with category filters (beach, mountains, city, adventure, culture, luxury, food, hidden gems). Mobile: swipe cards and a bottom sheet |
| `/destinations/[slug]` | Cinematic arrival, points of interest, experiences, stays, dining, next destination (12 static pages) |
| `/plan` | AI trip builder plus Travel DNA. Accepts `?destination=goa` and `?q=...` |
| `/journey` | Journey simulator for the current trip (or the sample trip) |
| `/stays` | Walkable 3D concept resort (Casa Maré) with morning, sunset and night lighting |
| `/partners` | Engine modules, live API console, partner enquiry form (sends nothing) |

### API (v1, sample data)

- `GET /api/v1/destinations?category=beach`
- `GET /api/v1/destinations/:slug`
- `POST /api/v1/trips`: body is a (partial) `TripRequest`; returns `{ trip, meta }`

## Architecture

```
app/                    routes, API route handlers, loading/error/not-found states
components/
  3d/                   Globe (WebGL2 scene, 2D canvas fallback, error boundary, camera rig, label projector)
  ai/                   TripPlanner, PlannerControls, TripGeneration, TripResult, BudgetBar
  journey/              JourneyTimeline, JourneyStage, ItineraryGrid
  destination/          DestinationScene (procedural imagery), rail, explore, destination experience
  hotel/                HotelExplorer, HotelScene (R3F), HotelFallback, BookingDialog
  dna/                  TravelDNA, DnaSignature
  b2b/                  EngineShowcase, ApiConsole, PartnerForm
  providers/            DNA, trip and transition contexts
  ui/                   buttons, animated text, sheets, loaders, estimate tags
data/                   destinations, experiences, hotels, cities, trips, engine modules
lib/
  ai/                   parseIntent (NL → structured brief), tripEngine (scoring, budget optimiser, itinerary), provider
  services/             destination/hotel/experience/personalization/trip services (async, API-shaped)
  scene/                seeded procedural silhouette generators and compositions
  geo/                  embedded Natural Earth land mask and sphere maths
hooks/                  media queries, WebGL detection, viewport, parallax, wheel guard
scripts/                generate-landmask.mjs (rebuilds lib/geo/landmask.ts)
```

**Future integrations plug in here:**

- **Real AI:** implement `TripPlannerProvider` in `lib/ai/provider.ts` and select it with `TRAVELVERSE_TRIP_PROVIDER`. Keys stay on the server; the client always calls `/api/v1/trips` through `tripService`, which falls back to the local engine only if the network is down.
- **Destinations, hotels, activities:** replace the bodies of `lib/services/*`. Components depend only on the types in `lib/types.ts`.
- **Flights:** `estimateTransport()` in `lib/ai/tripEngine.ts` is the single fare/duration model to swap for a flight-search API.
- **Personalisation:** `personalizationService.load/save` uses localStorage today; swap it for a profile API once authentication exists.
- **Booking:** `BookingDialog` is the hand-off point to a partner booking engine.

## Graceful degradation

- No WebGL2 (or a GPU/context failure): the 2D canvas globe and illustrated stay views take over automatically.
- Photography is optional (`Destination.image`). Scenes are procedural, so nothing can 404.
- 3D render loops pause off-screen. The hotel scene lazy-loads near the viewport. The wheel scrolls the page (pinch or ⌘/Ctrl + scroll to zoom the globe).
- `prefers-reduced-motion`: no auto-rotation, autoplay, parallax or long camera moves.

**QA hooks:** add `?webgl=off` to any URL to force the fallbacks. Include `#fail` in a planner prompt to see the engine's error state.
