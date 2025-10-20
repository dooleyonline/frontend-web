import type { FeatureCollection, Point } from 'geojson';

export const ACCESSIBLE_PLACES: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'clairmont-acc-1',
      properties: {
        name: 'Clairmont Car-Accessible Meetup Spot 1',
        desc: 'Parking lot behind CRC Building E',
        zone: 'clairmont',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.30881142131085, 33.79884219086054],
      },
    },
    {
      type: 'Feature',
      id: 'clairmont-acc-2',
      properties: {
        name: 'Clairmont Car-Accessible Meetup Spot 2',
        desc: 'In front of the roadside entrance of CRC Building F',
        zone: 'clairmont',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.31020691018544, 33.7979767795683],
      },
    },
    {
      type: 'Feature',
      id: 'clairmont-acc-3',
      properties: {
        name: 'Clairmont Car-Accessible Meetup Spot 3',
        desc: 'Rotary between the tower and CRC',
        zone: 'clairmont',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.30999862826411, 33.797189247688124],
      },
    },
    {
      type: 'Feature',
      id: 'clairmont-acc-4',
      properties: {
        name: 'Clairmont Car-Accessible Meetup Spot 4',
        desc: 'In front of the URC and SAAC',
        zone: 'clairmont',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.30871769444543, 33.79624593073342],
      },
    },
    {
      type: 'Feature',
      id: 'hospital-acc-1',
      properties: {
        name: 'Hospital Car-Accessible Meetup Spot 1',
        desc: 'Parking lot in front of Health Sciences Research Building',
        zone: 'hospital',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.31712845408, 33.79473887238551],
      },
    },
    {
      type: 'Feature',
      id: 'hospital-acc-2',
      properties: {
        name: 'Hospital Car-Accessible Meetup Spot 2',
        desc: 'In front of Health Science Research Building',
        zone: 'hospital',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.31727643011028, 33.794246977606235],
      },
    },
    {
      type: 'Feature',
      id: 'hospital-acc-3',
      properties: {
        name: 'Hospital Car-Accessible Meetup Spot 3',
        desc: 'In front of Lowergate East Parking Deck',
        zone: 'hospital',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.31867398151014, 33.79140486353951],
      },
    },
    {
      type: 'Feature',
      id: 'hospital-acc-4',
      properties: {
        name: 'Hospital Car-Accessible Meetup Spot 4',
        desc: 'Between Lowergate West Parking Deck and Gambrell Parking Deck',
        zone: 'hospital',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.31951251235031, 33.790489354782665],
      },
    },
    {
      type: 'Feature',
      id: 'woodruff-acc-1',
      properties: {
        name: 'Woodruff Car-Accessible Meetup Spot 1',
        desc: 'In front of Clifton 1599 building',
        zone: 'woodruff',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.3244891901941, 33.80011580357666],
      },
    },
    {
      type: 'Feature',
      id: 'woodruff-acc-2',
      properties: {
        name: 'Woodruff Car-Accessible Meetup Spot 2',
        desc: 'Woodruff Residental Center Parking Lot',
        zone: 'woodruff',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32119159578349, 33.797760640798415],
      },
    },
    {
      type: 'Feature',
      id: 'woodruff-acc-3',
      properties: {
        name: 'Woodruff Car-Accessible Meetup Spot 3',
        desc: 'Near Michael Street Parking Deck; Bus Station',
        zone: 'woodruff',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.324193973687, 33.797029869153604],
      },
    },
    {
      type: 'Feature',
      id: 'woodruff-acc-4',
      properties: {
        name: 'Woodruff Car-Accessible Meetup Spot 4',
        desc: 'Parking lot next to Emory Point leasing office',
        zone: 'woodruff',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32856184209717, 33.80219870740248],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-1',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 1',
        desc: 'Parking lot in front of Chappenll Park',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32754848836605, 33.795714533459986],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-2',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 2',
        desc: 'Parking lot behind Kappa Kappa Gamma',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32726590964536, 33.79535911391244],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-3',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 3',
        desc: 'In front of Kappa Kappa Gamma',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32701262267727, 33.79502790567709],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-4',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 4',
        desc: 'Between Raoul Hall and Few Hall',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.3248398020078, 33.794868148949746],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-5',
      properties: {
        name: "Main Car-Accessible Meetup Spot 5",
        desc: "Eagle Hall Parking Deck Entrance; in front of Kaldi's",
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32312882597523, 33.7950186059841],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-6',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 6',
        desc: 'In front of Eagle Hall',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32256282031362, 33.79457461632951],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-7',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 7',
        desc: 'Behind WoodPEC',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32681542757562, 33.79374267468417],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-8',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 8',
        desc: 'Means Drive rotary in front of Mary Gray Munroe Theater',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32229004985523, 33.79390109764442],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-9',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 9',
        desc: 'In front of Peavine South Parking Deck',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32751087871198, 33.79307375595097],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-10',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 10',
        desc: 'In front of Peavine Visitor Parking Lot',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.3265983061022, 33.79196536658596],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-11',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 11',
        desc: 'Bus stop opposite side of Chemistry building',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32561143231773, 33.79322411048858],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-12',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 12',
        desc: 'In front of Atwood Chemistry Center',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32497092567731, 33.792595594045915],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-13',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 13',
        desc: 'Atwood Chemistry Center Loading Dock',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32446473897528, 33.792423769229194],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-14',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 14',
        desc: 'Between Atwood Chemistry Center and White Hall',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32390775343154, 33.792632978642665],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-15',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 15',
        desc: 'Peavine Creek Drive roundabout near White Hall',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32305440652088, 33.79274379533236],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-16',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 16',
        desc: 'In front of Anthropology Building',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32275387520615, 33.79280510707129],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-17',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 17',
        desc: 'Sankey Drive rotary near Admissions',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32131177234974, 33.79249324459644],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-18',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 18',
        desc: 'Parking lot near Alabama Hall',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32083827462676, 33.79239055343858],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-19',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 19',
        desc: 'In front of Convocation Hall',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.32173919455639, 33.79144593740702],
      },
    },
    {
      type: 'Feature',
      id: 'main-acc-20',
      properties: {
        name: 'Main Car-Accessible Meetup Spot 20',
        desc: 'Parking lot by Alumni Memorial University Center',
        zone: 'main',
      },
      geometry: {
        type: 'Point',
        coordinates: [-84.3235759360892, 33.790472117662576],
      },
    },
  ],
};