# HC (HikCentral) Service Module

## 📋 Overview

HC Module provides integration with HikCentral API for managing persons, terminals, and related operations. The module is built following **SOLID principles** for maintainability, testability, and extensibility.

---

## 🏗️ Architecture

### SOLID Principles Applied

#### 1. **Single Responsibility Principle (SRP)**

Each class has one reason to change:

- `HcApiConfig` - Configuration management only
- `HcApiClient` - HTTP communication only
- `HcDateFormatter` - Date formatting only
- `HcService` - Business logic only

#### 2. **Open/Closed Principle (OCP)**

- Easy to add new HC API methods without modifying existing code
- Extend `HcService` with new methods following the same pattern
- Add new endpoints in `HcApiConfig.getEndpoints()`

#### 3. **Liskov Substitution Principle (LSP)**

- `HcService` implements `IHcService` interface
- Can be replaced with mock implementations for testing

#### 4. **Interface Segregation Principle (ISP)**

- Focused interfaces (`IHcService`, `HcApiResponse`, etc.)
- Clients don't depend on methods they don't use

#### 5. **Dependency Inversion Principle (DIP)**

- High-level `HcService` depends on abstractions (`HcApiClient`, `HcApiConfig`)
- Easy to mock dependencies for unit testing

---

## 📁 Project Structure

```
src/modules/hc/
├── config/
│   └── hc-api.config.ts          # Configuration service
├── dto/
│   └── hc-user.dto.ts             # Data Transfer Objects
├── interfaces/
│   └── hc-api.interface.ts        # TypeScript interfaces
├── services/
│   └── hc-api-client.service.ts   # Base HTTP client (reusable)
├── utils/
│   └── hc-date.util.ts            # Date formatting utility
├── hc.service.ts                   # Main business logic service
├── hc.module.ts                    # NestJS module configuration
└── README.md                       # This file
```

---

## 🔧 Components

### 1. HcApiConfig (`config/hc-api.config.ts`)

**Responsibility:** Centralized configuration

```typescript
const config = new HcApiConfig();
config.getBaseUrl(); // HC API base URL
config.getAccessToken(); // Access token
config.getEndpoints(); // All API endpoints
config.validate(); // Validate configuration
```

### 2. HcApiClient (`services/hc-api-client.service.ts`)

**Responsibility:** HTTP communication with HC API

**Features:**

- Automatic request/response logging
- Error handling with detailed messages
- HC API response validation (errorCode checking)
- Axios interceptors for debugging

```typescript
await apiClient.post<HcPersonData>({
  endpoint: '/person/v1/persons/add',
  data: { ... },
  timeout: 10000, // optional
});
```

### 3. HcDateFormatter (`utils/hc-date.util.ts`)

**Responsibility:** Date formatting for HC API

```typescript
// Format single date
HcDateFormatter.toHcFormat('2025-01-08');
// Result: "2025-01-08T14:30:00+05:00"

// Format multiple dates
HcDateFormatter.formatDates({
  startDate: new Date(),
  endDate: '2025-12-31',
});
```

### 4. HcService (`hc.service.ts`)

**Responsibility:** Business logic for HC operations

**Available Methods:**

```typescript
// Create user on HC Cabinet
await hcService.createUserOnCabinet(dto);

// Update user
await hcService.updateUserOnCabinet(personId, updateData);

// Get user
await hcService.getUserFromCabinet(personId);

// Delete user
await hcService.deleteUserFromCabinet(personId);

// Bind user with terminal
await hcService.bindUserWithTerminal({ personId, terminalId });

// Unbind user from terminal
await hcService.unbindUserFromTerminal({ personId, terminalId });
```

---

## 📝 Usage Examples

### Basic Usage (Inject in Controller/Service)

