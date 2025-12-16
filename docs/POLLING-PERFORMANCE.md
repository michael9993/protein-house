# Polling Performance Analysis

## Quick Answer

**Polling CAN hinder performance, but with proper configuration it's usually acceptable for admin dashboards.**

## Performance Impact

### ✅ Acceptable Impact (10-30 second intervals)

For **admin dashboards** like Saleor:

- **Low user count**: Typically 1-10 concurrent admin users
- **Infrequent updates**: Orders don't change every second
- **Acceptable delay**: 10-30 second refresh is fine for order management

**Impact:**

- ~6-12 requests per minute per user
- Minimal server load
- Negligible bandwidth usage
- Good user experience

### ⚠️ Problematic Impact (1-5 second intervals)

**Issues:**

- High server load (60-300 requests/minute per user)
- Unnecessary bandwidth usage
- Battery drain on mobile devices
- Can trigger rate limiting
- Database load increases

### ❌ Critical Impact (Sub-second polling)

**Never do this:**

- Overwhelms server
- Wastes resources
- Poor user experience
- Can cause timeouts/errors

## Current Configuration Analysis

Your current setup:

```typescript
pollInterval: 10000, // 10 seconds
```

**Performance Impact:**

- ✅ **6 requests per minute** per user
- ✅ **Acceptable** for admin dashboard
- ✅ **Low server load** (even with 10 concurrent users = 60 req/min)
- ✅ **Good balance** between freshness and performance

## Optimization Strategies

### 1. Smart Polling (Recommended)

Only poll when tab is visible and user is active:

```typescript
import { useEffect, useState } from "react";

const OrderList = ({ params }: OrderListProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Stop polling when tab is hidden
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Stop polling when user is inactive (no mouse/keyboard for 2 minutes)
    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      setIsActive(true);
      inactivityTimer = setTimeout(() => setIsActive(false), 120000);
    };
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    resetTimer();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      clearTimeout(inactivityTimer);
    };
  }, []);

  const { data } = useOrderListQuery({
    displayLoader: true,
    skip: valueProvider.loading,
    variables: queryVariables,
    pollInterval: isVisible && isActive ? 10000 : 0, // Only poll when active
  });
};
```

**Benefits:**

- ✅ Reduces requests by ~70-90% (when tab hidden/inactive)
- ✅ Saves bandwidth and battery
- ✅ Better for mobile devices

### 2. Adaptive Polling

Increase interval when no changes detected:

```typescript
const [pollInterval, setPollInterval] = useState(10000);
const previousOrderCount = useRef(0);

const { data } = useOrderListQuery({
  displayLoader: true,
  skip: valueProvider.loading,
  variables: queryVariables,
  pollInterval,
  onCompleted: (data) => {
    const currentCount = data?.orders?.edges?.length || 0;

    // If no changes, slow down polling
    if (currentCount === previousOrderCount.current) {
      setPollInterval(30000); // 30 seconds
    } else {
      setPollInterval(10000); // 10 seconds
      previousOrderCount.current = currentCount;
    }
  },
});
```

### 3. Cache-First Strategy

Use Apollo cache to reduce unnecessary requests:

```typescript
const { data } = useOrderListQuery({
  displayLoader: true,
  skip: valueProvider.loading,
  variables: queryVariables,
  pollInterval: 10000,
  fetchPolicy: "cache-and-network", // Use cache, but still fetch in background
  nextFetchPolicy: "cache-first", // Subsequent polls use cache first
});
```

**Benefits:**

- ✅ Faster UI updates (shows cached data immediately)
- ✅ Reduces perceived latency
- ✅ Still gets fresh data in background

### 4. Conditional Polling

Only poll when on specific pages or conditions:

```typescript
const shouldPoll = useMemo(() => {
  // Only poll on order list page, not on details page
  return !params.id && !params.action;
}, [params]);

const { data } = useOrderListQuery({
  displayLoader: true,
  skip: valueProvider.loading,
  variables: queryVariables,
  pollInterval: shouldPoll ? 10000 : 0,
});
```

## Performance Metrics

### Server-Side Impact

**10-second polling (your current setup):**

- Per user: 6 requests/minute
- 10 concurrent users: 60 requests/minute
- Database queries: ~60/minute (with proper indexing, this is negligible)
- Network: ~1-2 KB per request = ~120 KB/minute total

**Comparison:**

- WebSocket: ~1 connection per user (minimal overhead)
- Polling (10s): 6 requests/minute per user
- Polling (5s): 12 requests/minute per user ⚠️
- Polling (1s): 60 requests/minute per user ❌

### Client-Side Impact

**Browser:**

- Memory: Minimal (Apollo cache handles this well)
- CPU: Negligible (React re-renders are optimized)
- Network: ~1-2 KB per poll (very small)

**Mobile devices:**

- Battery: Moderate impact (can be reduced with smart polling)
- Data usage: ~120 KB/minute (acceptable for WiFi, consider for mobile data)

## Best Practices

### ✅ DO:

1. **Use 10-30 second intervals** for admin dashboards
2. **Stop polling when tab is hidden** (saves resources)
3. **Use cache-first strategy** (faster UI, less perceived latency)
4. **Poll only on relevant pages** (not on detail views)
5. **Consider user activity** (pause when inactive)

### ❌ DON'T:

1. **Poll faster than 5 seconds** (unless critical real-time requirement)
2. **Poll on all pages** (only where updates matter)
3. **Poll when tab is hidden** (wastes resources)
4. **Poll during user interactions** (pause during filtering/sorting)
5. **Ignore cache** (always use cache-first when possible)

## When to Use Polling vs WebSockets

### Use Polling When:

- ✅ Admin dashboards (low user count)
- ✅ Updates are infrequent (orders every few minutes)
- ✅ Simple to implement
- ✅ 10+ second refresh is acceptable
- ✅ No real-time requirement

### Use WebSockets When:

- ✅ High user count (100+ concurrent users)
- ✅ Real-time requirement (< 1 second delay)
- ✅ Frequent updates (multiple per second)
- ✅ Customer-facing applications
- ✅ Chat/live features

## Recommended Configuration

For your Saleor dashboard order list:

```typescript
const { data } = useOrderListQuery({
  displayLoader: true,
  skip: valueProvider.loading,
  variables: queryVariables,
  pollInterval: 10000, // 10 seconds - good balance
  fetchPolicy: "cache-and-network", // Fast UI updates
  nextFetchPolicy: "cache-first", // Efficient subsequent polls
  notifyOnNetworkStatusChange: false, // Don't show loader on every poll
});
```

**With smart polling (even better):**

```typescript
const isPageVisible = !document.hidden;
const { data } = useOrderListQuery({
  displayLoader: true,
  skip: valueProvider.loading,
  variables: queryVariables,
  pollInterval: isPageVisible ? 10000 : 0, // Only poll when visible
  fetchPolicy: "cache-and-network",
  nextFetchPolicy: "cache-first",
});
```

## Conclusion

**Your current 10-second polling is fine!**

- ✅ Low performance impact
- ✅ Good user experience
- ✅ Acceptable for admin dashboards
- ✅ Easy to implement

**Consider optimizing with:**

- Smart polling (stop when tab hidden)
- Cache-first strategy
- Conditional polling (only on list pages)

**Don't worry about performance** unless you have:

- 50+ concurrent admin users
- Need for sub-5-second updates
- Mobile data usage concerns
