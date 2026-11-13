# AGENTS.md: Frontend architecture

This project combines **Feature-Sliced Design (FSD)** with a **five-layer feature architecture**.

- **FSD decides where code lives:** which layer and which slice.
- **The five layers decide what each piece of code may do:** view, use case, repository, services, adapter.

Read this file before writing or changing code. If a task doesn't fit these rules, or the rules seem to conflict, stop and explain the problem instead of guessing. Don't restructure unrelated code to fit the architecture unless the task asks for it.

---

## 1. Stack

Adjust this section to the project.

| Concern           | Tool                                                           |
| ----------------- | -------------------------------------------------------------- |
| UI                | React, TypeScript (strict)                                     |
| Server state      | TanStack Query (React Query), inside repositories only         |
| Client state      | Zustand, inside repositories only                              |
| Unit tests        | Vitest                                                         |
| Integration tests | React Testing Library, with a fake API (for example MSW)       |
| End-to-end tests  | Playwright                                                     |
| Architecture lint | Steiger (FSD rules) and a boundaries lint rule (segment rules) |

---

## 2. Folder structure

```
src/
  app/                 Providers, routing, global setup. None of the five layers.
  pages/
    <page>/            One slice per route (pages first)
      ui/              View
      use-cases/       Page-specific journeys
      services/        Page-only business rules (if any)
      repository/      Only if no other slice uses this data yet
      adapter/         Only if no other slice uses this data yet
      index.ts         Public API
  widgets/
    <widget>/          Large blocks that combine features
      ui/
      use-cases/
      index.ts
  features/
    <feature>/         Reusable user actions (used by 2+ pages or widgets)
      ui/
      use-cases/
      services/        Feature-specific business rules
      repository/      Only if the feature owns data nobody else uses
      adapter/         Only if the feature owns data nobody else uses
      index.ts
  entities/
    <entity>/          Business objects (domain data and domain rules)
      ui/              Presentational components only
      repository/
      services/
      adapter/
      types/           Domain types
      index.ts
  shared/              No business knowledge at all. No slices.
    ui/                Design system components
    api/               HTTP and WebSocket clients, interceptors
    lib/               Generic helpers (formatting, dates, units)
    config/
e2e/                   Playwright tests, organised by critical flow
```

Naming:

- Slices use kebab-case: `place-order`, `order-history`.
- Segments use exactly these names: `ui`, `use-cases`, `repository`, `services`, `adapter`, `types`, plus `lib` and `config` in `shared`.
- Do **not** create an FSD `model` segment. FSD's `model` mixes state and business rules; here they are split into `repository` and `services`. Domain types go in `types`.
- Do **not** use generic folders like `components/`, `hooks/`, `utils/` or `helpers/` inside slices.

---

## 3. FSD rules (between slices)

1. **Imports only point to lower layers:** `app` → `pages` → `widgets` → `features` → `entities` → `shared`. Never sideways, never upward.
2. **Import a slice only through its `index.ts`.** No deep imports like `@/entities/order/services/orderValidation`.
3. **No imports between slices on the same layer.** A feature never imports another feature. Combine them in a higher layer instead.
4. **Entities may reference each other only through FSD's `@x` notation**, and sparingly. Frequent `@x` use means an entity boundary is wrong; raise it instead of adding more.
5. **No segment-level index files** (no `services/index.ts`). Each slice has one `index.ts`.
6. **`index.ts` exports only what other slices need.** Never export an adapter.
7. **Pages first:** put new code in the page that uses it. Move it down to a feature or entity only when a second consumer needs it.
8. **`shared` has no business knowledge.** If code mentions a domain concept (order, user, invoice), it does not belong in `shared`.

---

## 4. The five layers (inside a slice)

