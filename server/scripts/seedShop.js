import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Product from "../models/Product.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(projectRoot, "server", ".env") });

const PRODUCTS = [
  {
    name: "Arena Heavyweight Pitch Crewneck",
    description:
      "Custom 450gsm brushed cotton-fleece crewneck engineered for pre-match warmups and chilly night games. Features a tonal embroidered Arena crest on the chest, ribbed side gussets for mobility, and a relaxed athletic silhouette.",
    category: "apparel",
    price: 65,
    originalPrice: 78,
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=80",
    ],
    stock: 45,
    sku: "ARN-CRW-01",
    status: "active",
    featured: true,
    tags: ["crewneck", "fleece", "apparel", "streetwear", "warmup"],
    weight: 0.65,
  },
  {
    name: "Arena Insulated Pitch Bottle (750ml)",
    description:
      "Double-wall vacuum insulated stainless steel water bottle. Keeps liquids ice-cold for 24 hours during tournament play. Designed with a leakproof fast-flow sports cap, laser-etched Arena typography, and a powder-coated matte grip.",
    category: "accessories",
    price: 28,
    originalPrice: 34,
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=1200&auto=format&fit=crop&q=80",
    ],
    stock: 75,
    sku: "ARN-BTL-01",
    status: "active",
    featured: true,
    tags: ["bottle", "hydration", "accessories", "pitch", "insulated"],
    weight: 0.35,
  },
  {
    name: "Arena Structured Street Snapback Hat",
    description:
      "Classic six-panel structured wool-blend snapback with high-density embroidered Arena Gunners emblem. Built with an interior moisture-wicking headband, flat visor with green undervisor, and adjustable snap closure.",
    category: "accessories",
    price: 32,
    originalPrice: 38,
    images: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=1200&auto=format&fit=crop&q=80",
    ],
    stock: 60,
    sku: "ARN-HAT-01",
    status: "active",
    featured: true,
    tags: ["hat", "cap", "snapback", "headwear", "accessories"],
    weight: 0.15,
  },
  {
    name: "Arena Heritage Matchday Graphic T-Shirt",
    description:
      "Heavyweight 240gsm combed organic cotton boxy-fit tee. Features hand screen-printed tournament graphics celebrating Ethiopian street soccer heritage, a tight reinforced ribbed collar, and pre-shrunk soft hand feel.",
    category: "apparel",
    price: 38,
    originalPrice: 45,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80",
    ],
    stock: 80,
    sku: "ARN-TSH-01",
    status: "active",
    featured: true,
    tags: ["t-shirt", "tee", "apparel", "matchday", "cotton"],
    weight: 0.25,
  },
  {
    name: "Arena Sideline All-Weather Windbreaker Jacket",
    description:
      "Technical ripstop nylon coach jacket with durable water-repellent coating. Fully lined with breathable athletic mesh, custom tonal snap closures, elastic cuffs, storm flap zipper, and reflective Arena insignias for night pitch visibility.",
    category: "apparel",
    price: 95,
    originalPrice: 120,
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&auto=format&fit=crop&q=80",
    ],
    stock: 35,
    sku: "ARN-JCK-01",
    status: "active",
    featured: true,
    tags: ["jacket", "outerwear", "windbreaker", "apparel", "coach"],
    weight: 0.5,
  },
];

async function seedShop() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set in environment");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB:", mongoose.connection.name);

    const admin =
      (await User.findOne({ role: "admin" })) || (await User.findOne());
    if (!admin) {
      throw new Error("No user found to assign createdBy. Create an admin first.");
    }
    console.log(`Using createdBy: ${admin.username} (${admin._id})`);

    // Remove old test product(s) or previously seeded SKUs
    const skus = PRODUCTS.map((p) => p.sku);
    const deleteResult = await Product.deleteMany({
      $or: [{ sku: { $in: skus } }, { name: /^test$/i }],
    });
    console.log(`Removed ${deleteResult.deletedCount} existing/test products`);

    // Insert new products
    let createdCount = 0;
    for (const item of PRODUCTS) {
      const product = new Product({
        ...item,
        createdBy: admin._id,
        updatedBy: admin._id,
      });
      await product.save();
      console.log(`✓ Added product: ${product.name} ($${product.price}) - SKU: ${product.sku}`);
      createdCount++;
    }

    console.log(`\n✅ Shop seed complete! Successfully added ${createdCount} products.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Shop seed failed:", err);
    process.exit(1);
  }
}

seedShop();

