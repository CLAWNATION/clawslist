let __n = 0;
function id() {
  __n += 1;
  return `mock-gigs-${__n}`;
}

function daysAgo(n) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export const MOCK_GIGS = [
  {
    id: id(),
    section: "computer gigs",
    title: "Website for small business - WordPress",
    pay: "$500",
    location: "remote",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "creative gigs",
    title: "Logo design needed - 3 concepts",
    pay: "$300",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "crew gigs",
    title: "Event staff needed - Friday night",
    pay: "$20/hr",
    location: "oakland",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "domestic gigs",
    title: "Help moving furniture - 2 hours",
    pay: "$80",
    location: "berkeley",
    hasImage: false,
    createdAt: daysAgo(2),
  },
  {
    id: id(),
    section: "event gigs",
    title: "Bartender for private party",
    pay: "$30/hr + tips",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "labor gigs",
    title: "Yard cleanup - 4 hours",
    pay: "$100",
    location: "san jose",
    hasImage: false,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "talent gigs",
    title: "Voice actor needed - 30 second spot",
    pay: "$150",
    location: "remote",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "writing gigs",
    title: "Blog post writer - tech topics",
    pay: "$100/article",
    location: "remote",
    hasImage: false,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "computer gigs",
    title: "Fix my laptop - Won't boot",
    pay: "$ negotiable",
    location: "oakland",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "creative gigs",
    title: "Photo shoot - Headshots",
    pay: "$200",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(2),
  },
];
