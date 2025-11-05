# Tab Switch Bug - Detailed Root Cause Analysis

## 🐛 **PROBLEM STATEMENT**

When users switch browser tabs and return to the GymSync Pro application:
1. **Loading screen appears** (spinning loader)
2. **Data resets to zero** (member count, revenue, etc. show 0)
3. **Console shows**: `Auth state changed: "SIGNED_IN" - true`
4. **Site may become unresponsive** until manual page refresh

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **Primary Issue: Multiple Competing Re-render Triggers**

The bug is caused by **THREE simultaneous systems** fighting for control when the tab regains focus:

#### **1. AuthContext Focus Handler (Lines 80-101 in AuthContext.tsx)**

```typescript
const handleFocusOrVisibility = async () => {
  if (!mounted || !initialLoadComplete || !user) return
  
  try {
    // Refresh session tokens on focus/visibility
    await supabase.auth.getSession()
    
    // Optionally refresh profile if session valid
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      console.log('Session expired - signing out')
      setUser(null)
      setLoading(false)  // ⚠️ Sets loading state
    }
  } catch (error) {
    // Keep user logged in on network errors
  }
}

window.addEventListener('focus', handleFocusOrVisibility)
document.addEventListener('visibilitychange', handleVisibilityChange)
```

**What happens:**
- When tab regains focus → triggers `supabase.auth.getSession()`
- This causes Supabase to emit `onAuthStateChange` event with `SIGNED_IN`
- **Even though user was already signed in**, the event fires again
- This is what you see in console: `Auth state changed: "SIGNED_IN" - true`

#### **2. Supabase Auth State Listener (Lines 58-73 in AuthContext.tsx)**

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (!mounted) return
  
  // Only log significant auth events (reduce spam)
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    console.log('Auth state changed:', event, !!session)  // ← YOUR CONSOLE LOG
  }
  
  // Only handle actual auth changes, not token refreshes
  if (event === 'SIGNED_IN' && session?.user) {
    await getProfile(false) // ⚠️ Shows loading for actual sign-in
  } else if (event === 'SIGNED_OUT') {
    setUser(null)
    setLoading(false)
  }
  // TOKEN_REFRESHED: silently keep current state
})
```

**The problem:**
- When `getSession()` is called in step 1, it triggers `SIGNED_IN` event
- Even though code says "Only handle actual auth changes", it can't distinguish between:
  - **Real sign-in** (user just logged in)
  - **Focus-triggered session refresh** (user just returned to tab)
- The condition `event === 'SIGNED_IN' && session?.user` is TRUE in both cases
- So it calls `getProfile(false)` which sets `setLoading(true)`

#### **3. useFocusRehydration Hook (Lines 327-362 in useOptimizedData.ts)**

```typescript
export function useFocusRehydration(gymId: string | null) {
  const queryClient = useQueryClient()
  
  React.useEffect(() => {
    const handleRehydrate = async () => {
      // Always refresh auth session first
      await supabase.auth.getSession()  // ⚠️ ALSO calls getSession!
      
      // Only refetch queries if gymId is available
      if (!gymId) {
        console.log('⏭️ Skip focus rehydration - no gymId yet')
        return
      }
      
      // Refetch all queries with valid prerequisites
      await Promise.allSettled([
        queryClient.refetchQueries({ queryKey: ['members', gymId] }),
        queryClient.refetchQueries({ queryKey: ['staff', gymId] }),
        queryClient.refetchQueries({ queryKey: ['equipment', gymId] }),
        queryClient.refetchQueries({ queryKey: ['payments', gymId] }),
        queryClient.refetchQueries({ queryKey: ['expenses', gymId] }),
      ])
    }
    
    window.addEventListener('focus', handleRehydrate)
    document.addEventListener('visibilitychange', handleVisibility)
  }, [gymId, queryClient])
}
```

**The problem:**
- **DUPLICATE** session refresh - both AuthContext AND this hook call `getSession()`
- Triggers **multiple refetch operations** on all queries simultaneously
- Each refetch temporarily sets query state to "fetching"

#### **4. React Query Global Config (Lines 3-22 in queryClient.ts)**

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,  // ✅ Disabled (good)
      refetchOnReconnect: true,
      refetchOnMount: 'always',  // ⚠️ ALWAYS refetch on mount
    },
  },
})
```

**The problem:**
- `refetchOnMount: 'always'` means EVERY component mount triggers a refetch
- When `getProfile()` sets loading state, components may unmount/remount
- This triggers additional refetches

---

## 📊 **EVENT SEQUENCE TIMELINE**

Here's what happens in **chronological order** when you switch tabs:

