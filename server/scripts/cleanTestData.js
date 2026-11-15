import mongoose from "mongoose";
import dotenv from "dotenv";
import Testimonial from "../models/Testimonial.js";
import Media from "../models/Media.js";
import Tournament from "../models/Tournament.js";
import CommunityImpactEntry from "../models/CommunityImpactEntry.js";
import User from "../models/User.js";

dotenv.config();

const cleanTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Remove mock testimonials
    const deletedTestimonials = await Testimonial.deleteMany({
      $or: [
        { name: /test/i },
        { quote: /test|hlhkjh|j;jklljk/i },
        { role: /test/i },
      ],
    });
    console.log(`Deleted ${deletedTestimonials.deletedCount} test testimonials.`);

    // 2. Remove test media / gallery items
    const deletedMedia = await Media.deleteMany({
      $or: [
        { title: /test|JFHDLKSA|lakjfldf/i },
        { description: /test|JFHDLKSA|lakjfldf/i },
      ],
    });
    console.log(`Deleted ${deletedMedia.deletedCount} test gallery items.`);

    // 3. Remove test tournaments
    const deletedTournaments = await Tournament.deleteMany({
      name: /^test/i,
    });
    console.log(`Deleted ${deletedTournaments.deletedCount} test tournaments.`);

    // 4. Correct Community Impact entry for Ethiopia
    const sprUpdate = await CommunityImpactEntry.updateMany(
      {
        $or: [
          { title: /seattle parks/i },
          { "sponsor.name": /seattle parks/i },
          { place: /seattle/i },
        ],
      },
      {
        $set: {
          title: "Addis Ababa Youth Community Cup",
          place: "Jan Meda Sports Ground, Addis Ababa, Ethiopia",
          "sponsor.name": "Addis Ababa Youth Sports Commission",
          date: new Date("2025-08-16T10:00:00.000Z"),
          description:
            "A collaborative street soccer showcase hosted at Jan Meda Sports Ground, uniting over 120 youth and neighborhood teams for competitive play and community celebration.",
        },
      }
    );
    console.log(`Updated ${sprUpdate.modifiedCount} impact entries to Ethiopian locations.`);

    // 5. Seed real partner & family testimonials if needed
    const remainingCount = await Testimonial.countDocuments({ status: "published" });
    if (remainingCount < 2) {
      const admin = (await User.findOne({ role: "admin" })) || (await User.findOne());
      const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

      await Testimonial.create([
        {
          name: "Dawit Tadesse",
          role: "Youth Coach & Parent · Addis Ababa",
          quote:
            "The Arena brings the Ethiopian street soccer community together like no other organization. The tournaments provide real competition in a positive, empowering environment for our players.",
          rating: 5,
          status: "published",
          displayOrder: 1,
          createdBy: adminId,
        },
        {
          name: "Hawassa Youth Sports Association",
          role: "Community Partner · Hawassa",
          quote:
            "Partnering with The Arena brought extraordinary energy, street soccer culture, and community engagement to public pitches in Hawassa throughout the season.",
          rating: 5,
          status: "published",
          displayOrder: 2,
          createdBy: adminId,
        },
      ]);
      console.log("Seeded 2 real testimonials.");
    }

    console.log("\n✅ Test content clean-up complete!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
};

cleanTestData();
