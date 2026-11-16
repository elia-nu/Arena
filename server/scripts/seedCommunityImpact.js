import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import CommunityImpactEntry from "../models/CommunityImpactEntry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const webp = (photoId, w = 1400, h = 900) =>
  `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&fm=webp&q=80`;

const SEED_TITLES = [
  "Addis Ababa Youth Community Cup",
  "Hawassa Lakefront Youth Mentorship Clinics",
  "Bole Open Play Sundays",
  "Jan Meda Gear Drive & Skills Day",
  "Hawassa Lake Street Soccer Night",
  "Sheger Girls Kickstart Football Camp",
  // Legacy titles for clean deletion
  "Seattle Parks & Recreation Community Cup",
  "Rainier Beach Youth Mentorship Clinics",
  "Capitol Hill Open Play Sundays",
  "South Park Gear Drive & Skills Day",
  "Ballard Waterfront Street Soccer Night",
  "West Seattle Girls Kickstart Camp",
];

const ENTRIES = [
  {
    title: "Addis Ababa Youth Community Cup",
    description: `A collaborative street soccer showcase at Jan Meda Sports Ground, uniting over 120 youth and neighborhood teams for competitive play, mentorship, and community celebration.

Volunteers ran skill stations, family zones, and a closing awards circle that highlighted sportsmanship as much as goals scored.`,
    place: "Jan Meda Sports Ground, Addis Ababa, Ethiopia",
    date: new Date("2025-08-16T17:00:00.000Z"),
    isFeatured: true,
    sponsor: {
      name: "Addis Ababa Youth Sports Commission",
      logo: webp("photo-1574629810360-7efbbe195018", 400, 400),
      website: "https://arenaia.com",
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
    title: "Hawassa Lakefront Youth Mentorship Clinics",
    description:
      "Weekly evening clinics pairing senior players with grassroots youth in Hawassa. Sessions mix technical street soccer drills, small-sided cage matches, and mentorship conversations about confidence, school, and sportsmanship.",
    place: "Lakefront Promenade, Hawassa, Ethiopia",
    date: new Date("2025-06-12T01:00:00.000Z"),
    isFeatured: true,
    sponsor: {
      name: "Hawassa City Youth & Sports Bureau",
      logo: webp("photo-1489944440615-453fc71ff43a", 400, 400),
      website: "https://arenaia.com",
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
    title: "Bole Open Play Sundays",
    description:
      "Free open-play mornings for families and first-time players in Bole. No registration barriers — just cones, balls, and coaches who keep the vibe welcoming for every skill level.",
    place: "Bole Medhanialem Community Pitch, Addis Ababa, Ethiopia",
    date: new Date("2025-09-07T18:30:00.000Z"),
    isFeatured: false,
    sponsor: {
      name: "Bole Community Sports Council",
      logo: webp("photo-1517649763962-0c623066013b", 400, 400),
      website: "https://arenaia.com",
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
    title: "Jan Meda Gear Drive & Skills Day",
    description:
      "Community members donated boots, shin guards, and footballs so every young player could step onto the pitch fully equipped. Afternoon technical skill circuits finished with mixed-age matches.",
    place: "Jan Meda Youth Center, Addis Ababa, Ethiopia",
    date: new Date("2025-04-19T19:00:00.000Z"),
    isFeatured: false,
    sponsor: {
      name: "Addis Grassroots Football Alliance",
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
    title: "Hawassa Lake Street Soccer Night",
    description:
      "An electric evening of 3v3 under floodlights along the Hawassa lakefront — music, food, and high-intensity street football that brought players from across the region.",
    place: "Hawassa Waterfront Pitch, Hawassa, Ethiopia",
    date: new Date("2025-07-26T02:00:00.000Z"),
    isFeatured: true,
    sponsor: {
      name: "Hawassa Youth Community Club",
      logo: webp("photo-1529900748604-07564a03e7a6", 400, 400),
      website: "https://arenaia.com",
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
    title: "Sheger Girls Kickstart Football Camp",
    description:
      "A three-day development camp for young female athletes focused on first touch, game awareness, agility, and team building. Local certified coaches led inspiring skill clinics.",
    place: "Abebe Bikila Stadium Field, Addis Ababa, Ethiopia",
    date: new Date("2025-05-03T17:00:00.000Z"),
    isFeatured: false,
    sponsor: {
      name: "Sheger Youth Athletics Initiative",
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
