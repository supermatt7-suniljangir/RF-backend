// import mongoose from "mongoose";
// import users from "./userData";
// import User from "./models/user/user.model";
// import { connectDB } from "./config/db";
// connectDB();
// const importData = async () => {
//   try {
//     await User.insertMany(users);
//     console.log("Data Imported!");
//     process.exit();
//   } catch (error) {
//     console.error(`Error importing data: ${error}`);
//     process.exit(1);
//   }
// };

// const destroyData = async () => {
//   try {
//     await User.deleteMany();
//     console.log("Data Destroyed!");
//     process.exit();
//   } catch (error) {
//     console.error(`Error destroying data: ${error}`);
//     process.exit(1);
//   }
// };

// // Run function based on command line argument
// if (process.argv[2] === "--d") {
//     destroyData();
// } 
// else importData();



import mongoose from "mongoose";
import Project from "./models/project/project.model";
import { connectDB } from "./config/db";
import projects from "./data/projects";


connectDB();

const importData = async () => {
  try {
    await Project.deleteMany(); // Clear existing projects
    await Project.insertMany(projects);
    console.log("Projects Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`Error importing projects data: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Project.deleteMany();
    console.log("Projects Data Destroyed!");
    process.exit();
  } catch (error) {
    console.error(`Error destroying projects data: ${error}`);
    process.exit(1);
  }
};

// Run function based on command line argument
if (process.argv[2] === "--d") {
  destroyData();
} else {
  importData();
}