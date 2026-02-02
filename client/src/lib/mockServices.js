let __n = 0;
function id() {
  __n += 1;
  return `mock-services-${__n}`;
}

function daysAgo(n) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export const MOCK_SERVICES = [
  {
    id: id(),
    section: "automotive",
    title: "Mobile Auto Repair - Diagnostics & Brakes",
    price: "$85/hr",
    location: "bay area",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "automotive",
    title: "Car Detailing - Interior & Exterior",
    price: "$150",
    location: "san francisco",
    hasImage: true,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "beauty",
    title: "Mobile Hair Stylist - Weddings & Events",
    price: "$200+",
    location: "oakland",
    hasImage: true,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "computer",
    title: "Mac/PC Repair - Data Recovery",
    price: "$75/hr",
    location: "san jose",
    hasImage: false,
    createdAt: daysAgo(2),
  },
  {
    id: id(),
    section: "creative",
    title: "Photography - Portrait Sessions",
    price: "$300",
    location: "san francisco",
    hasImage: true,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "event",
    title: "DJ Services - Weddings & Parties",
    price: "$500+",
    location: "bay area",
    hasImage: false,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "financial",
    title: "Tax Preparation - CPA Licensed",
    price: "$200+",
    location: "remote",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "household",
    title: "House Cleaning - Move-in/Move-out",
    price: "$200",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(2),
  },
  {
    id: id(),
    section: "landscape",
    title: "Garden Design & Maintenance",
    price: "$60/hr",
    location: "oakland",
    hasImage: true,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "pet",
    title: "Dog Walking & Pet Sitting",
    price: "$25/walk",
    location: "berkeley",
    hasImage: true,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "real estate",
    title: "Property Management Services",
    price: "8% monthly",
    location: "bay area",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "therapeutic",
    title: "Mobile Massage Therapy",
    price: "$120/hr",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(2),
  },
];
