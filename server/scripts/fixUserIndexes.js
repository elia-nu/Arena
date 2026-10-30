import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connect = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }
  await mongoose.connect(process.env.MONGODB_URI);
};

/** Only BSON null or empty string — avoids matching “field missing” */
const nullOrEmptyFilter = (field) => ({
  $or: [{ [field]: { $type: "null" } }, { [field]: "" }],
});

const dropIndexesOnField = async (collection, fieldName) => {
  const indexes = await collection.indexes();
  const toDrop = indexes.filter(
    (idx) =>
      idx.name !== "_id_" &&
      idx.key &&
      Object.keys(idx.key).length === 1 &&
      Object.prototype.hasOwnProperty.call(idx.key, fieldName),
  );
  for (const idx of toDrop) {
    await collection.dropIndex(idx.name);
    console.log(`Dropped index: ${idx.name} on ${fieldName}`);
  }
  return toDrop.length;
};

const fixUserIndexes = async () => {
  try {
    await connect();
    const users = mongoose.connection.collection("users");

    console.log("Connected to MongoDB. Repairing user indexes...");

    // Must drop bad unique indexes FIRST — otherwise unsetting email:null
    // hits E11000 (multiple docs would still have email:null during update).
    await dropIndexesOnField(users, "email");
    await dropIndexesOnField(users, "phone");

    const emailCleanup = await users.updateMany(nullOrEmptyFilter("email"), {
      $unset: { email: "" },
    });
    const phoneCleanup = await users.updateMany(nullOrEmptyFilter("phone"), {
      $unset: { phone: "" },
    });

    console.log(
      `Unset empty/null email on ${emailCleanup.modifiedCount} document(s).`,
    );
    console.log(
      `Unset empty/null phone on ${phoneCleanup.modifiedCount} document(s).`,
    );

    await users.createIndex(
      { email: 1 },
      {
        name: "email_1",
        unique: true,
        partialFilterExpression: {
          email: { $exists: true, $type: "string", $ne: "" },
        },
      },
    );

    await users.createIndex(
      { phone: 1 },
      {
        name: "phone_1",
        unique: true,
        partialFilterExpression: {
          phone: { $exists: true, $type: "string", $ne: "" },
        },
      },
    );

    console.log("Recreated email_1 and phone_1 as partial unique indexes.");
    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to fix user indexes:", error);
    process.exit(1);
  }
};

fixUserIndexes();
