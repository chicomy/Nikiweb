# Palo Alto / East Palo Alto map reference

The roads, San Francisquito Creek, selected parks, Caltrain geometry and context-building locations in `dist/map-reference.js` were simplified from OpenStreetMap data downloaded on 2026-10-30. The active map covers the Palo Alto / East Palo Alto street network around Highway 101 and retains the HP Garage as a regional landmark. Stanford is temporarily omitted, and the overview has been tightened accordingly.

## Geographic basis and cartographic compression

The source local tangent plane is centered at latitude 37.4553, longitude −122.1323. Its northeast X axis uses 0.024 scene units per meter; the southeast Z axis uses 0.019 units per meter. Coordinates west of X = −35 retain the earlier cartographic compression: `x = −35 + (x + 35) × 0.55`. East-side streets and the freeway are unchanged.

The active scene is cropped to **X [−56, 40], Z [−34, 34]**, with overview center **X = −8, Z = 0**. It contains **61 road polylines and 141 context-building positions**. This is a selective miniature composition, not a navigation map. Context-building heights and footprints are illustrative, although their centers follow the source map.

Actual street geometry includes University Avenue, El Camino Real, Addison Avenue and the retained Caltrain corridor. The HP Garage anchor comes from OpenStreetMap node 1710414037 at 37.4429402, −122.1545898, corresponding to 367 Addison Avenue. Its modeled footprint is enlarged for readability.

University Avenue and Embarcadero Road crossings follow actual street/highway centerline intersections and their street tangents. The central NIKI footbridge and eleven portfolio destinations are imagined additions. Their locations, scales and architectural forms do not represent real project addresses or additional findings from Niki's paper. The Vision Pro-inspired Feel To Read sculpture is a conceptual exhibit form; it does not document the appearance or manufacturer of Niki's prototypes.

Highway 101 is **not** the municipal boundary. San Francisquito Creek separates Palo Alto from East Palo Alto in this area, and Highway 101 passes through East Palo Alto.

## Retained Stanford source

The previous map extension included Stanford's Main Quad. That distant section is removed from the active map and the Stanford GLB is not requested by the runtime. Editable source files under `models/palo-alto/` remain available for a future revision. The campus miniature combined the Main Quad, Memorial Church, Hoover Tower and Oval into a single enlarged composition; it was not a measured architectural reconstruction.

## Sources and license

- [OpenStreetMap](https://www.openstreetmap.org/#map=14/37.445/-122.150) — road, water, park, rail and building geometry.
- [OpenStreetMap copyright and ODbL](https://www.openstreetmap.org/copyright) — © OpenStreetMap contributors. Retain attribution with the map. `dist/map-reference.js` contains the simplified derived geometry.
- [HP Garage official historical reference](https://www.hp.com/hpinfo/abouthp/histnfacts/garage/brief.pdf) — address and architectural/history reference.
- [East Palo Alto Local Roadway Safety Plan](https://ccag.ca.gov/wp-content/uploads/2024/04/28717_CCAG-Countywide-LRSP-East-Palo-Alto-Chapter.pdf) — official city-roadway reference.
- [Stanford campus map](https://visit.stanford.edu/basics/campusmap.html) — reference for the retained, currently inactive campus source.

Source extraction included the original 101-area tiles and the previous Stanford/downtown extension covering longitudes −122.177…−122.145, latitudes 37.423…37.451. Complete ways returned by the OpenStreetMap API can extend beyond tile edges. The active geometry is the cropped subset described above.
