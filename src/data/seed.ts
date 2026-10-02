import { addDays, today } from '@/utils/date';
import { IMG } from './images';
import type {
  Amenity,
  Hotel,
  LocalizedText,
  PromoCode,
  PropertyType,
  RatePlan,
  Review,
  RoomType,
} from '@/domain/types';

const t = (en: string, ru: string, uz: string): LocalizedText => ({ en, ru, uz });

interface RoomSpec {
  key: string;
  name: LocalizedText;
  areaM2: number;
  bed: RoomType['bed'];
  beds: number;
  baths: number;
  maxAdults: number;
  maxChildren: number;
  inventory: number;
  price: number;
  images: string[];
}

interface HotelSpec extends Omit<Hotel, 'details' | 'roomCount'> {
  rooms: RoomSpec[];
}

const TASHKENT = t('Tashkent', 'Ташкент', 'Toshkent');
const SAMARKAND = t('Samarkand', 'Самарканд', 'Samarqand');
const BUKHARA = t('Bukhara', 'Бухара', 'Buxoro');
const CHIMGAN = t('Chimgan', 'Чимган', 'Chimyon');

const baseAmenities: Amenity[] = ['wifi', 'air_conditioning', 'parking'];

const SPECS: HotelSpec[] = [
  {
    id: 'marmaris-tashkent',
    name: 'Marmaris Hotel Tashkent',
    type: 'hotel',
    city: TASHKENT,
    district: t('Mirabad', 'Мирабад', 'Mirobod'),
    address: t('12 Amir Temur Ave, Tashkent, Uzbekistan', 'пр. Амира Темура 12, Ташкент, Узбекистан', "Amir Temur shoh ko'chasi 12, Toshkent, O'zbekiston"),
    description: t(
      'Marmaris Hotel Tashkent features 256 rooms and suites, diverse dining options, a spa, an indoor pool and a rooftop bar with views over the capital. Ten minutes from the airport and steps from Amir Temur Square, it is equally suited to business trips and city breaks.',
      'Marmaris Hotel Tashkent — 256 номеров и люксов, несколько ресторанов, спа, крытый бассейн и бар на крыше с видом на столицу. В десяти минутах от аэропорта и в шаге от сквера Амира Темура — для деловых поездок и городского отдыха.',
      "Marmaris Hotel Tashkent — 256 ta xona va lyuks, turli restoranlar, spa, yopiq basseyn va poytaxt manzarasi ochiladigan tom bar. Aeroportdan o'n daqiqa, Amir Temur xiyobonidan bir qadam — ish safarlari va shahar dam olishi uchun.",
    ),
    geo: { lat: 41.3111, lng: 69.2797 },
    distanceToCenterKm: 0.8,
    stars: 5,
    rating: 4.96,
    reviewCount: 217,
    ratingBreakdown: { communication: 5.0, cleanliness: 4.9, location: 4.9, value: 4.8 },
    images: [IMG.towerNight, IMG.room1, IMG.gym, IMG.restaurant, IMG.lobby, IMG.spa],
    photoCount: 52,
    amenities: [...baseAmenities, 'pool', 'spa', 'gym', 'restaurant', 'breakfast', 'bar', 'airport_transfer', 'conference'],
    phone: '+998712000101',
    email: 'tashkent@marmaris.uz',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    rooms: [
      { key: 'deluxe', name: t('Deluxe King', 'Делюкс King', 'Deluxe King'), areaM2: 36, bed: 'king', beds: 1, baths: 1, maxAdults: 2, maxChildren: 1, inventory: 6, price: 2_300_000, images: [IMG.room1, IMG.room2] },
      { key: 'twin', name: t('Superior Twin', 'Супериор Twin', 'Superior Twin'), areaM2: 32, bed: 'twin', beds: 2, baths: 1, maxAdults: 2, maxChildren: 1, inventory: 5, price: 2_000_000, images: [IMG.room3, IMG.room4] },
      { key: 'suite', name: t('Executive Suite', 'Представительский люкс', 'Executive lyuks'), areaM2: 150, bed: 'king', beds: 2, baths: 1, maxAdults: 4, maxChildren: 2, inventory: 2, price: 4_200_000, images: [IMG.room5, IMG.room2] },
    ],
  },
  {
    id: 'lavanda-marmaris-rakat',
    name: 'Lavanda Marmaris Rakat',
    type: 'hotel',
    city: TASHKENT,
    district: t('Rakat', 'Ракат', 'Rakat'),
    address: t('45 Bunyodkor Ave, Rakat, Tashkent', 'пр. Бунёдкор 45, Ракат, Ташкент', "Bunyodkor shoh ko'chasi 45, Rakat, Toshkent"),
    description: t(
      'A calm lavender-toned retreat in the green Rakat neighbourhood: 120 bright rooms, an all-day café, a garden terrace and a family pool. Close to Tashkent City Park and the Magic City entertainment district.',
      'Спокойный отель в лавандовых тонах в зелёном районе Ракат: 120 светлых номеров, кафе, садовая терраса и семейный бассейн. Рядом Tashkent City Park и Magic City.',
      "Yashil Rakat mahallasidagi lavanda uslubidagi osoyishta mehmonxona: 120 ta yorug' xona, kun bo'yi ishlaydigan kafe, bog' terrasasi va oilaviy basseyn. Tashkent City Park va Magic City yaqinida.",
    ),
    geo: { lat: 41.2867, lng: 69.2241 },
    distanceToCenterKm: 4.5,
    stars: 4,
    rating: 4.8,
    reviewCount: 115,
    ratingBreakdown: { communication: 4.9, cleanliness: 4.8, location: 4.6, value: 4.9 },
    images: [IMG.resortPool, IMG.room3, IMG.restaurant, IMG.resortGarden, IMG.room2],
    photoCount: 38,
    amenities: [...baseAmenities, 'pool', 'restaurant', 'breakfast', 'kids_club'],
    phone: '+998712000202',
    email: 'rakat@lavanda.uz',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    rooms: [
      { key: 'standard', name: t('Standard Double', 'Стандарт Double', 'Standart Double'), areaM2: 26, bed: 'double', beds: 1, baths: 1, maxAdults: 2, maxChildren: 1, inventory: 8, price: 1_150_000, images: [IMG.room3, IMG.room1] },
      { key: 'family', name: t('Family Room', 'Семейный номер', 'Oilaviy xona'), areaM2: 42, bed: 'queen', beds: 2, baths: 1, maxAdults: 3, maxChildren: 2, inventory: 4, price: 1_650_000, images: [IMG.room4, IMG.room5] },
    ],
  },
  {
    id: 'marmaris-samarkand',
    name: 'Marmaris Registan Samarkand',
    type: 'hotel',
    city: SAMARKAND,
    district: t('Registan', 'Регистан', 'Registon'),
    address: t('7 Registan St, Samarkand', 'ул. Регистан 7, Самарканд', "Registon ko'chasi 7, Samarqand"),
    description: t(
      'Wake up to turquoise domes: a heritage-style hotel a short walk from Registan Square, with courtyard dining, hammam and rooms decorated by local artisans.',
      'Отель в историческом стиле в нескольких минутах от площади Регистан: ресторан во дворике, хаммам и номера с работами местных мастеров.',
      "Registon maydonidan bir necha daqiqa narida tarixiy uslubdagi mehmonxona: hovli restorani, hammom va mahalliy ustalar bezagan xonalar.",
    ),
    geo: { lat: 39.6547, lng: 66.9758 },
    distanceToCenterKm: 0.4,
    stars: 4,
    rating: 4.9,
    reviewCount: 168,
    ratingBreakdown: { communication: 4.9, cleanliness: 4.9, location: 5.0, value: 4.7 },
    images: [IMG.boutique, IMG.room2, IMG.restaurant, IMG.spa],
    photoCount: 41,
    amenities: [...baseAmenities, 'spa', 'restaurant', 'breakfast', 'airport_transfer'],
    phone: '+998662000303',
    email: 'samarkand@marmaris.uz',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    rooms: [
      { key: 'classic', name: t('Classic Double', 'Классик Double', 'Klassik Double'), areaM2: 28, bed: 'double', beds: 1, baths: 1, maxAdults: 2, maxChildren: 1, inventory: 6, price: 1_400_000, images: [IMG.room2, IMG.room3] },
      { key: 'junior', name: t('Junior Suite', 'Джуниор сюит', 'Junior suite'), areaM2: 48, bed: 'king', beds: 1, baths: 1, maxAdults: 3, maxChildren: 1, inventory: 3, price: 2_250_000, images: [IMG.room5, IMG.room1] },
    ],
  },
  {
    id: 'lavanda-chimgan',
    name: 'Lavanda Chimgan Resort',
    type: 'resort',
    city: CHIMGAN,
    district: t("Bostanliq", 'Бостанлык', "Bo'stonliq"),
    address: t('Chimgan valley, Bostanliq district', 'Чимганская долина, Бостанлыкский район', "Chimyon vodiysi, Bo'stonliq tumani"),
    description: t(
      'A mountain resort 80 km from Tashkent with chalets, a heated outdoor pool, ski-in access in winter and hiking trails to Charvak lake in summer.',
      'Горный курорт в 80 км от Ташкента: шале, подогреваемый бассейн, зимой — выход на склон, летом — тропы к Чарвакскому озеру.',
      "Toshkentdan 80 km uzoqlikdagi tog' kurorti: shaleler, isitiladigan basseyn, qishda chang'i yo'li, yozda Chorvoq ko'liga piyoda yo'laklar.",
    ),
    geo: { lat: 41.5167, lng: 70.0167 },
    distanceToCenterKm: 2.1,
    stars: 5,
    rating: 4.85,
    reviewCount: 92,
    ratingBreakdown: { communication: 4.8, cleanliness: 4.9, location: 4.9, value: 4.7 },
    images: [IMG.resortGarden, IMG.room4, IMG.spa, IMG.resortBeach],
    photoCount: 29,
    amenities: [...baseAmenities, 'pool', 'spa', 'restaurant', 'breakfast', 'kids_club', 'bar'],
    phone: '+998712000404',
    email: 'chimgan@lavanda.uz',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    rooms: [
      { key: 'chalet', name: t('Mountain Chalet', 'Горное шале', "Tog' shalesi"), areaM2: 60, bed: 'king', beds: 2, baths: 2, maxAdults: 4, maxChildren: 2, inventory: 5, price: 3_100_000, images: [IMG.room4, IMG.room5] },
      { key: 'view', name: t('Valley View Room', 'Номер с видом на долину', "Vodiy manzarali xona"), areaM2: 30, bed: 'queen', beds: 1, baths: 1, maxAdults: 2, maxChildren: 1, inventory: 8, price: 1_900_000, images: [IMG.room1, IMG.room3] },
    ],
  },
  {
    id: 'marmaris-bukhara-villa',
    name: 'Marmaris Old City Villa',
    type: 'villa',
    city: BUKHARA,
    district: t('Lyabi-Hauz', 'Ляби-Хауз', 'Labi Hovuz'),
    address: t('3 Nakshbandi St, Bukhara', 'ул. Накшбанди 3, Бухара', "Naqshbandiy ko'chasi 3, Buxoro"),
    description: t(
      'A restored 19th-century merchant house with a private courtyard, three bedrooms and a rooftop overlooking Lyabi-Hauz.',
      'Отреставрированный купеческий дом XIX века: собственный дворик, три спальни и терраса на крыше с видом на Ляби-Хауз.',
      "XIX asrga oid tiklangan savdogar uyi: shaxsiy hovli, uchta yotoqxona va Labi Hovuzga qaragan tom terrasasi.",
    ),
    geo: { lat: 39.7747, lng: 64.4286 },
    distanceToCenterKm: 0.3,
    stars: 5,
    rating: 4.92,
    reviewCount: 54,
    ratingBreakdown: { communication: 5.0, cleanliness: 4.9, location: 5.0, value: 4.8 },
    images: [IMG.villa, IMG.room5, IMG.restaurant],
    photoCount: 22,
    amenities: [...baseAmenities, 'breakfast', 'airport_transfer'],
    phone: '+998652000505',
    email: 'bukhara@marmaris.uz',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    rooms: [
      { key: 'villa', name: t('Entire villa · 3 bedrooms', 'Вилла целиком · 3 спальни', "Butun villa · 3 yotoqxona"), areaM2: 180, bed: 'king', beds: 3, baths: 2, maxAdults: 6, maxChildren: 3, inventory: 1, price: 5_500_000, images: [IMG.villa, IMG.room5] },
    ],
  },
  {
    id: 'marmaris-residences',
    name: 'Marmaris Residences Tashkent City',
    type: 'apartment',
    city: TASHKENT,
    district: t('Tashkent City', 'Ташкент Сити', 'Tashkent City'),
    address: t('1 Islam Karimov St, Tashkent City', 'ул. Ислама Каримова 1, Ташкент Сити', "Islom Karimov ko'chasi 1, Tashkent City"),
    description: t(
      'Serviced apartments with kitchens and city views, hotel-style housekeeping and access to the Marmaris spa.',
      'Сервисные апартаменты с кухней и видом на город, гостиничная уборка и доступ в спа Marmaris.',
      "Oshxonali va shahar manzarali servis apartamentlar, mehmonxona darajasidagi tozalash va Marmaris spa'siga kirish.",
    ),
    geo: { lat: 41.3168, lng: 69.2486 },
    distanceToCenterKm: 1.9,
    stars: 4,
    rating: 4.7,
    reviewCount: 63,
    ratingBreakdown: { communication: 4.7, cleanliness: 4.8, location: 4.8, value: 4.5 },
    images: [IMG.apartment, IMG.room4, IMG.towerDusk],
    photoCount: 18,
    amenities: [...baseAmenities, 'gym', 'spa'],
    phone: '+998712000606',
    email: 'residences@marmaris.uz',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    rooms: [
      { key: 'studio', name: t('City Studio', 'Студия City', 'City studiya'), areaM2: 40, bed: 'queen', beds: 1, baths: 1, maxAdults: 2, maxChildren: 1, inventory: 6, price: 1_350_000, images: [IMG.apartment, IMG.room4] },
      { key: 'two', name: t('Two-bedroom Apartment', 'Апартаменты с 2 спальнями', "Ikki xonali apartament"), areaM2: 85, bed: 'queen', beds: 2, baths: 2, maxAdults: 4, maxChildren: 2, inventory: 3, price: 2_400_000, images: [IMG.room5, IMG.room2] },
    ],
  },
  {
    id: 'lavanda-hostel',
    name: 'Lavanda Social Hostel',
    type: 'hostel',
    city: TASHKENT,
    district: t('Chorsu', 'Чорсу', 'Chorsu'),
    address: t('18 Navoi St, Tashkent', 'ул. Навои 18, Ташкент', "Navoiy ko'chasi 18, Toshkent"),
    description: t(
      'Design hostel by the Chorsu bazaar with pod beds, private doubles, a shared kitchen and nightly plov evenings.',
      'Дизайн-хостел у базара Чорсу: капсулы, приватные двухместные номера, общая кухня и вечера плова.',
      "Chorsu bozori yonidagi dizayn-hostel: kapsula yotoqlar, ikki kishilik xonalar, umumiy oshxona va kechki palov.",
    ),
    geo: { lat: 41.3262, lng: 69.2347 },
    distanceToCenterKm: 2.6,
    stars: 2,
    rating: 4.6,
    reviewCount: 241,
    ratingBreakdown: { communication: 4.8, cleanliness: 4.5, location: 4.8, value: 4.9 },
    images: [IMG.hostel, IMG.room3, IMG.bar],
    photoCount: 15,
    amenities: ['wifi', 'air_conditioning', 'bar'],
    phone: '+998712000707',
    email: 'hostel@lavanda.uz',
    checkInTime: '13:00',
    checkOutTime: '11:00',
    rooms: [
      { key: 'pod', name: t('Pod in 6-bed dorm', 'Капсула в 6-местном', "6 o'rinli xonada kapsula"), areaM2: 4, bed: 'bunk', beds: 1, baths: 1, maxAdults: 1, maxChildren: 0, inventory: 24, price: 180_000, images: [IMG.hostel] },
      { key: 'private', name: t('Private Double', 'Приватный Double', 'Shaxsiy Double'), areaM2: 16, bed: 'double', beds: 1, baths: 1, maxAdults: 2, maxChildren: 0, inventory: 6, price: 520_000, images: [IMG.room3] },
    ],
  },
  {
    id: 'charvak-camp',
    name: 'Marmaris Charvak Camp',
    type: 'camper',
    city: CHIMGAN,
    district: t('Charvak lake', 'Чарвакское водохранилище', "Chorvoq ko'li"),
    address: t('North shore, Charvak lake', 'Северный берег Чарвака', "Chorvoq ko'lining shimoliy sohili"),
    description: t(
      'Lakeside glamping and camper pitches with electricity, hot showers, a BBQ terrace and kayak rental.',
      'Глэмпинг и места для кемперов на берегу: электричество, горячий душ, барбекю-терраса и прокат каяков.',
      "Ko'l bo'yidagi glamping va kemper joylari: elektr, issiq dush, barbekyu terrasasi va kayak ijarasi.",
    ),
    geo: { lat: 41.6417, lng: 70.0167 },
    distanceToCenterKm: 6.2,
    stars: 3,
    rating: 4.75,
    reviewCount: 47,
    ratingBreakdown: { communication: 4.8, cleanliness: 4.6, location: 5.0, value: 4.7 },
    images: [IMG.camper, IMG.resortBeach],
    photoCount: 12,
    amenities: ['wifi', 'parking', 'restaurant'],
    phone: '+998712000808',
    email: 'charvak@marmaris.uz',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    rooms: [
      { key: 'tent', name: t('Glamping Tent', 'Глэмпинг-шатёр', 'Glamping chodiri'), areaM2: 20, bed: 'queen', beds: 1, baths: 1, maxAdults: 2, maxChildren: 2, inventory: 10, price: 750_000, images: [IMG.camper] },
    ],
  },
];

