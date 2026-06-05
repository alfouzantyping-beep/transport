import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" }),
});

const categories = [
  "Diesel", "Petrol", "Toll", "Border Charges", "Visa", "Customs", "Gate Pass", "Food", "Parking",
  "Hotel", "Maintenance", "Tyre", "Oil Change", "Battery", "Washing", "Police Fine", "Insurance",
  "Registration", "Other",
];

async function main() {
  console.log("Resetting and seeding Transport ERP data...");
  await prisma.tripSettlement.deleteMany({});
  await prisma.driverCashAdvance.deleteMany({});
  await prisma.driverMonthlySalary.deleteMany({});
  await prisma.truckMaintenance.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.tripClosing.deleteMany({});
  await prisma.tripExpense.deleteMany({});
  await prisma.driverCash.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.truck.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.expenseCategory.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.companyProfile.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  const adminRole = await prisma.role.create({ data: { name: "Admin", description: "Full system access" } });
  await prisma.role.createMany({
    data: [
      { name: "Accountant", description: "Finance and reporting access" },
      { name: "Operations", description: "Transport operations access" },
    ],
  });

  const passwordHash = await bcrypt.hash("admin123456", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      username: "admin",
      email: "admin@transport.com",
      password: passwordHash,
      passwordHash,
      role: "Admin",
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  });

  await prisma.company.create({
    data: {
      companyName: "Gulf Logistics & Transport Co.",
      tradeLicenseNo: "GCC-EXP-908122",
      trn: "100234891200003",
      address: "Industrial Area 4, Sharjah, UAE",
      phone: "+971 6 543 2100",
      email: "info@gulflotrans.com",
      website: "https://gulflotrans.com",
      bankName: "Emirates NBD",
      iban: "AE070331234567890123456",
      accountNo: "1234567890",
    },
  });
  await prisma.companyProfile.create({
    data: {
      id: 1,
      name: "Gulf Logistics & Transport Co.",
      license: "GCC-EXP-908122",
      trn: "100234891200003",
      address: "Industrial Area 4, Sharjah, UAE",
      phone: "+971 6 543 2100",
      email: "info@gulflotrans.com",
    },
  });

  for (const name of categories) {
    await prisma.expenseCategory.create({
      data: {
        name,
        type: ["Maintenance", "Tyre", "Oil Change", "Battery", "Washing", "Insurance", "Registration"].includes(name) ? "VEHICLE" : "TRIP",
        description: `${name} transport expense`,
        status: "ACTIVE",
      },
    });
  }

  const customer = await prisma.customer.create({
    data: {
      companyName: "ASIA CLIENT",
      name: "ASIA CLIENT",
      contactPerson: "Ali Raza",
      phone: "+971 50 123 4567",
      email: "logistics@asiaclient.com",
      address: "Sharjah, UAE",
      trn: "300456123400003",
      paymentTerms: "Net 30",
      creditLimit: 50000,
      status: "ACTIVE",
    },
  });

  const driver = await prisma.driver.create({
    data: {
      name: "ABU BAKAR",
      mobile: "+971 52 987 6543",
      passport: "N87654321",
      passportNo: "N87654321",
      emiratesId: "784-1990-1234567-1",
      license: "Heavy Truck - L-90812A",
      licenseNo: "L-90812A",
      licenseExpiry: new Date("2027-05-15"),
      visaExpiry: new Date("2027-06-30"),
      salary: 3000,
      basicSalary: 3000,
      visaBalance: 1000,
      status: "ACTIVE",
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      truckNo: "TRK-45257",
      plateNo: "45257",
      trailerNo: "TRL-908",
      vehicleType: "TANKER",
      model: "Chemical Tanker",
      ownerType: "COMPANY_OWNED",
      registrationExpiry: new Date("2027-05-15"),
      insuranceExpiry: new Date("2027-05-15"),
      currentDriverId: driver.id,
      status: "ON_TRIP",
    },
  });

  const truck = await prisma.truck.create({
    data: {
      truckNumber: vehicle.truckNo,
      plateNumber: vehicle.plateNo,
      trailerNumber: vehicle.trailerNo || "",
      type: "Chemical Tanker",
      registrationExpiry: vehicle.registrationExpiry,
      insuranceExpiry: vehicle.insuranceExpiry,
      status: "IN_TRIP",
      assignedDriverId: driver.id,
    },
  });

  const trip = await prisma.trip.create({
    data: {
      tripNo: "TRIP-2026-0001",
      tripNumber: "TRIP-2026-0001",
      tripDate: new Date("2026-03-02"),
      customerId: customer.id,
      driverId: driver.id,
      vehicleId: vehicle.id,
      truckId: truck.id,
      fromCountry: "UAE",
      toCountry: "Qatar",
      loadingPoint: "RAK",
      deliveryPoint: "Doha",
      doNumber: "7894",
      cargoType: "Chemical Tank",
      cargoWeight: 24,
      tripAmount: 8500,
      status: "ON_TRIP",
      notes: "Seed trip for Phase 3 settlement flow",
    },
  });

  await prisma.driverCashAdvance.create({
    data: {
      tripId: trip.id,
      driverId: driver.id,
      amount: 3000,
      cashDate: new Date("2026-03-02"),
      paymentMethod: "CASH",
      givenBy: admin.name,
      notes: "Fuel and border cash advance",
    },
  });

  const diesel = await prisma.expenseCategory.findUniqueOrThrow({ where: { name: "Diesel" } });
  const toll = await prisma.expenseCategory.findUniqueOrThrow({ where: { name: "Toll" } });
  await prisma.tripExpense.createMany({
    data: [
      {
        tripId: trip.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        expenseCategoryId: diesel.id,
        expenseDate: new Date("2026-03-03"),
        receiptNo: "DSL-1001",
        amount: 1550,
        diesel: 1550,
        description: "Diesel receipt",
      },
      {
        tripId: trip.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        expenseCategoryId: toll.id,
        expenseDate: new Date("2026-03-03"),
        receiptNo: "TOLL-1001",
        amount: 120,
        toll: 120,
        description: "Road tolls",
      },
    ],
  });

  console.log("Seed complete. Login: admin@transport.com / admin123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
