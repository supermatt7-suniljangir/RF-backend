import { ProjectType } from "../types/project";

const projects: ProjectType[] = [
  {
    title: "Project A",
    description:
      "A brief description of Project A, showcasing a minimalist design.",
    shortDescription: "Short description of Project A.",
    thumbnail: "https://example.com/thumbnail1.jpg",
    media: [
      { type: "image", url: "https://example.com/image1.jpg" },
      { type: "video", url: "https://example.com/video1.video" },
    ],
    creator: "507f1f77bcf86cd799439011", // Sample ObjectId
    collaborators: ["507f1f77bcf86cd799439012"],
    tags: ["design", "minimalist", "UI/UX"],
    tools: [{ name: "Figma", icon: "https://example.com/figma-icon.png" }],
    categories: ["UI Design", "Web Design"],
    stats: {
      views: 120,
      likes: 45,
      saves: 22,
      comments: 3,
    },
    comments: [
      {
        user: "507f1f77bcf86cd799439011", // Sample ObjectId
        content: "Love the minimalism in this project!",
        createdAt: new Date(),
      },
    ],
    featured: false,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "published",
    projectUrl: "https://example.com/project-a",
    copyright: {
      license: "CC BY 4.0",
      allowsDownload: true,
      commercialUse: true,
    },
  },
  {
    title: "Project B",
    description: "Project B focuses on an innovative e-commerce UI design.",
    shortDescription: "Short description of Project B.",
    thumbnail: "https://example.com/thumbnail2.jpg",
    media: [
      { type: "image", url: "https://example.com/image2.jpg" },
      { type: "image", url: "https://example.com/image3.jpg" },
    ],
    creator: "507f1f77bcf86cd799439011", // Sample ObjectId
    collaborators: ["507f1f77bcf86cd799439013"],
    tags: ["e-commerce", "UI", "design"],
    tools: [{ name: "Adobe XD", icon: "https://example.com/xd-icon.png" }],
    categories: ["UI Design", "E-commerce"],
    stats: {
      views: 200,
      likes: 60,
      saves: 30,
      comments: 5,
    },
    comments: [
      {
        user: "507f1f77bcf86cd799439012", // Sample ObjectId
        content: "This UI is incredible, great work!",
        createdAt: new Date(),
      },
    ],
    featured: true,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "published",
    projectUrl: "https://example.com/project-b",
    copyright: {
      license: "MIT",
      allowsDownload: true,
      commercialUse: false,
    },
  },
  {
    title: "Project C",
    description: "An interactive app design for a food delivery service.",
    shortDescription: "Short description of Project C.",
    thumbnail: "https://example.com/thumbnail3.jpg",
    media: [
      { type: "video", url: "https://example.com/video2.video" },
      { type: "image", url: "https://example.com/image4.jpg" },
    ],
    creator: "507f1f77bcf86cd799439014", // Sample ObjectId
    collaborators: ["507f1f77bcf86cd799439015"],
    tags: ["app design", "mobile", "food delivery"],
    tools: [{ name: "Sketch", icon: "https://example.com/sketch-icon.png" }],
    categories: ["App Design", "Mobile"],
    stats: {
      views: 150,
      likes: 72,
      saves: 18,
      comments: 2,
    },
    comments: [
      {
        user: "507f1f77bcf86cd799439014", // Sample ObjectId
        content: "This would be great for a food delivery app!",
        createdAt: new Date(),
      },
    ],
    featured: false,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "draft",
    projectUrl: "https://example.com/project-c",
    copyright: {
      license: "CC0",
      allowsDownload: true,
      commercialUse: true,
    },
  },
  {
    title: "Project D",
    description: "A conceptual web app for managing personal finances.",
    shortDescription: "Short description of Project D.",
    thumbnail: "https://example.com/thumbnail4.jpg",
    media: [
      { type: "image", url: "https://example.com/image5.jpg" },
      { type: "image", url: "https://example.com/image6.jpg" },
    ],
    creator: "507f1f77bcf86cd799439016", // Sample ObjectId
    collaborators: ["507f1f77bcf86cd799439017"],
    tags: ["finance", "web app", "design"],
    tools: [
      { name: "InVision", icon: "https://example.com/invision-icon.png" },
    ],
    categories: ["Web Design", "Finance"],
    stats: {
      views: 300,
      likes: 90,
      saves: 50,
      comments: 8,
    },
    comments: [
      {
        user: "507f1f77bcf86cd799439016", // Sample ObjectId
        content: "This is a great concept for personal finance management.",
        createdAt: new Date(),
      },
    ],
    featured: true,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "published",
    projectUrl: "https://example.com/project-d",
    copyright: {
      license: "Apache 2.0",
      allowsDownload: true,
      commercialUse: true,
    },
  },
  {
    title: "Project E",
    description: "A sleek mobile app interface for social media.",
    shortDescription: "Short description of Project E.",
    thumbnail: "https://example.com/thumbnail5.jpg",
    media: [
      { type: "video", url: "https://example.com/video3.video" },
      { type: "image", url: "https://example.com/image7.jpg" },
    ],
    creator: "507f1f77bcf86cd799439018", // Sample ObjectId
    collaborators: ["507f1f77bcf86cd799439019"],
    tags: ["mobile app", "social media", "UI design"],
    tools: [{ name: "Framer", icon: "https://example.com/framer-icon.png" }],
    categories: ["App Design", "Mobile"],
    stats: {
      views: 500,
      likes: 120,
      saves: 75,
      comments: 10,
    },
    comments: [
      {
        user: "507f1f77bcf86cd799439018", // Sample ObjectId
        content: "This design is perfect for a social media platform.",
        createdAt: new Date(),
      },
    ],
    featured: true,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "published",
    projectUrl: "https://example.com/project-e",
    copyright: {
      license: "GPL-3.0",
      allowsDownload: true,
      commercialUse: true,
    },
  },
];

export default projects;
