import { Database } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory database
export const db: Database = {
  users: new Map(),
  businesses: new Map(),
  branches: new Map(),
  menuItems: new Map(),
  tables: new Map(),
  tabs: new Map(),
  orderItems: new Map(),
  bills: new Map(),
  emails: new Map(),
};

// Helper to add seed data
export function seedDatabase() {
  const businessId = uuidv4();
  const userId = uuidv4();
  const branchId = uuidv4();

  db.businesses.set(businessId, {
    id: businessId,
    name: "ServeIQ Demo",
    type: "restaurant"
  });

  db.users.set(userId, {
    id: userId,
    businessId,
    fullName: "Demo User",
    email: "demo@serveiq.com",
    passwordHash: "$2a$10$X4s9f5e4d3c2b1a0z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1", // "password"
    role: "owner"
  });
  db.emails.set("demo@serveiq.com", userId);

  db.branches.set(branchId, {
    id: branchId,
    businessId,
    name: "Main Branch",
    address: "123 Demo Street",
    phoneNumber: "123-456-7890"
  });

  // Add some menu items
  const menuItems = [
    { name: "Jollof Rice", category: "Main", priceKobo: 250000 },
    { name: "Fried Rice", category: "Main", priceKobo: 200000 },
    { name: "Grilled Chicken", category: "Protein", priceKobo: 150000 },
    { name: "Chapman", category: "Drinks", priceKobo: 50000 },
  ];
  menuItems.forEach(item => {
    const id = uuidv4();
    db.menuItems.set(id, {
      id,
      branchId,
      ...item,
      isAvailable: true
    });
  });

  // Add some tables
  for (let i = 1; i <= 5; i++) {
    const id = uuidv4();
    db.tables.set(id, {
      id,
      branchId,
      tableNumber: String(i),
      capacity: 4,
      status: "available"
    });
  }

  console.log("Database seeded!");
  console.log("Demo login: demo@serveiq.com / password");
}