function buildRates(hotelId: string, room: RoomSpec): RatePlan[] {
  const rid = `${hotelId}:${room.key}`;
  const year = new Date().getFullYear();
  const seasonal = [
    // High season: spring and autumn in Uzbekistan
    { from: `${year}-04-01`, to: `${year}-05-31`, price: Math.round(room.price * 1.15) },
    { from: `${year}-09-01`, to: `${year}-10-31`, price: Math.round(room.price * 1.1) },
    { from: `${year}-12-28`, to: `${year + 1}-01-05`, price: Math.round(room.price * 1.3) },
  ];
  const weekend = { 5: 1.08, 6: 1.08 } as const;
  return [
    {
      id: `${rid}:flex`,
      roomTypeId: rid,
      name: t('Flexible · Breakfast included', 'Гибкий · С завтраком', "Moslashuvchan · Nonushta bilan"),
      basePrice: room.price,
      seasonal,
      weekdayMultipliers: weekend,
      minNights: 1,
      breakfastIncluded: true,
      cancellation: { kind: 'free', freeUntilDaysBefore: 2, penaltyNights: 1 },
      paymentModes: ['full', 'partial', 'at_hotel'],
      depositPercent: 0.3,
    },
    {
      id: `${rid}:saver`,
      roomTypeId: rid,
      name: t('Saver · Non-refundable', 'Эконом · Без возврата', "Tejamkor · Qaytarilmaydi"),
      basePrice: Math.round(room.price * 0.88),
      seasonal: seasonal.map((s) => ({ ...s, price: Math.round(s.price * 0.88) })),
      weekdayMultipliers: weekend,
      minNights: 2,
      breakfastIncluded: false,
      cancellation: { kind: 'non_refundable' },
      paymentModes: ['full'],
      depositPercent: 1,
    },
  ];
}