```
USER ACTION: Switches to YouTube tab
└─> Browser tab becomes inactive
    └─> No immediate effect (good)

USER ACTION: Returns to GymSync tab
└─> Browser tab becomes active
    ├─> 🔄 AuthContext.handleFocusOrVisibility() fires
    │   └─> Calls supabase.auth.getSession()
    │       └─> Supabase emits onAuthStateChange('SIGNED_IN')
    │           └─> YOUR CONSOLE LOG: "Auth state changed: SIGNED_IN true"
    │           └─> Calls getProfile(false)
    │               └─> Sets setLoading(true) ⚠️
    │                   └─> Components see loading=true
    │                       └─> Show loading spinner 🔄
    │
    ├─> 🔄 useFocusRehydration.handleRehydrate() fires
    │   ├─> Calls supabase.auth.getSession() (DUPLICATE!)
    │   └─> Calls queryClient.refetchQueries() for ALL data
    │       ├─> members refetch starts → isPending=true initially
    │       ├─> staff refetch starts → isPending=true initially
    │       ├─> equipment refetch starts → isPending=true initially
    │       ├─> payments refetch starts → isPending=true initially
    │       └─> expenses refetch starts → isPending=true initially
    │
    └─> 🔄 React Query detects component mounts
        └─> refetchOnMount: 'always' triggers MORE refetches
            └─> Data temporarily cleared during fetch
                └─> UI shows 0 values ⚠️

RACE CONDITION:
├─> If getProfile() finishes first:
│   └─> Components re-render with loading=false
│       └─> But queries still fetching → data=[] → shows zeros
│
└─> If queries finish first:
    └─> Components still show loading=true
        └─> User sees loading spinner even with data ready
```

---

## 🎯 **WHY YOU SEE THESE SYMPTOMS**

### **Symptom 1: Loading Screen Appears**

**Cause:** `AuthContext.getProfile(false)` sets `setLoading(true)`
- This happens because `onAuthStateChange('SIGNED_IN')` can't tell the difference between:
  - User just logged in (should show loading)
  - User just switched tabs back (should NOT show loading)

**Code location:** `src/contexts/AuthContext.tsx:67-69`
```typescript
if (event === 'SIGNED_IN' && session?.user) {
  await getProfile(false) // Shows loading spinner
}
```

### **Symptom 2: Data Shows Zero**

**Cause:** React Query refetches triggered by `useFocusRehydration`
- During refetch, there's a brief moment where:
  - Old data is cleared
  - New data hasn't arrived yet
  - Components read `data = []`
  - UI displays 0 members, $0 revenue, etc.

**Code location:** `src/hooks/useOptimizedData.ts:342-348`
```typescript
await Promise.allSettled([
  queryClient.refetchQueries({ queryKey: ['members', gymId] }),
  // ... all other queries
])
```

### **Symptom 3: Console Shows "Auth state changed"**

**Cause:** Intentional logging in `onAuthStateChange` listener
- This log fires EVERY time Supabase emits an auth event
- Including when `getSession()` is called (even if already signed in)

**Code location:** `src/contexts/AuthContext.tsx:62-64`
```typescript
if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
  console.log('Auth state changed:', event, !!session)
}
```

### **Symptom 4: Site Becomes Unresponsive**

**Cause:** Too many simultaneous operations
- `useFocusRehydration` triggers 5+ queries at once
- Each query does Supabase API calls
- `useMembers` also fetches payment data for EACH member (nested queries)
- Browser overwhelmed with concurrent requests

**Code location:** `src/hooks/useOptimizedData.ts:30-48`
```typescript
const membersWithPayments = await Promise.all(
  (data || []).map(async (member) => {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('member_id', member.id)  // ← N+1 query problem!
```

---

## 🧪 **HOW TO VERIFY THIS IS THE ISSUE**

### **Test 1: Disable useFocusRehydration**
Comment out the hook in `dashboard/page.tsx:36`:
```typescript
// useFocusRehydration(gymId)  // ← Disable this
```

**Expected result:** Loading screen might still appear, but data won't reset to zero.

### **Test 2: Prevent SIGNED_IN from triggering getProfile**
Modify `AuthContext.tsx:67` to ignore focus-triggered events:
```typescript
if (event === 'SIGNED_IN' && session?.user && !user) {
  // Only run if user is null (real sign-in, not focus event)
  await getProfile(false)
}
```

**Expected result:** Loading screen won't appear on tab switch.

### **Test 3: Check Network Tab**
Open Chrome DevTools → Network tab → switch tabs → return

**Look for:**
- Multiple requests to `/auth/v1/token?grant_type=refresh_token`
- Multiple requests to Supabase REST API
- Requests happening simultaneously

---

## 🔧 **TECHNICAL DEBT & DESIGN FLAWS**

### **1. Overuse of Focus Events**
- **THREE separate systems** listening to window focus
- Each independently calls `getSession()` or triggers refetches
- No coordination between them

### **2. Auth Event Overloading**
- `SIGNED_IN` event used for both:
  - Real authentication (user login)
  - Session refresh (token refresh, focus events)
- No way to distinguish intent

### **3. Aggressive Refetch Strategy**
- `refetchOnMount: 'always'` forces refetch even with fresh cache
- `useFocusRehydration` manually refetches everything
- No consideration for `staleTime` (data is fresh for 5min but still refetched)

### **4. N+1 Query Problem**
- `useMembers` fetches payments for EACH member individually
- If you have 50 members → 1 members query + 50 payment queries
- When refetch happens, all 51 queries fire again

