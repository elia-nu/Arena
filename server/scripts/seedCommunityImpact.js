import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import CommunityImpactEntry from "../models/CommunityImpactEntry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(projectRoot, "server", ".env") });

/** WebP Unsplash covers (fm=webp) + soccer / community photography */
const webp = (photoId, w = 1400, h = 900) =>
  `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&fm=webp&q=80`;

const SEED_TITLES = [
  "Seattle Parks & Recreation Community Cup",
  "Rainier Beach Youth Mentorship Clinics",
  "Capitol Hill Open Play Sundays",
  "South Park Gear Drive & Skills Day",
  "Ballard Waterfront Street Soccer Night",
  "West Seattle Girls Kickstart Camp",
];

const ENTRIES = [
  {
    title: "Seattle Parks & Recreation Community Cup",
    description: `A collaborative summer street soccer showcase at Garfield Playfield, uniting over 120 youth and neighborhood teams for competitive play, mentorship, and community celebration.

Volunteers ran skill stations, family zones, and a closing awards circle that highlighted sportsmanship as much as goals scored.`,
    place: "Garfield Playfield, Seattle, WA",
    date: new Date("2025-08-16T17:00:00.000Z"),
    isFeatured: true,
    sponsor: {
      name: "Seattle Parks and Recreation",
      logo: webp("photo-1574629810360-7efbbe195018", 400, 400),
      website: "https://www.seattle.gov/parks",
    },
    images: [
      webp("photo-1574629810360-7efbbe195018"),
      webp("photo-1431324155629-1a6deb1dec8d"),
      webp("photo-1529900748604-07564a03e7a6"),
      webp("photo-1579952363873-27f3bade9f55"),
    ],
    videos: [
      {
        url: "https://www.youtube.com/watch?v=8uHhYlZOBr4",
        sourceType: "url",
      },
    ],
  },
  {
    title: "Rainier Beach Youth Mentorship Clinics",
    description:
      "Weekly evening clinics pairing high-school mentors with middle-school players. Sessions mix technical drills, small-sided games, and conversations about school, confidence, and teamwork.",
    place: "Rainier Beach Playfield, Seattle, WA",
    date: new Date("2025-06-12T01:00:00.000Z"),
    isFeatured: true,
    sponsor: {
      name: "Rainier Beach Community Center",
      logo: webp("photo-1489944440615-453fc71ff43a", 400, 400),
      website: "https://www.seattle.gov/parks",
    },
    images: [
      webp("photo-1489944440615-453fc71ff43a"),
      webp("photo-1560272564-c83b66b1ad12"),
      webp("photo-1606925797300-0b35e9d1793f"),
    ],
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Sp1dYzqAysM",
        sourceType: "url",
      },
      {
        url: "https://youtu.be/WXiZX8JQ0Hk",
        sourceType: "url",
      },
    ],
  },
  {
    title: "Capitol Hill Open Play Sundays",
    description:
      "Free open-play mornings for families and first-time players. No registration wall — just cones, balls, and coaches who keep the vibe welcoming for every skill level.",
    place: "Cal Anderson Park, Seattle, WA",
    date: new Date("2025-09-07T18:30:00.000Z"),
    isFeatured: false,
    sponsor: {
      name: "Capitol Hill Community Council",
      logo: webp("photo-1517649763962-0c623066013b", 400, 400),
      website: "https://www.capitolhillcommunitycouncil.org/",
    },
    images: [
      webp("photo-1517649763962-0c623066013b"),
      webp("photo-1551958219-acbc608c6377"),
      webp("photo-1517927033932-b3d18e61fb3a"),
    ],
    videos: [
      {
        url: "https://www.youtube.com/watch?v=6Dh-RL__ut8",
        sourceType: "url",
      },
    ],
  },
  {
    title: "South Park Gear Drive & Skills Day",
    description:
      "Neighbors donated cleats, shin guards, and balls so every kid could step onto the pitch ready to play. Afternoon skills circuits ended with mixed-age scrimmages and a shared meal.",
    place: "South Park Community Center, Seattle, WA",
    date: new Date("2025-04-19T19:00:00.000Z"),
    isFeatured: false,
    sponsor: {
      name: "South Park Neighborhood Association",
      logo: webp("photo-1461896836934-ffe607ba6851", 400, 400),
    },
    images: [
      webp("photo-1461896836934-ffe607ba6851"),
      webp("photo-1574629810360-7efbbe195018", 1200, 800),
      webp("photo-1431324155629-1a6deb1dec8d", 1200, 800),
    ],
    videos: [
      {
        url: "https://www.youtube.com/watch?v=oI3A1cSTqHE",
        sourceType: "url",
      },
    ],
  },
  {
    title: "Ballard Waterfront Street Soccer Night",
    description:
      "An evening of 3v3 under the lights along the Ballard waterfront — music, food trucks, and fast-paced street soccer that drew players from across Northwest Seattle.",
    place: "Ballard Commons Park, Seattle, WA",
    date: new Date("2025-07-26T02:00:00.000Z"),
    isFeatured: true,
    sponsor: {
      name: "Ballard Chamber of Commerce",
      logo: webp("photo-1529900748604-07564a03e7a6", 400, 400),
      website: "https://www.ballardchamber.com/",
    },
    images: [
      webp("photo-1529900748604-07564a03e7a6"),
      webp("photo-1579952363873-27f3bade9f55"),
      webp("photo-1551958219-acbc608c6377"),
      webp("photo-1560272564-c83b66b1ad12"),
    ],
    videos: [
      {
        url: "https://www.youtube.com/watch?v=QF2oxJvt6Z4",
        sourceType: "url",
      },
      {
        url: "https://youtu.be/lE_Eq8u4R0o",
        sourceType: "url",
      },
    ],
  },
  {
    title: "West Seattle Girls Kickstart Camp",
    description:
      "A three-day intro camp for girls ages 8–14 focused on first touch, confidence, and finding a team home. Coaches from local clubs volunteered sessions and Q&A with parents.",
    place: "Hiawatha Community Center, Seattle, WA",
    date: new Date("2025-05-03T17:00:00.000Z"),
    isFeatured: false,
    sponsor: {
      name: "West Seattle Soccer Club",
      logo: webp("photo-1606925797300-0b35e9d1793f", 400, 400),
    },
    images: [
      webp("photo-1606925797300-0b35e9d1793f"),
      webp("photo-1489944440615-453fc71ff43a"),
      webp("photo-1517927033932-b3d18e61fb3a"),
    ],
    videos: [
      {
        url: "https://www.youtube.com/watch?v=0AgNWCME1qY",
        sourceType: "url",
      },
    ],
  },
];

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI is not set");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const admin =
      (await User.findOne({ role: "admin" })) || (await User.findOne());
    if (!admin) {
      console.error(
        "No user found to assign as createdBy. Run create-admin first.",
      );
      process.exit(1);
    }

    const removed = await CommunityImpactEntry.deleteMany({
      title: { $in: SEED_TITLES },
    });
    console.log(`Removed ${removed.deletedCount} prior seeded impact entries`);

    const docs = ENTRIES.map((entry) => ({
      ...entry,
      status: "published",
      createdBy: admin._id,
    }));

    const created = await CommunityImpactEntry.insertMany(docs);
    console.log(`Created ${created.length} community impact stories`);
    created.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.title} (${doc._id})`);
    });

    console.log("\nDone. View at /community-impact");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seed();
