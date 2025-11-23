# Photo Upload Queue Implementation

## 📝 Overview

Photo upload functionality has been implemented using **background job processing** with Bull queue. This ensures non-blocking user creation and automatic retries for failed photo uploads.

## 🎯 SOLID Principles Applied

### 1. **Single Responsibility Principle (SRP)**
- `PhotoUploadService` - Handles only photo upload queue operations
- `PhotoUploadQueueProcessor` - Processes only photo upload jobs
- `AuthService` - Delegates photo upload to specialized service

### 2. **Open/Closed Principle (OCP)**
- Easy to extend with new upload strategies without modifying existing code
- Queue configuration can be modified without changing service logic

### 3. **Liskov Substitution Principle (LSP)**
- `PhotoUploadService` implements `IPhotoUploadService` interface
- Can be substituted with any implementation of the interface

### 4. **Interface Segregation Principle (ISP)**
- `IPhotoUploadService` - Focused interface for photo upload operations
- No unnecessary methods forced on implementations

### 5. **Dependency Inversion Principle (DIP)**
- `AuthService` depends on `PhotoUploadService` abstraction
- `PhotoUploadService` depends on `HcService` abstraction
- All dependencies injected through constructor

## 🏗️ Architecture

```
┌─────────────────────┐
│   Auth Controller   │
│   (create-user)     │
└──────────┬──────────┘
           │
           │ 1. Create User + Photo
           ▼
┌─────────────────────┐
│    Auth Service     │
└──────────┬──────────┘
           │
           │ 2. Queue Photo Upload
           ▼
┌─────────────────────┐
│ PhotoUploadService  │
│   (Queue Manager)   │
└──────────┬──────────┘
           │
           │ 3. Add to Bull Queue
           ▼
┌─────────────────────┐
│   Bull Queue        │
│  'photo-upload'     │
└──────────┬──────────┘
           │
           │ 4. Process Job
           ▼
┌─────────────────────┐
│ PhotoQueueProcessor │
└──────────┬──────────┘
           │
           │ 5. Upload Photo
           ▼
┌─────────────────────┐
│    HC Service       │
│  (uploadUserPhoto)  │
└─────────────────────┘
```

## 📦 Components

### 1. **DTOs**
- `PhotoUploadJobDto` - Queue job data structure
- `PhotoUploadResult` - Upload result interface

**Location:** `src/modules/auth/dto/photo-upload-job.dto.ts`

### 2. **Service Interface**
- `IPhotoUploadService` - Photo upload service contract

**Location:** `src/modules/auth/interfaces/photo-upload-service.interface.ts`

### 3. **Photo Upload Service**
- Queues photo uploads
- Processes upload jobs
- Handles retries

**Location:** `src/modules/auth/services/photo-upload.service.ts`

### 4. **Queue Processor**
- Processes background jobs
- Handles success/failure events
- Automatic retry logic

**Location:** `src/modules/auth/processors/photo-upload-queue.processor.ts`

### 5. **Queue Configuration**
```typescript
BullModule.registerQueue({
  name: 'photo-upload',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep for debugging
  },
})
```

## 🔄 Flow

### User Creation with Photo

1. **Frontend sends request:**
   ```http
   POST /api/v1/auth/create-user
   Content-Type: multipart/form-data

   {
     "email": "user@example.com",
     "first_name": "John",
     "last_name": "Doe",
     "role": "EMPLOYEE",
     "groupId": "1",
     "gender": 1,
     "phone": "+998901234567",
     "start_date": "2025-01-01",
     "photo": <file>  // Required!
   }
   ```

2. **Backend creates user:**
   - Validates user data
   - Creates user in database
   - Syncs with HC system
   - Gets HC person ID

3. **Photo upload queued:**
   - Converts photo to base64
   - Creates queue job
   - Returns job ID to client

4. **Background processing:**
   - Job picked up by processor
   - Photo saved to database
   - Photo uploaded to HC
   - Retries on failure (3 attempts)

