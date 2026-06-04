import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const urlString = process.env.DATABASE_URL;
if (!urlString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const adapter = new PrismaBetterSqlite3({ url: urlString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning up database tables for a fresh seed...");
  await prisma.salary.deleteMany({});
  await prisma.truckMaintenance.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.tripClosing.deleteMany({});
  await prisma.tripExpense.deleteMany({});
  await prisma.driverCash.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.truck.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.companyProfile.deleteMany({});

  console.log("Seeding started...");

  // 1. Seed Company Profile
  const company = await prisma.companyProfile.create({
    data: {
      id: 1,
      name: "Gulf Logistics & Transport Co.",
      license: "GCC-EXP-908122",
      trn: "100234891200003",
      address: "Industrial Area 4, Sharjah, UAE",
      phone: "+971 6 543 2100",
      email: "info@gulflotrans.com",
      logoUrl: ""
    }
  });
  console.log("Company profile seeded!");

  // 2. Seed Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("admin123", salt);
  const accountantPassword = await bcrypt.hash("accountant123", salt);
  const operationsPassword = await bcrypt.hash("operations123", salt);

  const userAdmin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@gulflotrans.com",
      password: adminPassword,
      role: "ADMIN"
    }
  });

  await prisma.user.createMany({
    data: [
      {
        username: "accountant",
        email: "accountant@gulflotrans.com",
        password: accountantPassword,
        role: "ACCOUNTANT"
      },
      {
        username: "operations",
        email: "ops@gulflotrans.com",
        password: operationsPassword,
        role: "OPERATIONS"
      }
    ]
  });
  console.log("Users (Admin, Accountant, Operations) seeded!");

  // 3. Seed 1 Customer matching Excel Client
  const customer = await prisma.customer.create({
    data: {
      name: "ASIA CLIENT",
      contactPerson: "Ali Raza",
      trn: "300456123400003",
      paymentTerms: "COD",
      phone: "+971 50 123 4567",
      email: "logistics@asiaclient.com",
      address: "Sharjah, UAE"
    }
  });
  console.log("Customer (ASIA CLIENT) seeded!");

  // 4. Seed 1 Driver matching Excel (Abu Bakar / Fayaz)
  const driverAbuBakar = await prisma.driver.create({
    data: {
      name: "ABU BAKAR",
      mobile: "+971 52 987 6543",
      passport: "N87654321",
      emiratesId: "784-1990-1234567-1",
      license: "Heavy Truck - L-90812A",
      salary: 3000.00,
      advanceBalance: 0.00,
      visaBalance: 1000.00,
      status: "ACTIVE"
    }
  });

  const driverFayaz = await prisma.driver.create({
    data: {
      name: "FAYAZ",
      mobile: "+971 50 111 2222",
      passport: "P55667788",
      emiratesId: "784-1988-5544332-1",
      license: "Heavy Truck - L-55661D",
      salary: 3000.00,
      advanceBalance: 0.00,
      visaBalance: 1000.00,
      status: "ACTIVE"
    }
  });
  console.log("Drivers (ABU BAKAR & FAYAZ) seeded!");

  // 5. Seed 1 Truck matching Excel (45257)
  const truck = await prisma.truck.create({
    data: {
      truckNumber: "TRK-45257",
      plateNumber: "45257",
      trailerNumber: "TRL-908",
      type: "Chemical Tanker",
      registrationExpiry: new Date("2027-05-15"),
      insuranceExpiry: new Date("2027-05-15"),
      status: "IN_TRIP",
      assignedDriverId: driverAbuBakar.id
    }
  });
  console.log("Truck (45257) seeded!");

  // 6. Seed Trips & Associated Cash/Expenses matching Excel

  // Row 5: Abu Bakar, Truck 45257, DO 7894, Client Asia, loading RAK, delivery QATAR.
  // Petty Cash: 2850. Used Petty Cash: 2780. Remaining Balance: 70.
  const trip1 = await prisma.trip.create({
    data: {
      tripNumber: "TRIP-2026-001",
      customerId: customer.id,
      driverId: driverAbuBakar.id,
      truckId: truck.id,
      fromCountry: "UAE",
      toCountry: "Qatar",
      loadingPoint: "RAK",
      deliveryPoint: "QATAR",
      doNumber: "7894",
      cargoType: "Chemical Tank",
      tripAmount: 8500.00,
      status: "DELIVERED",
      createdAt: new Date("2026-03-02T08:00:00Z"),
      updatedAt: new Date("2026-03-05T18:00:00Z")
    }
  });

  await prisma.driverCash.create({
    data: {
      tripId: trip1.id,
      amount: 2850.00,
      date: new Date("2026-03-02T09:00:00Z"),
      paymentMethod: "CASH",
      notes: "Trip fuel and border expenses advance"
    }
  });

  await prisma.tripExpense.create({
    data: {
      tripId: trip1.id,
      diesel: 1550.00,
      food: 200.00,
      border: 200.00, // Broder
      maintenance: 65.00, // SIM 65
      toll: 20.00, // Toll Gate
      qatarVisa: 50.00,
      qatarToll: 195.00, // Qatar Ins
      ksaVisa: 0.00,
      uaeCustoms: 0.00,
      ksaCustoms: 460.00,
      mezan: 40.00,
      jordanBorder: 0.00,
      cameraFine: 0.00,
      hayaPeshgi: 0.00,
      gatePass: 0.00,
      notes: "First row matching Excel sheet"
    }
  });

  // Trip Closing for Row 5
  await prisma.tripClosing.create({
    data: {
      tripId: trip1.id,
      totalCashGiven: 2850.00,
      totalExpenses: 2780.00,
      remainingBalance: 70.00,
      extraPayable: 0.00,
      closedDate: new Date("2026-03-06T10:00:00Z"),
      closedById: userAdmin.id
    }
  });

  // Row 6: Abu Bakar, Truck 45257, DO 7895, Client Atlantic, loading HUM, delivery Riyadh
  // Petty Cash: 2283. Used Petty Cash: 2365. Remaining Balance: -20 (cumulative remaining: 70 + 2283 - 2365 = -12)
  const trip2 = await prisma.trip.create({
    data: {
      tripNumber: "TRIP-2026-002",
      customerId: customer.id,
      driverId: driverAbuBakar.id,
      truckId: truck.id,
      fromCountry: "UAE",
      toCountry: "Saudi Arabia",
      loadingPoint: "HUM",
      deliveryPoint: "RIYADHA",
      doNumber: "7895",
      cargoType: "Chemical Tank",
      tripAmount: 9000.00,
      status: "IN_TRANSIT",
      createdAt: new Date("2026-03-07T08:00:00Z"),
      updatedAt: new Date("2026-03-07T08:00:00Z")
    }
  });

  await prisma.driverCash.create({
    data: {
      tripId: trip2.id,
      amount: 2283.00,
      date: new Date("2026-03-07T09:00:00Z"),
      paymentMethod: "CASH",
      notes: "HUM to Riyadh trip advance"
    }
  });

  await prisma.tripExpense.create({
    data: {
      tripId: trip2.id,
      diesel: 1620.00,
      food: 200.00,
      border: 75.00,
      maintenance: 0.00,
      toll: 20.00,
      qatarVisa: 0.00,
      qatarToll: 0.00,
      ksaVisa: 0.00,
      uaeCustoms: 0.00,
      ksaCustoms: 430.00,
      mezan: 20.00,
      jordanBorder: 0.00,
      cameraFine: 0.00,
      hayaPeshgi: 0.00,
      gatePass: 20.00,
      notes: "Second row matching Excel sheet"
    }
  });

  console.log("Trips, cash logs, expenses, and closings seeded!");

  // 7. Seed Salaries matching Excel

  // Fayaz January Salary
  await prisma.salary.create({
    data: {
      driverId: driverFayaz.id,
      month: 1, // January
      year: 2026,
      baseSalary: 3000.00,
      roomDeduction: 210.00,
      advanceDeduction: 0.00,
      fineDeduction: 0.00,
      visaDeduction: 1000.00,
      netSalary: 1790.00,
      paymentDate: new Date("2026-02-17T08:00:00Z"),
      notes: "Fayaz January Salary"
    }
  });

  // Fayaz February Salary
  await prisma.salary.create({
    data: {
      driverId: driverFayaz.id,
      month: 2, // February
      year: 2026,
      baseSalary: 3000.00,
      roomDeduction: 222.00,
      advanceDeduction: 0.00,
      fineDeduction: 0.00,
      visaDeduction: 1000.00,
      netSalary: 1778.00,
      paymentDate: new Date("2026-03-03T08:00:00Z"),
      notes: "Fayaz February Salary"
    }
  });
  console.log("Salaries seeded successfully!");

  console.log("Seeding completed successfully with short realistic test data!");
}

main()
  .catch((e) => {
    console.error("Error running seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