export const HOTELS: Hotel[] = SPECS.map(({ rooms, ...h }) => {
  const biggest = [...rooms].sort((a, b) => b.areaM2 - a.areaM2)[0];
  return {
    ...h,
    details: { areaM2: biggest.areaM2, guests: biggest.maxAdults, baths: biggest.baths, beds: biggest.beds },
    roomCount: rooms.reduce((s, r) => s + r.inventory, 0),
  };
});

export const ROOM_TYPES: RoomType[] = SPECS.flatMap((h) =>
  h.rooms.map((r, i, arr) => ({
    id: `${h.id}:${r.key}`,
    hotelId: h.id,
    name: r.name,
    areaM2: r.areaM2,
    bed: r.bed,
    beds: r.beds,
    baths: r.baths,
    maxAdults: r.maxAdults,
    maxChildren: r.maxChildren,
    amenities: h.amenities.filter((a) => ['wifi', 'air_conditioning'].includes(a)),
    images: r.images,
    inventory: r.inventory,
    upgradeToId: arr[i + 1] ? `${h.id}:${arr[i + 1].key}` : undefined,
  })),
);

export const RATE_PLANS: RatePlan[] = SPECS.flatMap((h) => h.rooms.flatMap((r) => buildRates(h.id, r)));

export const PROMO_CODES: PromoCode[] = [
  { code: 'WELCOME10', kind: 'percent', value: 10, validFrom: '2026-01-01', validTo: '2027-12-31', used: 0 },
  { code: 'MARMARIS15', kind: 'percent', value: 15, validFrom: '2026-01-01', validTo: '2027-12-31', minNights: 3, hotelIds: ['marmaris-tashkent', 'marmaris-samarkand', 'marmaris-bukhara-villa'], used: 0 },
  { code: 'LAVANDA200', kind: 'fixed', value: 200_000, validFrom: '2026-01-01', validTo: '2027-12-31', hotelIds: ['lavanda-marmaris-rakat', 'lavanda-chimgan', 'lavanda-hostel'], used: 0 },
  { code: 'SUMMER25', kind: 'percent', value: 25, validFrom: '2025-06-01', validTo: '2025-08-31', used: 0 },
];

