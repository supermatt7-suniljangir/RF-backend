# 🔥 RadiatorForge Backend

The engine powering a Behance-inspired creative portfolio platform. Built with Express.js, MongoDB, and Socket.io, and deployed on AWS.


## 🧠 What's under the hood?

This backend manages everything from user authentication to real-time messaging, powering the full-stack portfolio platform for creatives.

### Core Stack
- **Express.js** - Fast, minimalist web framework
- **MongoDB** - NoSQL database for flexible data storage
- **Socket.io** - Real-time communication
- **Redis** - High-performance caching
- **TypeScript** - End-to-end type safety

### AWS Deployment
- **EC2** - Hosting the application
- **S3** - Media storage
- **CloudFront** - CDN for global content delivery
- **CDK** - Infrastructure as code

## 🚀 API Features

### 🔐 Authentication
- JWT-based auth with HTTP-only cookies
- Google OAuth integration
- Password hashing with bcrypt
- Rate limiting to prevent brute force attacks

### 📊 Data Management
- MongoDB aggregation pipelines for complex queries
- Efficient data retrieval patterns
- Normalized database structure
- Optimized indexing for performance

### 🔄 Real-time Functionality
- Socket.io for live updates and chat
- Event-based notification system
- Connection pooling for scalability
- Persistent message storage

### 🗄️ Media Handling
- S3 bucket management for media storage
- Signed URL generation for secure uploads
- CloudFront distribution for global delivery
- Metadata management for assets

### 🛡️ Security Measures
- CORS configuration
- Helmet.js for security headers
- Input validation with Zod
- Request sanitization


## 🔌 Socket.io Events

```typescript
// Chat Events
'connection'            // User connects
'disconnect'            // User disconnects
'joinConversation'             // Join a chat room
'leaveConversation'            // Leave a chat room
'sendMessage'          // Send a message
'revalidateConversations' // revalidate cached conversations

```

## 📈 Performance Optimizations

- **Redis Caching** - Cached responses for frequently accessed data
- **Connection Pooling** - Optimized database connections
- **Query Optimization** - Efficient MongoDB queries and indexes
- **Load Balancing** - Distributed load across multiple instances
- **Rate Limiting** - Prevent API abuse

## 🛠️ Development Setup

```bash
# Clone the repo
git clone https://github.com/supermatt7-suniljangir/RF-Backend.git

# Install dependencies
cd RF-Backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, Redis URL, etc.

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```



## 🔥 Coolest Backend Features

- **Advanced Search** - MongoDB aggregation pipelines that can filter by multiple criteria
- **Real-time Chat** - Socket.io implementation with persistent message storage
- **HTTP-only Auth** - Secure JWT authentication with Google OAuth support
- **Collaboration System** - Database models supporting multi-user project ownership
- **CDN Integration** - Seamless S3 + CloudFront setup for global content delivery


## 🧠 What I Learned

- Structuring complex MongoDB queries for efficient data retrieval
- Implementing secure authentication patterns with HTTP-only cookies
- Setting up real-time communication with Socket.io
- Deploying to AWS using infrastructure as code with CDK
- Optimizing API performance with Redis caching