### **5. Loading State Conflicts**
- `isPending` only checks if query has NO data
- But during refetch, query HAS data (cached), so `isPending=false`
- However, `isLoading` would be true (fetching)
- Components think data is loaded, but it's actually being refetched
- Causes flickering and zero values

---

## 📋 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SWITCHES TABS                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │   Browser Tab Becomes Active      │
        └───────────────┬───────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────┐          ┌─────────────────────┐
│ AuthContext      │          │ useFocusRehydration │
│ Focus Handler    │          │ Hook                │
└────────┬─────────┘          └──────────┬──────────┘
         │                               │
         │ supabase.auth.getSession()    │ supabase.auth.getSession()
         │                               │
         ▼                               ▼
┌─────────────────────────────────────────────────────┐
│          Supabase Auth State Listener               │
│   onAuthStateChange('SIGNED_IN', session)           │
└───────────────────┬─────────────────────────────────┘
                    │
      ┌─────────────┴──────────────┐
      │                             │
      ▼                             ▼
┌──────────────┐          ┌─────────────────────┐
│ getProfile() │          │ queryClient         │
│ STARTS       │          │ .refetchQueries()   │
└──────┬───────┘          └──────────┬──────────┘
       │                             │
       │ setLoading(true)            │ Refetch all data
       │                             │
       ▼                             ▼
┌─────────────────────────────────────────────────────┐
│            Components Re-render                      │
│  ┌──────────────────────────────────────┐          │
│  │ loading=true → Show Loading Spinner  │          │
│  └──────────────────────────────────────┘          │
│  ┌──────────────────────────────────────┐          │
│  │ data=[] during refetch → Show Zeros  │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 **SOLUTION REQUIREMENTS**

Any fix must address ALL of these issues:

1. ✅ **Prevent duplicate `getSession()` calls** when tab gains focus
2. ✅ **Distinguish between real sign-in and focus-triggered events**
3. ✅ **Don't set `loading=true` during focus-triggered auth events**
4. ✅ **Don't show zero values during background refetch**
5. ✅ **Coordinate refetch behavior** across AuthContext and React Query
6. ✅ **Respect cache freshness** (don't refetch if data is less than 5min old)
7. ✅ **Optimize payment queries** to avoid N+1 problem (separate issue)

---

## 📝 **RECOMMENDATIONS FOR AI SOLUTION**

When implementing a fix, consider these approaches:

### **Option 1: Remove Redundant Focus Handlers**
- Keep ONLY `useFocusRehydration` for data refresh
- Remove focus handling from `AuthContext` (auth tokens refresh automatically)
- Modify `onAuthStateChange` to ignore session refresh events

### **Option 2: Smart Loading State Management**
- Use `isFetching && !data` instead of just `isPending`
- Only show loading when there's NO data AND actively fetching
- Keep cached data visible during background refetch

### **Option 3: Debounce Focus Events**
- Add debounce to focus handlers (wait 1-2 seconds)
- Prevents multiple handlers from firing simultaneously
- User won't notice slight delay

### **Option 4: Respect staleTime**
- Check if data is fresh before refetching
- Don't refetch if last fetch was less than `staleTime` ago
- Use React Query's built-in staleness tracking

---

## 🔍 **FILES TO INVESTIGATE FURTHER**

1. **`src/contexts/AuthContext.tsx`** (Lines 58-101)
   - Auth state listener logic
   - Focus/visibility handlers
   - `getProfile()` function

2. **`src/hooks/useOptimizedData.ts`** (Lines 327-362)
   - `useFocusRehydration` hook
   - Query refetch logic

3. **`src/lib/queryClient.ts`** (Lines 3-22)
   - React Query global configuration
   - `refetchOnMount` setting

4. **`src/app/dashboard/page.tsx`** (Lines 20-90)
   - How `isPending` is used
   - Stats calculation logic

5. **`src/hooks/useGymContext.ts`** (Entire file)
   - Gym fetching logic
   - Dependency on `user?.id`

---

## 📊 **PERFORMANCE IMPACT**

Current system makes these API calls on EVERY tab switch:

```
1x supabase.auth.getSession() (from AuthContext)
1x supabase.auth.getSession() (from useFocusRehydration) ← DUPLICATE
1x supabase.auth.getUser() (from AuthContext)
1x GET /gyms (from useGymContext)
1x GET /members (from useMembers)
50x GET /payments (N+1 problem if 50 members)
1x GET /staff_details
1x GET /equipment
1x GET /payments
1x GET /expenses (via API)
1x GET /membership_plans

TOTAL: ~58 API requests per tab switch
```

**This is why the site becomes unresponsive!**

---

## ✅ **CONCLUSION**

The loading screen and zero data issue is caused by:

1. **Multiple redundant focus handlers** competing for control
2. **Auth event system unable to distinguish** between real login and session refresh
3. **React Query refetching everything** even when data is fresh
4. **Loading state conflicts** between auth loading and query pending states
5. **Performance bottleneck** from too many simultaneous queries

The fix requires **coordinating these systems** rather than having them operate independently.

---

**Generated:** November 5, 2025  
**Research By:** GitHub Copilot  
**For:** GymSync Pro Tab Switch Bug Investigation