export const DESTINATIONS = [
  { id: 'tashkent', name: TASHKENT, image: IMG.tashkent },
  { id: 'samarkand', name: SAMARKAND, image: IMG.samarkand },
  { id: 'bukhara', name: BUKHARA, image: IMG.bukhara },
  { id: 'chimgan', name: CHIMGAN, image: IMG.mountains },
];

const AUTHORS = ['Dilnoza R.', 'Aziz K.', 'Elena M.', 'Jamshid T.', 'Sophie L.', 'Bekzod A.', 'Malika S.', 'Daniel W.'];
const TEXTS = [
  'Spotless room, very friendly reception and a great breakfast. Will definitely come back.',
  'Excellent location, quiet at night. The staff upgraded our room as Gold members!',
  'Beautiful property and the spa was wonderful. Check-in was quick.',
  'Good value for money, the late checkout made our trip so much easier.',
];

export const REVIEWS: Review[] = HOTELS.flatMap((h, hi) =>
  [0, 1, 2].map((i) => ({
    id: `rev-${h.id}-${i}`,
    hotelId: h.id,
    author: AUTHORS[(hi + i) % AUTHORS.length],
    rating: i === 2 ? 4 : 5,
    text: TEXTS[(hi + i) % TEXTS.length],
    createdAt: addDays(today(), -(i * 17 + hi * 3 + 4)),
  })),
);

export const PROPERTY_TYPES: PropertyType[] = ['hotel', 'camper', 'hostel', 'villa', 'resort', 'apartment'];