| Layer      | Folder        | Responsibility                                                                                                                                                                                                   | Contains business logic?                                            |
| ---------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| View       | `ui/`         | Renders UI and passes user actions on                                                                                                                                                                            | No                                                                  |
| Use case   | `use-cases/`  | Entry point for a user journey. Orchestrates services and repositories and builds a **view model** for the view                                                                                                  | No, integration code only                                           |
| Repository | `repository/` | Owns app state for its data (React Query for server state, Zustand for client state). Gives consumers one consistent API. Decides when data is stale and fetches it through the adapter                          | No, integration code only                                           |
| Services   | `services/`   | Business logic. **Domain services** hold pure rules; **application services** combine rules with side effects (notifications, analytics, retries) through dependencies passed in. See section 8                  | **Yes**                                                             |
| Adapter    | `adapter/`    | The **only** code that talks to the outside world: backend APIs, WebSockets, `localStorage`, `sessionStorage`, third-party SDKs and services. Knows endpoints and external formats and maps them to domain types | **Yes**, logic tied to the external system (mapping, request rules) |

### Allowed calls

Calls only go **down**. Nothing calls upward.

| From                           | May call                                                                                     | Must never call                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| View (needs data or behaviour) | Its own slice's use case; presentational components from its own or lower layers             | Repositories, services, adapters, stores, `fetch`          |
| View (presentational)          | Nothing. Receives props and callbacks only                                                   | Any hook that reads data or stores                         |
| Use case                       | Services and repositories (own slice or lower layers via `index.ts`)                         | Adapters directly, other use cases on the same layer       |
| Repository                     | Its adapter; services                                                                        | Use cases, views                                           |
| Services                       | Other services, domain types; side effects only through dependencies passed in as parameters | Importing repositories, adapters, React or stores directly |
| Adapter                        | `shared/api`, browser storage APIs, third-party SDKs, domain types                           | Everything above it                                        |

### Presentational components

- A component that only receives props and renders them **does not need a use case**.
- Local UI state that nobody else cares about (a dropdown is open, a tab is selected) can stay in `useState` inside the component.
- As soon as a component needs server data, shared state or a side effect, it must get it from a use case, through a parent view's props or by calling its own slice's use case.

---

## 5. Where does new code go?

Answer these in order:

1. **Does it talk to anything outside the app** (API, WebSocket, storage, third-party SDK)? → `adapter/` of the slice that owns that data.
2. **Is it a business rule** (validation, permissions, calculations, deadlines)? → `services/` of the slice that owns the concept the rule is about.
3. **Does it hold or cache state, or decide when to refetch?** → `repository/`.
4. **Does it coordinate a user journey** (combine data, call rules, prepare what a screen shows)? → `use-cases/`.
5. **Does it render something?** → `ui/`.
6. **Is it generic, with no business meaning** (unit conversion, date formatting, a design-system button)? → `shared/`.

Which slice?

- Only one page uses it → that **page**.
- A reusable user action used by 2+ pages or widgets → a **feature**.
- Domain data or a domain rule needed by 2+ features → an **entity**.

---

## 6. Sharing logic between slices

When two slices need the same thing, decide in this order:

1. **Domain rule or domain data → move it down to an entity.** Both slices import it from the entity's `index.ts`.
2. **Two entities need the same rule → look for a missing concept.** For example, a deadline rule used by both `order` and `delivery` may belong in a new `time-slot` entity. Do not copy the rule into both.
3. **Coordination between features → a use case in a higher layer** (widget or page) that calls both features' public APIs.
4. **Generic, no business meaning → `shared/lib`.**
5. **"After X happens, Y must update"** (for example, invalidate another entity's queries) → do it in the **use case** that performs X, which may import both entities. Do not import one entity's repository from another entity. Do not add a global event bus.

Adapters are never shared outside their slice. Other slices go through the owning slice's repository.

---

## 7. State management

- **Server state:** TanStack Query, only inside repositories. Query keys are defined next to the repository that owns them.
- **Client state:** Zustand, only inside repositories. Views and use cases never import a store directly.
- **Persisted client state:** if a Zustand store uses `persist`, pass it a custom storage built on a storage adapter. Never let `persist` write to `localStorage` directly.
- **Local UI state:** `useState` in the component, only when nothing else needs it.
- Use cases return a **view model**: plain data shaped for the screen (labels, flags like `canSubmit`, formatted values) plus action functions. Views should not need to transform data.

---

## 8. Services

Services are where the business logic lives. Use cases and repositories coordinate; services decide.

### 8.1 Two kinds of service

| Kind                    | What it does                                                                                                                                                                                                 | Rules                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Domain service**      | Pure business rules: validation, permissions, calculations, deadlines. Example: `canSubmitOrder(order, now)`                                                                                                 | Pure functions only. Data in, result out. No side effects at all                                                                                                   |
| **Application service** | Application logic that combines domain rules with side effects, such as sending a notification, tracking an analytics event, retrying, or deciding what to persist. Example: `completeCheckout(order, deps)` | Side effects happen **only through dependencies passed in** (functions or objects given as parameters). Never imports a repository, adapter, store or SDK directly |

Passing dependencies in keeps services testable and keeps the call direction intact: the use case or repository that calls an application service hands it what it needs.

```ts
// features/checkout/services/completeCheckout.ts
import { canSubmitOrder, type Order } from '@/entities/order';

type Deps = {
  submit: (orderId: string) => Promise<Order>;
  notify: (message: string) => void;
  track: (event: string, data: Record<string, unknown>) => void;
};

export async function completeCheckout(order: Order, now: Date, deps: Deps) {
  const check = canSubmitOrder(order, now);
  if (!check.ok) return check;

  const submitted = await deps.submit(order.id);
  deps.notify('Order submitted');
  deps.track('order_submitted', { total: submitted.total });
  return { ok: true as const, order: submitted };
}
```

The use case calls it with real dependencies (from the repository and shared notification helpers); tests call it with fakes.

### 8.2 File organisation

- **One file per business concept**, not one file per function and not one big `services.ts`. Example:
  ```
  entities/order/services/
    orderSubmission.ts        canSubmitOrder, isPastDeadline
    orderSubmission.test.ts
    orderPricing.ts           calculateTotal, applyDiscount
    orderPricing.test.ts
  ```
- If you can't describe a file in a few words ("order submission rules"), it holds more than one concept: split it.
- Tests sit next to the file they test.
- No `services/index.ts`. Export what other slices need from the slice's `index.ts`.

### 8.3 Writing services

- **Never read the clock or randomness inside a service.** Pass them in: `isPastDeadline(order, now)`, not `Date.now()` inside the function. The calling use case supplies `new Date()`.
- **Naming:** `isX`, `canX`, `hasX` for checks; `calculateX`, `toX` for derivations; `validateX` for combined checks that return a result object; verb phrases like `completeCheckout` for application services.
- **Return results, don't throw, for expected business outcomes.** Use a result type such as `{ ok: true } | { ok: false; reason: 'past-deadline' }`, so callers and view models can show the reason. Throw only for programming errors.
- **Prefer configuration from the API or shared config over hard-coded values** for limits, thresholds and deadline offsets, so frontend and backend apply the same rule. The backend still enforces every rule; frontend rules exist for a good user experience.

### 8.4 Ownership: one rule, one owner

Every business rule has **exactly one owner**: the slice whose concept the rule is about. Other slices use it; they never re-implement it.

Where a rule belongs:

| Situation                                                          | Where the rule goes                                                                                                                                            |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Only one page or feature uses it                                   | That page's or feature's `services/`                                                                                                                           |
| Two or more features need it                                       | Down to the entity whose concept it is about                                                                                                                   |
| Two entities need it                                               | Usually a **missing concept**: create a small entity that owns it (for example a deadline rule used by `order` and `delivery` belongs in a `time-slot` entity) |
| It has no business meaning (unit conversion, rounding, date maths) | `shared/lib`                                                                                                                                                   |

Timing:

- Small duplication is acceptable until a second consumer actually needs the code (pages first).
- **Exception:** rules with legal, financial or safety impact (deadlines, limits, prices, permissions) must have a single owner from the start. Two slightly different copies means users see different answers on different screens.

### 8.5 Preventing duplicated business logic

Before writing any new rule:

1. **Search for it.** Search by the naming patterns above (`canSubmit`, `isPast`, `calculate…`) and by the domain words involved.
2. **Check the owning entity's README**, which lists the rules that entity owns.
3. **If a similar rule exists elsewhere, don't copy it.** Reuse it from its owner, or move it down to the right owner (section 6) in the same change.
4. **If two existing rules overlap, raise it** in the pull request instead of adding a third version.

Safety nets:

- Each entity's README has a short "Rules owned" list. Update it when you add or move a rule.
- A copy-paste detector (for example jscpd) runs in CI. It catches copied code, but not the same rule written two different ways, so the search above still matters.
- Code review asks one question for every new service: **"Does this rule already exist, and who owns it?"**

### 8.6 Testing services

- **Domain services:** plain unit tests with no mocks. Cover the edge cases, especially around boundaries (exactly at the deadline, exactly at the limit).
- **Application services:** unit tests with fake dependencies. Assert both the result and which side effects were called, with what.

---

## 9. Adapter conventions

- The **only** place allowed to use `fetch`, the HTTP or WebSocket client, `localStorage`, `sessionStorage`, `indexedDB`, or a third-party SDK.
- Maps external formats (DTOs) to domain types from `types/`. Nothing above the adapter sees a DTO.
- One adapter per external system per slice (for example `orderApiAdapter.ts`, `orderDraftStorageAdapter.ts`).
- Never exported from the slice's `index.ts`.
- Changing a backend endpoint, field name or storage key should only require changing the adapter.

---

## 10. Testing

Test each layer with the kind of test that fits it.

| Layer                        | Test type                                      | What to test                                                                                                                                                   |
| ---------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Services                     | Unit (Vitest)                                  | Every business rule, including edge cases. Domain services without mocks; application services with fake dependencies (section 8.6). Most unit tests live here |
| Adapters                     | Unit (Vitest)                                  | Mapping against **saved copies of real responses** (fixtures next to the adapter), so a format change fails a test                                             |
| Use case + repository + view | Integration (React Testing Library + fake API) | That the journey works on key screens: "submitting the form shows the confirmation"                                                                            |
| Critical flows               | End-to-end (Playwright, in `e2e/`)             | Only flows where failure stops users from doing their core work or costs money                                                                                 |

- Do **not** write isolated unit tests for use cases or repositories with everything mocked; they mostly test the mocks. Cover them with integration tests.
- Do **not** add Playwright tests for non-critical screens.
- Test files sit next to the code: `orderValidation.test.ts` beside `orderValidation.ts`.

---

## 11. Example: one journey through all layers

Illustrative only. The example uses an `order` entity and a `submit-order` feature.

```ts
// entities/order/types/order.ts
export type Order = { id: string; total: number; status: 'open' | 'submitted'; deadline: Date };
```

```ts
// entities/order/adapter/orderApiAdapter.ts
import { http } from '@/shared/api';
import type { Order } from '../types/order';

type OrderDto = { order_id: string; total_cents: number; state: 'OPEN' | 'SUBMITTED'; deadline_utc: string };

const toOrder = (dto: OrderDto): Order => ({
  id: dto.order_id,
  total: dto.total_cents / 100,
  status: dto.state === 'SUBMITTED' ? 'submitted' : 'open',
  deadline: new Date(dto.deadline_utc),
});

export const orderApiAdapter = {
  async getById(id: string): Promise<Order> {
    return toOrder(await http.get<OrderDto>(`/orders/${id}`));
  },
  async submit(id: string): Promise<Order> {
    return toOrder(await http.post<OrderDto>(`/orders/${id}/submit`));
  },
};
```

```ts
// entities/order/services/orderSubmission.ts
import type { Order } from '../types/order';

export type SubmitCheck = { ok: true } | { ok: false; reason: 'already-submitted' | 'past-deadline' };

export function canSubmitOrder(order: Order, now: Date): SubmitCheck {
  if (order.status === 'submitted') return { ok: false, reason: 'already-submitted' };
  if (now >= order.deadline) return { ok: false, reason: 'past-deadline' };
  return { ok: true };
}
```

```ts
// entities/order/repository/useOrderRepository.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApiAdapter } from '../adapter/orderApiAdapter';

export const orderKeys = { detail: (id: string) => ['order', id] as const };

export function useOrderRepository(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: orderKeys.detail(id), queryFn: () => orderApiAdapter.getById(id) });
  const submitMutation = useMutation({
    mutationFn: () => orderApiAdapter.submit(id),
    onSuccess: (order) => queryClient.setQueryData(orderKeys.detail(id), order),
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    submit: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
  };
}
```

```ts
// entities/order/index.ts
export type { Order } from './types/order';
export { useOrderRepository } from './repository/useOrderRepository';
export { canSubmitOrder } from './services/orderSubmission';
// The adapter is intentionally not exported.
```

```ts
// features/submit-order/use-cases/useSubmitOrder.ts
import { canSubmitOrder, useOrderRepository } from '@/entities/order';

export function useSubmitOrder(orderId: string) {
  const { order, isLoading, submit, isSubmitting } = useOrderRepository(orderId);
  const check = order ? canSubmitOrder(order, new Date()) : null;

  return {
    viewModel: {
      isLoading,
      isSubmitting,
      canSubmit: check?.ok === true && !isSubmitting,
      blockedReason: check && !check.ok ? check.reason : null,
    },
    submit: () => (check?.ok ? submit() : Promise.resolve()),
  };
}
```

```tsx
// features/submit-order/ui/SubmitOrderButton.tsx
import { Button } from '@/shared/ui';
import { useSubmitOrder } from '../use-cases/useSubmitOrder';

export function SubmitOrderButton({ orderId }: { orderId: string }) {
  const { viewModel, submit } = useSubmitOrder(orderId);
  return (
    <Button disabled={!viewModel.canSubmit} onClick={submit}>
      {viewModel.isSubmitting ? 'Submitting…' : 'Submit order'}
    </Button>
  );
}
```

---

## 12. Forbidden patterns

| Don't                                                                                  | Do instead                                                                   |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `fetch`, HTTP client or `localStorage` in a component, use case, repository or service | Put it in an adapter                                                         |
| A component importing a repository, store or service                                   | Call the slice's use case                                                    |
| A presentational component adding a data hook "just for one value"                     | Pass the value down from the view's view model                               |
| Business rules inside a use case or repository                                         | Move them to `services/`                                                     |
| `Date.now()` or `Math.random()` inside a service                                       | Pass `now` or the value in as a parameter                                    |
| A service importing a repository, adapter, store or SDK                                | Pass the side effect in as a dependency (section 8.1)                        |
| Throwing errors for expected business outcomes                                         | Return a result object with a reason                                         |
| A `services.ts` file holding unrelated rules                                           | One file per business concept (section 8.2)                                  |
| A feature importing another feature                                                    | Move shared logic to an entity, or combine them in a widget or page use case |
| Deep imports into a slice                                                              | Import from the slice's `index.ts`                                           |
| Exporting an adapter                                                                   | Expose data through the repository                                           |
| A `model/`, `components/`, `hooks/` or `utils/` folder in a slice                      | Use the segment names in section 2                                           |
| Domain code in `shared/`                                                               | Put it in the entity or feature that owns the concept                        |
| Copying a business rule into a second slice                                            | Find its owner and reuse it, or move it down                                 |
| A global event bus for cross-slice updates                                             | Coordinate in the use case that triggers the change                          |

---

## 13. Before you finish a task

Run the project's checks (adjust the commands to the project):

```
pnpm lint          # includes Steiger and the boundaries rule
pnpm typecheck
pnpm test          # unit and integration tests
pnpm e2e           # only when a critical flow changed
```

Then confirm:

- [ ] Every new file is in the right layer and slice (section 5).
- [ ] No upward, sideways or deep imports (section 3).
- [ ] Views only call their use case; presentational components only take props (section 4).
- [ ] Only adapters touch APIs, WebSockets, browser storage or third-party SDKs (section 9).
- [ ] New business rules live in `services/`, in a file named for their concept, with unit tests next to them (sections 8 and 10).
- [ ] Domain services are pure; application services get side effects only through dependencies passed in (section 8.1).
- [ ] You searched for an existing rule before writing a new one, and each rule has exactly one owner (sections 8.4 and 8.5).
- [ ] Any rule you added or moved is listed in the owning entity's README.
- [ ] New adapters have mapping tests against saved responses.
- [ ] Changed journeys are covered by an integration test; changed critical flows by a Playwright test.
- [ ] `index.ts` exports only what other slices need, and no adapter.
- [ ] If you broke a rule on purpose, the reason is explained in the pull request description.