5. **Response:**
   ```json
   {
     "message": "User created successfully",
     "user": {
       "user_id": "uuid",
       "email": "user@example.com",
       "role": "EMPLOYEE",
       "status": "SYNCED"
     },
     "temporary_password": "TempPass123!",
     "photoUpload": {
       "status": "QUEUED",
       "jobId": "12345",
       "message": "Photo upload queued for background processing"
     },
     "syncStatus": "SYNCED",
     "hcUser": { ... }
   }
   ```

## 🔍 Monitoring

### Queue Dashboard (Bull Board)
Monitor queue status at: `/admin/queues` (if configured)

### Logs
```bash
# Photo queued
📤 Queuing photo upload for user: user@example.com (HC: P001)
✅ Photo upload job queued with ID: 12345

# Processing
🎯 Processing photo upload job 12345 for user: user@example.com
💾 Photo saved locally for user: user@example.com
✅ Photo uploaded to HC system for user: user@example.com

# Success
🎉 Photo upload completed for user: user@example.com (Job 12345)

# Failure
❌ Photo upload job 12345 failed for user: user@example.com
💥 Photo upload failed for user: user@example.com (Job 12345)
🚨 Photo upload permanently failed after 3 attempts
```

## ⚠️ Error Handling

### 1. **HC Sync Failed (No HC Person ID)**
- User created but photo NOT queued
- Photo can be uploaded manually later via `/auth/upload-photo`

### 2. **Queue Failure**
- User created successfully
- Photo NOT queued
- Warning logged
- Photo can be uploaded manually

### 3. **Upload Processing Failed**
- Job retried automatically (3 attempts)
- Exponential backoff (2s, 4s, 8s)
- After 3 failures, job marked as failed
- Admin can retry manually

### 4. **Photo Saved Locally, HC Upload Failed**
- Photo saved in database
- HC upload can be retried later
- Use `PhotoUploadService.retryPhotoUpload(userId)`

## 🛠️ Manual Operations

### Retry Failed Upload
```typescript
// In a controller or service
await this.photoUploadService.retryPhotoUpload(userId);
```

### Check Queue Status
```typescript
// Get queue
const photoQueue = this.queueService.getQueue('photo-upload');

// Get job status
const job = await photoQueue.getJob(jobId);
const state = await job.getState(); // 'active', 'completed', 'failed', etc.
```

## 📊 Database Schema

### User Table
```sql
ALTER TABLE users ADD COLUMN photo_url TEXT;
```

Photo stored as base64 data URL:
```
data:image/jpeg;base64,/9j/4AAQSkZJRg...
```

## 🧪 Testing

### Test User Creation with Photo
```bash
curl -X POST http://localhost:3000/api/v1/auth/create-user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "email=test@example.com" \
  -F "first_name=Test" \
  -F "last_name=User" \
  -F "role=EMPLOYEE" \
  -F "groupId=1" \
  -F "gender=1" \
  -F "phone=+998901234567" \
  -F "start_date=2025-01-01" \
  -F "photo=@/path/to/photo.jpg"
```

### Test Photo Upload Endpoint
```bash
curl -X POST http://localhost:3000/api/v1/auth/upload-photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "personId=USER_HC_PERSON_ID" \
  -F "photo=@/path/to/photo.jpg"
```

## 🚀 Benefits

1. **Non-blocking** - User creation doesn't wait for photo upload
2. **Reliable** - Automatic retries on failure
3. **Scalable** - Can handle high volumes
4. **Maintainable** - SOLID principles make it easy to modify
5. **Traceable** - Job IDs for tracking upload status
6. **Resilient** - Photo saved locally even if HC fails

## 📝 Future Enhancements

1. **File Storage** - Upload to S3/CloudFlare instead of base64
2. **Image Processing** - Resize/compress before upload
3. **Webhooks** - Notify frontend when upload completes
4. **Bulk Upload** - Support multiple photos at once
5. **Progress Tracking** - Real-time upload progress
6. **Admin Dashboard** - View failed jobs and retry

## 🔐 Security

- File size limited to 5MB
- Only JPG, JPEG, PNG allowed
- Role-based access control
- Photo validation before upload
- Secure base64 encoding

---

**Implementation Date:** 2025-11-23
**Author:** Claude Code
**SOLID Principles:** ✅ Fully Applied