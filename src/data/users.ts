import { UserType } from "../types/user";

// usersData.ts
const users: Array<UserType> = [
  {
    password: "password",
    token: "token123",
    expiresIn: 3600,
    email: "sunil@example.com",
    fullName: "Sunil Jangid",
    profile: {
      bio: "Frontend Developer",
      avatar: "https://link-to-avatar.com/avatar1.png",
      cover: "https://link-to-cover.com/cover1.png",
      followers: 5,
      following: 4,
      website: "https://sunilwebsite.com",
      phone: "+911234567890",
      social: {
        github: "github.com/suniljangid",
        linkedin: "linkedin.com/suniljangid",
      },
    },
  },
  {
    token: "token456",
    password: "password",
    expiresIn: 3600,
    email: "john@example.com",
    fullName: "John Doe",
    profile: {
      bio: "Backend Developer",
      avatar: "https://link-to-avatar.com/avatar2.png",
      cover: "https://link-to-cover.com/cover2.png",
      followers: 5,
      following: 9,
      website: "https://johndoe.com",
      phone: "+919876543210",
      social: {
        twitter: "instagram.com/johndoe",
        github: "github.com/johndoe",
      },
    },
  },
];

export default users;