```typescript
import { Injectable } from '@nestjs/common';
import { HcService } from '@/modules/hc/hc.service';

@Injectable()
export class UserService {
  constructor(private readonly hcService: HcService) {}

  async createUser(userData: any) {
    try {
      const response = await this.hcService.createUserOnCabinet({
        groupId: '1',
        personCode: 'EMP1234567ABC',
        firstName: 'John',
        lastName: 'Doe',
        gender: 1,
        phone: '+998901234567',
        startDate: new Date(),
        endDate: new Date('2025-12-31'),
      });

      console.log('HC Person ID:', response.data.personId);
      return response;
    } catch (error) {
      console.error('Failed to create user in HC:', error);
      throw error;
    }
  }
}
```

### Adding New HC API Methods

**Step 1:** Add endpoint to `HcApiConfig`:

```typescript
getEndpoints() {
  return {
    person: {
      add: '/person/v1/persons/add',
      list: '/person/v1/persons/list',  // ✅ New endpoint
    },
  };
}
```

**Step 2:** Add method to `HcService`:

```typescript
async listPersons(groupId: string): Promise<HcApiResponse<HcPersonData[]>> {
  const endpoint = this.config.getEndpoints().person.list;

  return this.apiClient.post<HcPersonData[]>({
    endpoint,
    data: { groupId },
  });
}
```

**That's it!** No need to:

- ❌ Duplicate HTTP logic
- ❌ Duplicate error handling
- ❌ Duplicate logging
- ❌ Duplicate validation

---

## 🧪 Testing

### Unit Testing (Easy with SOLID)

```typescript
describe('HcService', () => {
  let service: HcService;
  let mockApiClient: jest.Mocked<HcApiClient>;
  let mockConfig: jest.Mocked<HcApiConfig>;

  beforeEach(() => {
    mockApiClient = {
      post: jest.fn(),
    } as any;

    mockConfig = {
      getEndpoints: jest.fn().mockReturnValue({
        person: { add: '/person/v1/persons/add' },
      }),
    } as any;

    service = new HcService(mockApiClient, mockConfig);
  });

  it('should create user successfully', async () => {
    mockApiClient.post.mockResolvedValue({
      errorCode: '0',
      message: 'Success',
      data: { personId: '12345' },
    });

    const result = await service.createUserOnCabinet({
      /* dto data */
    });

    expect(result.errorCode).toBe('0');
    expect(result.data.personId).toBe('12345');
  });
});
```

---

## 🔍 Error Handling

### HC API Response Structure

```typescript
{
  errorCode: "0" | "CCF038022" | ...,  // "0" = success
  message: "Success" | "Error message",
  data: { ... }                          // Only present on success
}
```

### Error Types

1. **HC API Errors** (errorCode !== "0"):

```json
{
  "message": "HC API returned an error",
  "error": "(startDate format is not correct.){CCF038022}",
  "errorCode": "CCF038022",
  "details": { ... }
}
```

2. **Network Errors**:

```json
{
  "message": "Failed to communicate with HC system",
  "error": "timeout of 10000ms exceeded",
  "details": { ... }
}
```

3. **Configuration Errors**:

```
Error: HC_API_URL environment variable is required
```

---

## 🌟 Benefits of This Architecture

### ✅ Maintainability

- Clear separation of concerns
- Easy to understand code structure
- Single source of truth for configuration

### ✅ Testability

- Easy to mock dependencies
- Unit test without HTTP calls
- Test business logic in isolation

### ✅ Extensibility

- Add new methods in minutes
- No code duplication
- Consistent error handling

### ✅ Reusability

- `HcApiClient` can be reused for any HC API endpoint
- `HcDateFormatter` utility works everywhere
- Configuration centralized

### ✅ Debugging

- Automatic request/response logging
- Detailed error messages
- Easy to trace issues

---

## 🚀 Future Improvements

- [ ] Add caching layer for frequently accessed data
- [ ] Implement retry mechanism for failed requests
- [ ] Add request rate limiting
- [ ] Create HC API response DTOs for type safety
- [ ] Add metrics and monitoring
- [ ] Implement circuit breaker pattern

---

## 📚 References

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [NestJS Best Practices](https://docs.nestjs.com/fundamentals/testing)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
