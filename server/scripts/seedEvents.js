import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(projectRoot, "server", ".env") });

const DEFAULT_PASSWORD = "player123";

const TEAM_NAMES = [
  "Arada Ballers",
  "Bole Strikers",
  "Jan Meda FC",
  "Sheger United",
  "Hawassa Waves",
  "Piazza Playmakers",
  "Kazanchis Kings",
  "Kirkos Force",
  "Yeka Lions",
  "Bishoftu Eagles",
  "Gullele United",
  "Lideta Stars",
];

const LEGACY_TEAM_NAMES = [
  "Rain City FC",
  "Emerald Strikers",
  "Sound Wave United",
  "Cascade Kickers",
  "Pike Place Predators",
  "Ballard Blazers",
  "Capitol Hill Crew",
  "Fremont Force",
  "Queen Anne Quake",
  "SoDo Storm",
  "U-District United",
  "West Seattle Wolves",
];

const FIRST_NAMES = [
  "Dawit",
  "Abel",
  "Bereket",
  "Eyob",
  "Henok",
  "Kibrom",
  "Natnael",
  "Robel",
  "Samuel",
  "Yared",
  "Ermias",
  "Fitsum",
  "Binyam",
  "Kirubel",
  "Nahom",
  "Surafel",
  "Yohannes",
  "Desta",
  "Alazar",
  "Meron",
  "Selam",
  "Betelhem",
  "Eden",
  "Hana",
  "Rahel",
  "Tsion",
  "Liya",
  "Mahlet",
  "Helen",
  "Tigist",
  "Mulugeta",
  "Tewodros",
  "Amanuel",
  "Girma",
  "Kidus",
  "Brook",
  "Daniel",
  "Elias",
  "Solomon",
  "Nebiyu",
  "Yonas",
  "Tamrat",
  "Temesgen",
  "Anteneh",
  "Mikiyas",
  "Natan",
];

const LAST_NAMES = [
  "Tadesse",
  "Bekele",
  "Haile",
  "Kebede",
  "Alemu",
  "Desta",
  "Worku",
  "Mengistu",
  "Tesfaye",
  "Assefa",
  "Negash",
  "Girma",
  "Kassaye",
  "Wolde",
  "Fekadu",
  "Gebre",
  "Mamo",
  "Demisse",
  "Tefera",
  "Abraham",
  "Berhanu",
  "Zewde",
  "Melaku",
  "Shiferaw",
  "Habte",
  "Abebe",
  "Bogale",
  "Wondimu",
  "Getachew",
  "Beyene",
  "Ayele",
  "Ayana",
  "Tilahun",
  "Hailu",
  "Lemma",
  "Bulti",
  "Derese",
  "Regassa",
];

const EVENT_DEFS = [
  {
    name: "Addis Ababa Street Cup 2026",
    description:
      "Open street soccer tournament bringing neighborhood teams together for knockout competition across Addis Ababa. Hosted at historic Jan Meda Sports Ground with live music, local food, and community celebration.",
    location: "Addis Ababa, Ethiopia",
    venue: "Jan Meda Sports Ground",
    format: "knockout",
    status: "open",
    isPromoted: true,
    entryFee: 150,
    prizePool: 2500,
    startOffsetDays: 21,
    durationDays: 2,
    regDeadlineOffsetDays: 14,
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=800&fit=crop&fm=webp&q=80",
  },
  {
    name: "Hawassa Lakeview Invitational",
    description:
      "Invite-only group-stage event for premier street clubs, featuring round-robin pools and a final championship day along the beautiful shores of Lake Hawassa.",
    location: "Hawassa, Ethiopia",
    venue: "Hawassa Stadium & Lakefront",
    format: "group-stage",
    status: "open",
    isPromoted: true,
    entryFee: 200,
    prizePool: 3500,
    startOffsetDays: 45,
    durationDays: 3,
    regDeadlineOffsetDays: 30,
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&h=800&fit=crop&fm=webp&q=80",
  },
  {
    name: "Sheger Kickoff Classic",
    description:
      "Season-opening mixed-format tournament for grassroots talent and established neighborhood squads at Abebe Bikila Stadium.",
    location: "Addis Ababa, Ethiopia",
    venue: "Abebe Bikila Stadium",
    format: "mixed",
    status: "in_progress",
    isPromoted: false,
    entryFee: 100,
    prizePool: 1500,
    startOffsetDays: -3,
    durationDays: 4,
    regDeadlineOffsetDays: -10,
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&h=800&fit=crop&fm=webp&q=80",
  },
];

