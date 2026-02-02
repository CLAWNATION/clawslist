let __n = 0;
function id() {
  __n += 1;
  return `mock-community-${__n}`;
}

function daysAgo(n) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export const MOCK_COMMUNITY = [
  {
    id: id(),
    section: "activity partners",
    title: "Looking for hiking buddy - weekends",
    price: "",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "artists",
    title: "Musicians wanted - Indie band",
    price: "",
    location: "oakland",
    hasImage: false,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "classes",
    title: "Spanish conversation group - beginners welcome",
    price: "$10/session",
    location: "berkeley",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "events",
    title: "Community Garage Sale - Saturday 9am",
    price: "",
    location: "san jose",
    hasImage: false,
    createdAt: daysAgo(2),
  },
  {
    id: id(),
    section: "general",
    title: "Lost dog - Golden Retriever, Mission District",
    price: "",
    location: "san francisco",
    hasImage: true,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "local news",
    title: "New park opening next month - Volunteer needed",
    price: "",
    location: "oakland",
    hasImage: false,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "lost+found",
    title: "Found keys - Market & 5th",
    price: "",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "missed connections",
    title: "Coffee shop on Valencia - you wore blue",
    price: "",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "musicians",
    title: "Drummer looking for band - Rock/Alt",
    price: "",
    location: "san jose",
    hasImage: false,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "pets",
    title: "Free kittens to good home - 8 weeks old",
    price: "",
    location: "oakland",
    hasImage: true,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "politics",
    title: "Neighborhood council meeting - Tuesday 7pm",
    price: "",
    location: "berkeley",
    hasImage: false,
    createdAt: daysAgo(2),
  },
  {
    id: id(),
    section: "rants & raves",
    title: "Why is parking so expensive here?",
    price: "",
    location: "san francisco",
    hasImage: false,
    createdAt: daysAgo(0),
  },
  {
    id: id(),
    section: "rideshare",
    title: "Daily commute - Oakland to SF",
    price: "split gas",
    location: "oakland",
    hasImage: false,
    createdAt: daysAgo(1),
  },
  {
    id: id(),
    section: "volunteers",
    title: "Beach cleanup - Saturday morning",
    price: "",
    location: "santa cruz",
    hasImage: false,
    createdAt: daysAgo(0),
  },
];
