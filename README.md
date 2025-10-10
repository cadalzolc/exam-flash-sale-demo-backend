# Flash-Sale Backend

## 🎯 System Overview
A high-concurrency flash sale system built with NestJS, BullMQ, Redis, and PostgreSQL designed to handle thousands of simultaneous purchase requests while preventing overselling and maintaining data consistency.

## 🏗️ Architecture Design Choices

- Layered Architecture with Queue Processing
  - Choice:
    - API → Redis Reservation → Database → Queue Processing
  - Why:
      - Immediate Response: Users get instant feedback ("Processing")
      - Load Decoupling: HTTP layer offloads heavy processing to queues
      - Scalability: Queue workers can scale independently
      - Resilience: Failed purchases can be retried or handled gracefully
  - Trade-off:
    - Added complexity vs simple synchronous processing
        
- Redis for Stock Management
  - Choice:
    - Redis atomic operations for initial stock reservation
  - Why:
    - Atomic Operations: reserveStockAtomic uses Redis transactions
    - Performance: Sub-millisecond stock checks
    - Prevents Over-creation: Stops purchase record creation when stock exhausted
    - Real-time Updates: Live stock counter for UI
  - Trade-off:
    - Eventually consistent with DB (handled via synchronization)

- Database as Source of Truth
  - Choice:
    - PostgreSQL with Prisma for final stock validation
  - Why:
    - ACID Compliance: Database transactions ensure consistency
    - Data Integrity: Foreign keys, constraints prevent data corruption
    - Persistence: Survives restarts unlike in-memory solutions
    - Complex Queries: Easy reporting and analytics
  - Trade-off:
    - Slower than Redis but more reliable
    
- BullMQ for Queue Processing
  - Choice:
    - BullMQ over other queue systems
  - Why:
    - Redis-backed: Leverages existing Redis infrastructure
    - NestJS Integration: First-class support with @nestjs/bullmq
    - Retry Logic: Built-in job retries with exponential backoff
    - Monitoring: Built-in dashboard and metrics
    - Concurrency Control: Configurable worker concurrency
  - Trade-off:
    - Redis dependency vs message broker like RabbitMQ
 
---


## 🏗️ System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile App]
    end

    subgraph "API Layer"
        C[NestJS API Gateway]
        D[WebSocket Gateway]
    end

    subgraph "Queue Layer"
        E[BullMQ Queue]
        F[Purchase Workers]
    end

    subgraph "Cache Layer"
        G[Redis Cache]
        H[Stock Management]
    end

    subgraph "Data Layer"
        I[PostgreSQL Database]
    end

    %% Connections
    A --> C
    B --> C
    C --> G
    C --> E
    D --> A
    D --> B
    E --> F
    F --> I
    F --> G
    F --> D
    G --> H
```

## Data Flow Sequence
```mermaid
sequenceDiagram
    participant User
    participant API as NestJS API
    participant Redis
    participant DB as PostgreSQL
    participant Queue as BullMQ Queue
    participant Worker as Queue Worker
    participant WS as WebSocket

    User->>API: Purchase Request
    API->>Redis: reserveStockAtomic()
    Redis-->>API: Stock Reserved?
    
    alt Stock Available
        API->>DB: Create Purchase (PENDING)
        API->>Queue: Add to Purchase Queue
        API-->>User: "Processing Your Order"
        API->>WS: Emit "PROCESSING"
        
        Queue->>Worker: Process Purchase
        Worker->>DB: Transaction - Update Stock
        Worker->>Redis: Sync Stock Value
        Worker->>WS: Emit "COMPLETED"
        
    else No Stock
        API-->>User: "Out of Stock"
    end
```
## 🏗️ Component Architecture
```mermaid
graph LR
    subgraph "Presentation Layer"
        A[React Frontend]
        B[Socket.IO Client]
    end

    subgraph "Application Layer"
        C[Purchase Controller]
        D[WebSocket Gateway]
        E[Queue Consumer]
    end

    subgraph "Business Layer"
        F[Purchase Service]
        G[Redis Service]
        H[Queue Service]
    end

    subgraph "Infrastructure Layer"
        I[PostgreSQL]
        J[Redis]
        K[BullMQ]
    end

    A --> C
    B --> D
    C --> F
    F --> G
    F --> H
    G --> J
    H --> K
    E --> F
    D --> B
    F --> I
```

## ⚡ Concurrency Handling
```mermaid
graph TD
    A[100 Concurrent Requests] --> B[Redis Stock Reservation]
    
    B --> C[25 Successful Reservations]
    B --> D[75 Failed - No Stock]
    
    C --> E[Create 25 PENDING Purchases]
    C --> F[Add 25 Queue Jobs]
    
    E --> G[Database]
    F --> H[Queue Processing]
    
    H --> I[25 COMPLETED Purchases]
    H --> J[Sync Redis Stock to 0]
    
    I --> K[Final State: 25 Sales]
    J --> L[Stock: Redis=0, DB=0]
```

## 📝 Project setup

```bash
# Install Packages
npm install # or yarn

# Run the project
npm run dev # or yarn dev

# Build the project
npm run build # or yarn build
```

---

### Running the Stress Tests
```bash
# stress
npm run test:stress #or yarn test:stress
```

```yaml
✅ Stress Test Results:
- Requests Count: 100
- Failed/Out of Stock: 30-40 (correctly rejected)
- Order Processed: 50-70 (Redis reservations)
- Order Success: 25 (EXACTLY - no overselling)
- Stock-Redis: 0 (perfect sync)
- Stock-DB: 0 (perfect sync)
- Sold: 25 (Match with assigned task)
```

### Other test
```bash
# promo
npm run test:promo #or yarn test:promo

# purchase
npm run test:purchase #or yarn test:purchase

# integration
npm run test:integration #or yarn test:integration
```