/** Team sizes that sum to 46 across 12 teams: 10×4 + 2×3 */
const TEAM_SIZES = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const buildPlayerDocs = () => {
  const players = [];
  for (let i = 0; i < 46; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const n = String(i + 1).padStart(2, "0");
    players.push({
      username: `player${n}`,
      email: `player${n}@seed.arenaia.com`,
      password: DEFAULT_PASSWORD,
      firstName,
      lastName,
      role: "player",
      isActive: true,
      dob: new Date(1995 + (i % 10), i % 12, (i % 28) + 1),
    });
  }
  return players;
};

const seed = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const admin =
      (await User.findOne({ role: "admin" })) || (await User.findOne());
    if (!admin) {
      throw new Error(
        "No admin (or any) user found. Run `npm run create-admin` first."
      );
    }
    console.log(`Using createdBy: ${admin.username} (${admin._id})`);

    // Remove prior seed data (tagged by email domain / team names / event names)
    const seedEmails = { email: /@seed\.(arenaia|leskickit)\.com$/i };
    const seedUsers = await User.find(seedEmails).select("_id");
    const seedUserIds = seedUsers.map((u) => u._id);

    const seedTeams = await Team.find({
      $or: [
        { name: { $in: [...TEAM_NAMES, ...LEGACY_TEAM_NAMES] } },
        { leader: { $in: seedUserIds } },
      ],
    }).select("_id");
    const seedTeamIds = seedTeams.map((t) => t._id);

    const seedEvents = await Tournament.find({
      name: { $in: EVENT_DEFS.map((e) => e.name) },
    }).select("_id");
    const seedEventIds = seedEvents.map((e) => e._id);

    if (seedEventIds.length) {
      const deletedMatches = await Match.deleteMany({
        tournament: { $in: seedEventIds },
      });
      console.log(`Removed ${deletedMatches.deletedCount} seeded matches`);
      const deletedEvents = await Tournament.deleteMany({
        _id: { $in: seedEventIds },
      });
      console.log(`Removed ${deletedEvents.deletedCount} seeded events`);
    }

    if (seedTeamIds.length) {
      const deletedTeams = await Team.deleteMany({ _id: { $in: seedTeamIds } });
      console.log(`Removed ${deletedTeams.deletedCount} seeded teams`);
    }

    if (seedUserIds.length) {
      const deletedUsers = await User.deleteMany({ _id: { $in: seedUserIds } });
      console.log(`Removed ${deletedUsers.deletedCount} seeded players`);
    }

    // Create players
    const playerDocs = buildPlayerDocs();
    const players = [];
    for (const doc of playerDocs) {
      const user = new User(doc);
      await user.save();
      players.push(user);
    }
    console.log(`Created ${players.length} players`);

    // Create teams and assign members
    let playerIndex = 0;
    const teams = [];
    for (let i = 0; i < TEAM_NAMES.length; i++) {
      const size = TEAM_SIZES[i];
      const members = players.slice(playerIndex, playerIndex + size);
      playerIndex += size;

      const leader = members[0];
      leader.role = "team_leader";
      await leader.save();

      const team = new Team({
        name: TEAM_NAMES[i],
        leader: leader._id,
        members: members.map((m) => m._id),
        isActive: true,
      });
      await team.save();

      for (const member of members) {
        member.team = team._id;
        await member.save();
      }

      teams.push(team);
      console.log(
        `  Team "${team.name}": ${size} players (leader: ${leader.username})`
      );
    }

    if (playerIndex !== 46) {
      throw new Error(`Expected to assign 46 players, assigned ${playerIndex}`);
    }

    // Create 3 events and register teams (4 teams per event)
    const now = new Date();
    const events = [];
    for (let i = 0; i < EVENT_DEFS.length; i++) {
      const def = EVENT_DEFS[i];
      const startDate = addDays(now, def.startOffsetDays);
      const endDate = addDays(startDate, def.durationDays);
      const registrationDeadline = addDays(now, def.regDeadlineOffsetDays);
      const eventTeams = teams.slice(i * 4, i * 4 + 4);

      const tournament = new Tournament({
        name: def.name,
        description: def.description,
        startDate,
        endDate,
        registrationDeadline,
        location: def.location,
        venue: def.venue,
        format: def.format,
        tournamentType: "team",
        maxTeams: 8,
        minTeams: 2,
        minTeamMembers: 2,
        maxTeamMembers: 8,
        entryFee: def.entryFee,
        prizePool: def.prizePool,
        status: def.status,
        isPromoted: def.isPromoted,
        promotedAt: def.isPromoted ? now : undefined,
        image: def.image,
        rules: "Standard street soccer rules. Fair play required.",
        createdBy: admin._id,
        registeredTeams: eventTeams.map((team) => ({
          team: team._id,
          registeredAt: now,
          paymentStatus: "paid",
          paymentMethod: "other",
        })),
      });
      await tournament.save();
      events.push({ tournament, teams: eventTeams });
      console.log(
        `Created event "${tournament.name}" with ${eventTeams.length} teams`
      );
    }

    // Create matches: 2 scheduled per event (pair registered teams)
    let matchCount = 0;
    for (const { tournament, teams: eventTeams } of events) {
      const matchDefs = [
        {
          matchNumber: 1,
          round: "Semifinal",
          team1: eventTeams[0],
          team2: eventTeams[1],
          dayOffset: 0,
          time: "10:00",
          status: tournament.status === "in_progress" ? "completed" : "scheduled",
          scores: tournament.status === "in_progress" ? [3, 1] : null,
        },
        {
          matchNumber: 2,
          round: "Semifinal",
          team1: eventTeams[2],
          team2: eventTeams[3],
          dayOffset: 0,
          time: "12:00",
          status: tournament.status === "in_progress" ? "live" : "scheduled",
          scores: null,
        },
        {
          matchNumber: 3,
          round: "Final",
          team1: eventTeams[0],
          team2: eventTeams[2],
          dayOffset: 1,
          time: "15:00",
          status: "scheduled",
          scores: null,
        },
      ];

      for (const def of matchDefs) {
        const scheduledDate = addDays(tournament.startDate, def.dayOffset);
        const match = new Match({
          tournament: tournament._id,
          matchNumber: def.matchNumber,
          round: def.round,
          scheduledDate,
          scheduledTime: def.time,
          location: tournament.location,
          venue: tournament.venue,
          team1: { team: def.team1._id, score: def.scores?.[0] ?? 0 },
          team2: { team: def.team2._id, score: def.scores?.[1] ?? 0 },
          status: def.status,
        });

        if (def.scores) {
          match.setResult(def.scores[0], def.scores[1]);
        }

        await match.save();
        matchCount += 1;
      }
    }
    console.log(`Created ${matchCount} matches`);

    console.log("\n✅ Seed complete!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Events:  ${events.length}`);
    console.log(`Teams:   ${teams.length}`);
    console.log(`Players: ${players.length}`);
    console.log(`Matches: ${matchCount}`);
    console.log(`Password for all seeded players: ${DEFAULT_PASSWORD}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seed();
