# 1 \- Architecture

# 1 \- Architecture

┌───────────────┐  
│   Frontend                      │  
│  (Next.js)                        │  
└───────────────┘  
                  │  
                  │ Web UI   
                 ▼  
┌───────────────────────┐    ┌───────────────────────┐  
│ Next.js App Router                            │    │ Next.js API Routes                            │  
│ \+ Client/Server                                   │    │ (/api/payment, etc.)                           │  
│ Components                                      │    └───────────────────────┘  
└───────────────────────┘                   │  
                            ▲                                                   │  
                             │                                                   ▼  
┌───────────────────────────────────────────────────┐  
│  Supabase (Auth, DB, Storage, RLS)                                                                       │  
│    \- Users, Credits, Subscription, Images                                                                  │  
└───────────────────────────────────────────────────┘  
                             ▲                                    │  
                              │                                     │  
                              │                  ┌────────────────────────────────────┐  
                              │                  │Bitcoin Lightning Payment Processor                                  │  
                             ▼                  │ (e.g., self-hosted or 3rd-party)                                            │  
                                                  └────────────────────────────────────┘  
┌───────────────────┐   
│ Face Swap Service                 │  
└───────────────────┘

## Next.js (App Router)

* Serves the user-facing UI, including purchase flows, subscription management screens, and the face swap interface.  
* Uses **Next.js API routes** (serverless functions) to coordinate with both Supabase (to store payment status, user credits, and subscriptions) and the Bitcoin Lightning payment processor.

## Bitcoin Lightning Payment Processor

* Instead of Stripe, you’ll integrate a Lightning payment flow.  
* Could be a **self-hosted** LN node (e.g., **c-lightning**, **LND**, or **Core Lightning**) plus a management tool like **BTCPay Server**, or a **third-party** provider that handles invoicing, LNURL, etc.  
* Your Next.js API route will create invoices or LNURLs, monitor payment confirmations, and update the user’s credit/subscription status accordingly.

## Supabase

* **Auth** for user sign-up/sign-in.  
* **Database** to store user data, credits, subscription tiers, image references, etc.  
* **Object Storage** for images.  
* **RLS** to ensure each user can only access their own data.

## Face Swap Service

* A separate service/library (within the Next.js API route or as a microservice) that performs face swaps.  
* Consumes user credits: each successful swap deducts credits from the user’s balance.

# 2 \- Data Flow & Key Components

## **2\. Data Flow & Key Components**

### **2.1 User Authentication & Authorization**

* **Supabase Auth**:  
  * Upon user sign-up or login, Supabase issues a JWT-based session.  
  * Next.js (via the new App Router) can integrate with Supabase’s session-based authentication using server components or client components (depending on your approach and user session management).  
* **Session Storage**:  
  * The session is stored in cookies or local storage (usually in memory for Next.js server components or via client cookie storage).

### **2.2 Data Modeling (Supabase)**

You will have (at least) the following tables/objects:

1. **Users** (managed by Supabase Auth internally, but you can store additional profile fields in a separate table if needed).  
2. **Faces**  
   * `id` (UUID or PK)  
   * `user_id` (FK to Users)  
   * `label` (e.g., “John Smith”, “My portrait 2022”)  
   * `image_url` (points to Supabase Storage or external storage)  
   * `created_at`  
3. **User Gallery Images**  
   * `id`  
   * `user_id` (FK to Users)  
   * `original_image_url`  
   * `processed_image_url` (nullable; or store face-swap results in a different table)  
   * `metadata` (JSON for any image classification, tags, etc.)  
   * `created_at`   
4. **credits**  
   * `user_id` (FK to `users.auth_uid`)  
   * `balance` (number of swaps left)  
   * `last_updated` (timestamp)  
5. **subscriptions**  
   * `user_id`  
   * `active_plan` (e.g., “free”, “paid”)  
   * `images_allowed` (numerical limit, can be auto-calculated per the tier)  
   * `monthly_cost` (USD amount, but you’ll convert to Sats/Bitcoin in the payment flow)  
   * `started_at`, `valid_until` (if you use a monthly subscription, track start date and renewal date)  
6. **payment\_transactions** (or similar)  
   * `id` (PK)  
   * `user_id`  
   * `type` (“credit\_purchase” or “subscription\_renewal”)  
   * `amount_usd` or `amount_sats`  
   * `invoice_id` (from your LN solution for referencing)  
   * `status` (“pending”, “confirmed”, “failed”)  
   * `created_at`  
   * `completed_at`

### **2.3 Image Storage**

* **Supabase Object Storage**:  
  * Keep all user-uploaded images in private buckets.  
  * Access controlled by Supabase policies.  
  * The `url` or `path` of each image is stored in the DB table (e.g., `faces` or `user_gallery_images`).

### **2.4 Face Swap Processing Logic**

* **Option A: Next.js API Route**  
  * Create an endpoint (e.g., `/api/faceswap`) that:  
    1. Receives requests with the face to swap from the user’s face library.  
    2. Receives target images from the user’s gallery.  
    3. Invokes face detection & swapping logic, either using a Node.js library or an external ML service.  
    4. Returns the processed image to the client or stores it in Supabase (then returns the new URL).  
* **Option B: Separate Worker/Microservice**  
  * If the face swap logic is CPU-intensive or requires specific libraries (e.g., Python-based ML frameworks), you may spin up a separate service (e.g., a Docker container on AWS ECS or Azure Container Instances) specifically for the face swap operations.  
  * The Next.js API Route calls the worker with the relevant data (image URLs), waits for the response, and returns it to the client or writes to Supabase.

### **2.5 Real-time Updates (Optional)**

* If you want to show real-time processing status or progress bars while the face swap is happening (especially if it’s not instantaneous), consider:  
  * **Supabase Realtime** or a socket-based approach to push updates back to the client (or you can poll an endpoint).

# 3 \- Frontend Architecture

## **3\. Frontend Architecture (Next.js 14 \+ App Router)**

### **3.1 Directory Structure**

A typical Next.js 14 (App Router) structure might look like:

scss  
Copier le code  
`face-swap-app/`  
`├─ app/`  
`│  ├─ page.tsx                    // Landing page (homepage)`  
`│  ├─ layout.tsx                  // Global layout for entire app`  
`│  ├─ (public-gallery)/`  
`│  │  ├─ page.tsx                 // Public Gallery main landing (or listing all tags?)`  
`│  │  ├─ tags/`  
`│  │  │  ├─ page.tsx              // Displays all tags (or tag-based search results)`  
`│  │  │  └─ [tagSlug]/`  
`│  │  │     └─ page.tsx           // Displays all albums associated with this tag`  
`│  │  ├─ models/`  
`│  │  │  ├─ page.tsx              // Displays all models`  
`│  │  │  └─ [modelSlug]/`  
`│  │  │     └─ page.tsx           // Displays all albums for this model`  
`│  │  ├─ studios/`  
`│  │  │  ├─ page.tsx              // Displays all studios`  
`│  │  │  └─ [studioSlug]/`  
`│  │  │     └─ page.tsx           // Displays all albums for this studio`  
`│  │  └─ albums/`  
`│  │     ├─ page.tsx              // Displays all albums (if you want a direct "album" listing)`  
`│  │     └─ [albumSlug]/`  
`│  │        └─ page.tsx           // Displays images in a single album`  
`│  │`  
`│  ├─ cart/`  
`│  │  └─ page.tsx                 // (Optional) A dedicated Cart page for user`  
`│  │`  
`│  ├─ auth/`  
`│  │  ├─ sign-in/`  
`│  │  │  └─ page.tsx`  
`│  │  ├─ sign-up/`  
`│  │  │  └─ page.tsx`  
`│  │  └─ reset-password/`  
`│  │     └─ page.tsx`  
`│  │`  
`│  ├─ (dashboard)/`  
`│  │  ├─ faces/`  
`│  │  │  └─ page.tsx              // User's own face library (upload or manage faces)`  
`│  │  └─ gallery/`  
`│  │  │  └─ page.tsx              // User's private image gallery (if separate from public)`  
`│  │  └─ faceswap/`   
`│  │     └─ page.tsx              // Face swap interface`  
`│  │`  
`│  ├─ (admin)/`  
`│  │  ├─ public-gallery/`  
`│  │  │  ├─ albums/`  
`│  │  │  │  └─ page.tsx           // Admin manage albums`  
`│  │  │  ├─ images/`  
`│  │  │  │  └─ page.tsx           // Admin manage images`  
`│  │  │  ├─ studios/`  
`│  │  │  │  └─ page.tsx           // Admin manage studios`  
`│  │  │  ├─ models/`  
`│  │  │  │  └─ page.tsx           // Admin manage models`  
`│  │  │  └─ tags/`  
`│  │  │     └─ page.tsx           // Admin manage tags`  
`│  │  ├─ users/`  
`│  │  │  └─ page.tsx`  
`│  │  ├─ payments/`  
`│  │  │  └─ page.tsx`  
`│  │  └─ dashboard/`  
`│  │     └─ page.tsx`  
`│  │`  
`│  ├─ api/`  
`│  │  ├─ payment/`  
`│  │  │  ├─ create-invoice/`  
`│  │  │  │  └─ route.ts`  
`│  │  │  └─ webhook/`  
`│  │  │     └─ route.ts`  
`│  │  ├─ faceswap/`  
`│  │  │  └─ route.ts`  
`│  │  ├─ images/`  
`│  │  │  ├─ upload/`  
`│  │  │  │  └─ route.ts`  
`│  │  │  └─ delete/`  
`│  │  │     └─ route.ts`  
`│  │  └─ subscription/`  
`│  │     └─ route.ts`  
`│  │`  
`│  └─ ...`  
`├─ components/`  
`│  ├─ homepage/`  
`│  │  ├─ HeroSection.tsx           // Hero with face-swap feature or CTA`  
`│  │  └─ PublicGalleryPreview.tsx  // Shows some tags/albums preview on homepage`  
`│  │`  
`│  ├─ publicGallery/`  
`│  │  ├─ TagsList.tsx             // Displays all tags`  
`│  │  ├─ ModelsList.tsx           // Displays all models`  
`│  │  ├─ StudiosList.tsx          // Displays all studios`  
`│  │  ├─ AlbumsList.tsx           // Displays all albums`  
`│  │  ├─ ImageGrid.tsx            // Displays images in an album`  
`│  │  ├─ FilterBar.tsx            // Filter UI: model, tag, studio`  
`│  │  └─ SearchBar.tsx            // Search input for keywords`  
`│  │`  
`│  ├─ cart/`  
`│  │  └─ CartItem.tsx             // A single item in the cart`  
`│  │`  
`│  ├─ ...`  
`├─ domain/`  
`│  ├─ gallery/`  
`│  │  ├─ tagLogic.ts`  
`│  │  ├─ modelLogic.ts`  
`│  │  ├─ studioLogic.ts`  
`│  │  ├─ albumLogic.ts`  
`│  │  └─ imageLogic.ts`  
`│  ├─ cart/`  
`│  │  └─ cartLogic.ts             // E.g., add/remove items, face-swap helpers`  
`│  ├─ face-swap/`  
`│  │  ├─ faceSwapLogic.ts`  
`│  │  └─ faceSwapUtils.ts`  
`│  └─ ...`  
`├─ hooks/`  
`│  ├─ useCart.ts                   // Manage cart items in client state`  
`│  ├─ usePublicGallery.ts          // Manage filters, search, fetch for public gallery`  
`│  ├─ useFaceSwap.ts`  
`│  ├─ useAuth.ts`  
`│  └─ ...`  
`├─ lib/`  
`│  ├─ supabaseClient.ts`  
`│  ├─ LNClient.ts`  
`│  └─ ...`  
`├─ types/`  
`│  ├─ galleryTypes.ts`  
`│  ├─ cartTypes.ts`  
`│  └─ ...`  
`└─ ...`

### **3.2 Styling & UI (Tailwind)**

* Use **Tailwind CSS** for styling across the entire application.  
* Configure it via `tailwind.config.js` to include your custom color palette, fonts, and any plugin usage (e.g., forms, typography).

### **3.3 Shared UI Components**

* Reusable components like:  
  * **ImageCard** for displaying user-uploaded images.  
  * **FaceCard** for displaying faces in the library.  
  * **Navbar**, **Sidebar** (depending on your design).  
  * **UploadButton** or **Dropzone** for file uploads.

### **3.4 Page/Route Layouts**

* **App Router**:  
  * `app/layout.tsx`: defines the base layout used across all routes (e.g., `<html>`, `<body>`, navigation bar).  
  * `app/(dashboard)/faces/page.tsx`: might show the user’s library of faces.  
  * `app/(dashboard)/gallery/page.tsx`: might show the user’s private gallery.  
  * `app/(dashboard)/faceswap/page.tsx`: a page to pick face & gallery images, then do a face swap.

### **3.5 Server Components & Client Components**

* **Server Components**:  
  * Might fetch data from Supabase using server-side environment variables.  
  * Return rendered UI with fetched data.  
* **Client Components**:  
  * Handle user interactions, uploading new images, previewing face swaps, etc.

### **3.6 Payment API Routes**

* `app/api/payment/create-invoice/route.ts`  
  * **POST**: Takes `{ type, usdAmount, userId, productDetails }`, communicates with LN node or LN provider to generate an invoice. Stores the resulting `invoice_id` and `status=pending` in `payment_transactions`.  
* `app/api/payment/webhook/route.ts`  
  * **POST**: LN node / provider calls this endpoint when the invoice is paid.  
  * Look up the `invoice_id`, mark `status=confirmed`, and update the user’s credits or subscription accordingly.

### **3.7 Client-Side Flow (Buying Credits)**

1. **Button** on a “Buy Credits” page triggers a POST to `create-invoice`.  
2. **Response** includes a `payment_request` (Lightning invoice) or `LNURL`.  
3. **UI** displays a QR code. The user scans and pays.  
4. **Poll** the invoice status or wait for the webhook to confirm.  
5. On success, user sees updated credit balance.

### **3.8 Client-Side Flow (Subscription)**

1. **User** navigates to a “Manage Subscription” page that shows current usage (number of images).  
2. **Calculate** monthly cost (0 for first 50 images, \+$2 for each additional 100 above 50).  
3. **Generate** an LN invoice for that monthly cost.  
4. **User pays** it.  
5. **Webhook** updates subscription to “active” or extends the subscription another month.

### **3.9 Face Swap Logic & Credit Deduction**

Whenever the user initiates a face swap:

1. **Check** user’s `credits.balance`.  
2. If `balance > 0`, proceed. If not, prompt user to buy credits.  
3. Deduct `1` credit for each face swap.  
4. Store the processed image in Supabase Storage and record it in `user_gallery_images` or a dedicated table for processed images.

# 4 \- Payment Flow

## **4\. Payment Flow (Lightning)**

### **4.1 Buying Face Swap Credits**

1. **User initiates a purchase** (e.g., 10 face swaps for $1).  
2. **Next.js API** route calls your LN backend\*\* to create an invoice\*\*:  
   * E.g., `POST /api/payment/create-invoice` with `{"amountUsd": 1, "product": "10_swaps"}`  
   * The LN backend calculates equivalent **sats** based on the current BTC/USD exchange rate, then returns an **Lightning invoice** or LNURL.  
3. **Frontend** shows the invoice/QR code\*\* to the user:  
   * The user pays from their Lightning wallet.  
4. **Payment confirmation**:  
   * The LN system notifies your Next.js API route (via webhook or polling) that the invoice is paid.  
   * Your Next.js API route updates the `payment_transactions` table to `status=confirmed`.  
   * Then **credits** table is updated (e.g., add `10 swaps` to `balance`).

### **4.2 Subscriptions for Storing Images**

1. **User configures subscription** (or passes a threshold, e.g., more than 50 images).  
2. Show them the monthly cost in USD \+ sats conversion.  
3. **Next.js API** route again creates a Lightning invoice.  
4. Once the user pays, you:  
   * Mark their `subscriptions` row as `active`, set the `monthly_cost`, update `images_allowed`, etc.  
   * In subsequent months, you either **auto-generate** an invoice or prompt them to pay again (depends if you have a manual or automatic renewal flow).

### **4.3 Usage Calculation for Storage Tiers**

When a user attempts to upload images:

* Check the total image count in the user’s account.  
* If it exceeds `images_allowed`, either prompt them to upgrade their subscription tier or deny the upload.  
* Alternatively, each month you re-check how many images the user has, and generate a monthly invoice based on your tiered formula (0-50 is free, each additional 100 is \+$2, etc.).

# 5 \- Tiered Storage Logic

## **5\. Tiered Storage Logic**

Given your model:

* **Up to 50 images**: $0/month  
* **Next 100 images**: \+$2/month  
* Next 100 after that: \+$2/month, etc.

A straightforward approach:

1. **Calculate the total images** the user has in Supabase (e.g., `SELECT COUNT(*) FROM user_images WHERE user_id = ...`).  
2. **Algorithm**:  
   * `count = total images`  
   * `cost = 0`  
   * `if count <= 50: cost = 0`  
   * `else: count = count - 50; while (count > 0) { cost += 2; count -= 100 }`  
3. **Result** is your monthly cost.  
4. Store that cost in `subscriptions.monthly_cost`.  
5. Each month, generate an LN invoice for that user if the subscription is active.

# Tables DB

## **Table: `user_profiles`**

Used to store additional user information beyond basic Supabase Auth fields.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK; references `users.id` (Supabase users). |
| `username` | VARCHAR | Optional, unique display name. |
| `role` | VARCHAR | e.g. "user", "admin". |
| `created_at` | TIMESTAMP | Default `NOW()`. |
| `updated_at` | TIMESTAMP | Updated via trigger or manually. |

---

## **Table: `faces`**

Holds user-specific face images for the face swap feature.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK \-\> `users.id`. The owner of these faces. |
| `label` | VARCHAR | Optional label for face (e.g., “Smiling Face”). |
| `face_url` | VARCHAR | Points to image in Supabase Storage/CDN. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `studios`**

Represents studios in the public gallery.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `slug` | VARCHAR | Unique slug for URLs (e.g., "studio-disney"). |
| `name` | VARCHAR | Display name for the studio. |
| `description` | TEXT | Optional. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `models`**

Represents models in the public gallery.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `slug` | VARCHAR | Unique slug for URLs (e.g., "john-doe"). |
| `name` | VARCHAR | Display name for the model. |
| `description` | TEXT | Optional. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `tags`**

Represents tags (categories) for albums or images in the public gallery.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `slug` | VARCHAR | Unique slug (e.g., "landscape"). |
| `label` | VARCHAR | Display label (e.g., "Landscape"). |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `albums`**

Represents albums in the public gallery.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `slug` | VARCHAR | Unique slug (e.g., "summer-2025"). |
| `title` | VARCHAR | Album title. |
| `description` | TEXT | Optional description. |
| `studio_id` | UUID | FK \-\> `studios.id`, if album is linked to a specific studio. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `albums_tags`**

Handles the many-to-many relationship between `albums` and `tags`.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `album_id` | UUID | FK \-\> `albums.id`; ON DELETE CASCADE. |
| `tag_id` | UUID | FK \-\> `tags.id`; ON DELETE CASCADE. |

---

## **Table: `albums_models`**

Handles the many-to-many relationship between `albums` and `models`.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `album_id` | UUID | FK \-\> `albums.id`; ON DELETE CASCADE. |
| `model_id` | UUID | FK \-\> `models.id`; ON DELETE CASCADE. |

---

## **Table: `images`**

Represents individual images in a given album.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `album_id` | UUID | FK \-\> `albums.id`; ON DELETE CASCADE. |
| `image_url` | VARCHAR | Points to Supabase Storage/CDN. |
| `title` | VARCHAR | Optional title (e.g., “Beach Sunset”). |
| `description` | TEXT | Optional. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `images_tags` (Optional)**

Maps individual images to tags (if tagging is needed at the image level).

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `image_id` | UUID | FK \-\> `images.id`; ON DELETE CASCADE. |
| `tag_id` | UUID | FK \-\> `tags.id`; ON DELETE CASCADE. |

---

## **Table: `images_models` (Optional)**

Maps individual images to models (if different images in an album have different models).

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `image_id` | UUID | FK \-\> `images.id`; ON DELETE CASCADE. |
| `model_id` | UUID | FK \-\> `models.id`; ON DELETE CASCADE. |

---

## **Table: `carts`**

If you want to store multiple active cart sessions per user (otherwise, you can skip this and store cart items by `(user_id)` alone).

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK \-\> `users.id`. |
| `status` | VARCHAR | e.g., "active", "checked\_out". |
| `created_at` | TIMESTAMP | Default `NOW()`. |
| `updated_at` | TIMESTAMP | Update on changes. |

---

## **Table: `cart_items`**

Tracks which images are in a given cart.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `cart_id` | UUID | FK \-\> `carts.id`; ON DELETE CASCADE. |
| `image_id` | UUID | FK \-\> `images.id`. |
| `quantity` | INT | Default 1\. If you allow multiple of the same image. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `credit_packages`**

Defines purchasable face swap credit bundles (e.g., $1 for 10 swaps).

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `package_name` | VARCHAR | e.g. "10 swaps", "50 swaps". |
| `usd_price` | NUMERIC(6,2) | Price in USD. |
| `swap_credits` | INT | Number of swaps included. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `face_swap_credits`**

Tracks how many face swap credits a user has remaining.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `user_id` | UUID | PK; references `users.id`. |
| `balance` | INT | Current number of remaining swaps. |
| `updated_at` | TIMESTAMP | Update whenever balance changes. |

---

## **Table: `face_swap_jobs` (Optional for Async Swaps)**

If you want to handle asynchronous or batch swaps.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK \-\> `users.id`. |
| `face_id` | UUID | FK \-\> `faces.id`; which face is used. |
| `status` | VARCHAR | "pending", "processing", "done", "error". |
| `created_at` | TIMESTAMP | Default `NOW()`. |
| `updated_at` | TIMESTAMP | Update on status change. |

---

## **Table: `face_swap_job_items` (Optional)**

Tracks each image in a batch swap job.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `job_id` | UUID | FK \-\> `face_swap_jobs.id`; ON DELETE CASCADE. |
| `image_id` | UUID | FK \-\> `images.id`; which public image is being swapped. |
| `result_url` | VARCHAR | Where the swapped image is saved. |
| `status` | VARCHAR | "pending", "done", "error". |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `subscription_plans`**

If you offer different tiered subscriptions (e.g., Free, Premium).

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `plan_name` | VARCHAR | e.g., "Free", "Pro". |
| `monthly_cost_usd` | NUMERIC(6,2) | e.g., 2.00, 5.00, 10.00, etc. |
| `image_limit` | INT | How many images user can store under this plan. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `subscriptions`**

If you have monthly billing for storing more than 50 images in the user’s private gallery (or other premium features).

| Column | Type | Notes |
| ----- | ----- | ----- |
| `user_id` | UUID | PK or unique. Each user has 1 active subscription. |
| `subscription_plan` | UUID | FK \-\> `subscription_plans.id`. |
| `started_at` | TIMESTAMP | Default `NOW()`. |
| `valid_until` | TIMESTAMP | The next renewal date. |
| `created_at` | TIMESTAMP | Default `NOW()`. |
| `updated_at` | TIMESTAMP | Updated when subscription changes. |

---

## **Table: `payment_transactions`**

Tracks all transactions (face swap credits purchase, subscription renewal, etc.).

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK \-\> `users.id`. |
| `type` | VARCHAR | e.g. "credit\_purchase", "subscription\_renewal". |
| `package_id` | UUID | FK \-\> `credit_packages.id`, if relevant. |
| `plan_id` | UUID | FK \-\> `subscription_plans.id`, if relevant. |
| `amount_usd` | NUMERIC(6,2) | Payment in USD. |
| `amount_sats` | BIGINT | Payment in Satoshis (if using LN). |
| `invoice_id` | VARCHAR | LN invoice reference. |
| `status` | VARCHAR | "pending", "confirmed", "failed". |
| `created_at` | TIMESTAMP | Default `NOW()`. |
| `completed_at` | TIMESTAMP | Set when payment is confirmed. |

---

## **Table: `favorites` (Optional)**

If users can favorite albums, images, tags, models, etc.

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK \-\> `users.id`. |
| `item_type` | VARCHAR | e.g., "album", "image", "tag", "model". |
| `item_id` | UUID | PK from the corresponding table. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

## **Table: `user_gallery_images` (Optional)**

If a user can upload and store their **own** images (private gallery).

| Column | Type | Notes |
| ----- | ----- | ----- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK \-\> `users.id`. |
| `image_url` | VARCHAR | Points to Supabase Storage. |
| `metadata` | JSONB | Optional tags, classification, etc. |
| `created_at` | TIMESTAMP | Default `NOW()`. |

---

# Roadmap

Your mission is to build the **front-end** and **back-end** (via Next.js App Router \+ Supabase) that:

1. **Authenticates** users (sign in, sign up, password recovery).  
2. **Manages** user data (profiles, credits, faces, cart).  
3. **Integrates** with LN (Bitcoin Lightning) for payments.  
4. **Sends** asynchronous requests to the Flask app (and receives callbacks or polling results).  
5. **Displays** public gallery content, allowing users to **add images to a cart** and **initiate** swaps with their own faces.

---

## **1\. Discovery & Planning**

1. **Confirm MVP Features**  
   * **Auth**: Email-based sign up, sign in, password recovery, and email verification.  
   * **Email Notifications**: For sign-in verification, password reset, face swap completion.  
   * **Public Gallery**: Minimal list of **tags**, a **search bar**, and a **filter bar**. Clicking a tag leads to its gallery page.  
   * **Admin Dashboard**: Stats (users, swaps, images, tags, models, credits sold, credits used) \+ CRUD for tags, models, albums, images.  
   * **Faces**: Users can upload face images to their private library.  
   * **Cart**: Add images from an album, then face-swap them using one of the user’s faces.  
   * **LN Bitcoin Payment**: Purchase credits (and optionally a yearly fee for image storage).  
   * **User Dashboard**: Manage faces, see swap history, filter results by face label or original tags, manage credits, edit account data.  
2. **Decide Async Flow**  
   * Since the Flask app is **already deployed**, confirm how Next.js will **send** face swap jobs (HTTP call, message queue, etc.) and how the Flask app **notifies** completion (callback endpoint vs. your app polling).  
3. **Design DB Schema** (Supabase)  
   * Key tables: `users` (Supabase Auth), `faces`, `face_swap_jobs`, `face_swap_job_items`, `payment_transactions`, `albums`, `images`, `tags`, `models`, etc.  
   * Define row-level security (RLS) for private data (`faces`, `face_swap_jobs`, etc.).

**Deliverables**

* Clear **MVP specification** focusing on Next.js \+ Supabase only (Flask is out of scope).  
* **ERD** with final table relationships.  
* Time estimates and project plan for feature sprints.

---

## **2\. Supabase Setup**

1. **Create Supabase Project**  
   * Generate or reuse environment variables (Project URL, Anon key, Service key).  
2. **Implement Tables & RLS**  
   * `user_profiles`, `faces`, `albums`, `tags`, `images`, `payment_transactions`, `face_swap_jobs`, etc.  
   * **RLS** ensures only a user can access their faces, face swap jobs, etc.  
3. **Seed Data** (Optional)  
   * Insert test data for tags, models, albums, images to test the public gallery.  
   * Configure any initial admin users or roles.  
4. **Verify**  
   * Test basic insert/select to confirm DB and RLS rules are correct.

**Deliverables**

* **Supabase** with all tables \+ RLS.  
* Migration or schema script in version control.  
* Optional seed script for local testing.

---

## **3\. Next.js 14 Project Initialization**

1. **Create Next.js App**  
   * `npx create-next-app` (or use existing).  
   * Add `.env` for local dev with Supabase keys and LN node credentials.  
2. **App Router & Tailwind**  
   * Configure the `app/` directory with routes:  
     * **`/`** (landing page),  
     * **`/auth/*`** (sign in, sign up, reset password),  
     * **`(admin)/*`** for admin views,  
     * **`(dashboard)/*`** for user faces, swap history, etc.  
   * Install & configure Tailwind (`tailwind.config.js`, `globals.css`).  
3. **Supabase Client**  
   * `lib/supabaseClient.ts` with public Anon key usage.  
   * If needed, a server-side instance with Service Key for secure operations in API routes.  
4. **Payment & Email**  
   * Create a stub for LN payment client (`lib/LNClient.ts` or `domain/payments/LNService.ts`).  
   * Create an email service stub (`domain/communications/emailService.ts`) for sign-up verification, swap completion notices, etc. (Actual SMTP or 3rd-party later).

**Deliverables**

* Next.js \+ Tailwind **scaffold** in version control.  
* Basic **routing structure** (landing, auth, admin, dashboard).  
* **Supabase** integrated (client).

---

## **4\. Core Feature Implementation**

### **4.1 Auth & Email Flow**

* **Sign Up / Sign In**:  
  * Use Supabase Auth, create custom pages: `app/auth/sign-up`, `app/auth/sign-in`.  
  * On sign-up, trigger an **email verification** (Supabase can do magic links or your own email).  
* **Password Recovery**:  
  * `app/auth/reset-password`.  
  * On request, send email with a password reset link from Supabase or a custom flow.  
* **Email Confirmation**:  
  * Ensure user must confirm email before accessing certain features (RLS can enforce `email_confirmed` checks).

### **4.2 Public Gallery (MVP)**

* Minimal approach: a page listing **tags** with an image \+ label.  
* Search bar to filter tags or albums.  
* Clicking a tag → **Tag Gallery Page** showing related albums (or images).  
* Basic album display to show images.  
* **Add to Cart** button on each image.

### **4.3 Faces (User’s Private Library)**

* `app/(dashboard)/faces/page.tsx`:  
  * **Upload face** (file upload to Supabase Storage).  
  * Display user’s existing faces in a grid.  
  * Let them label or delete.

### **4.4 Cart & Face Swap Flow**

1. **Cart**  
   * A simple client-side cart or DB-based `cart_items`.  
   * Let user pick images from an album, then review them on a “Cart” page.  
2. **Initiate Swap**  
   * Choose which **face** from the user’s library or prompt to upload one.  
   * **Check** user’s credit balance. If insufficient, direct to LN payment.  
3. **Create `face_swap_jobs`**  
   * On “Swap Now,” call an API route (`/api/faceswap/createJob`).  
   * Insert job record (`face_swap_jobs`) with `status='pending'`, plus job items (`face_swap_job_items`) referencing each image.  
4. **Call the Flask App**  
   * The Next.js API route sends a **request** to the Flask app with job details (job\_id, images, face info).  
   * Immediately responds to the user that the job is queued.  
5. **Job Completion**  
   * The Flask app calls a **callback** route or is polled.  
   * When each item is done, update `face_swap_job_items.result_url` and `status='done'`, decrement user’s credits.  
   * **Email** user upon full job completion.

### **4.5 LN Bitcoin Payment**

* **Buy Credits** Page  
  * Offers bundles: $1=10 swaps, etc.  
  * On selection, the Next.js API route creates a LN invoice.  
  * Display the invoice/QR code to the user.  
  * Poll or listen for LN payment confirmation (webhook).  
  * Once confirmed, increment `face_swap_credits.balance`.  
* **Yearly Storage** (If required by MVP)  
  * Similar LN invoice approach for a single yearly payment.  
  * Update a `yearly_storage_paid_until` field in `user_profiles`.

### **4.6 Admin Dashboard**

* **Stats Overview**:  
  * Number of users, total face swaps, total images in the public gallery, total tags, total models, total credits sold, total used, total unspent.  
  * Summaries from queries to Supabase.  
* **Management**:  
  * Pages for CRUD: tags, models, albums, images.  
  * Possibly a table or chart to show “images per tag” or “images per model.”

### **4.7 User Dashboard**

* **Faces**: Already done above.  
* **Swaps Gallery**:  
  * Display completed swaps.  
  * Filter by face label or by original image tags.  
  * Possibly reorder or rename swapped images.  
* **Account & Credits**:  
  * Show credit balance, LN payment link to buy more.  
  * Edit profile info.

**Deliverables**

* All **front-end** pages \+ **API** routes for face swap jobs, LN payments, admin, user.  
* Basic **error handling** (no face selected, no credits left, etc.).

---

## **5\. Testing & QA**

1. **Unit Tests**  
   * For business logic (credit updates, job creation).  
   * For LN invoice handling.  
2. **Integration Tests**  
   * **Auth** flow (sign up, sign in, password reset).  
   * **Cart** flow (add images, pick face, create job).  
   * **LN Payment** (create invoice, confirm, check credits).  
   * **Face Swap** job lifecycle (pending → done).  
3. **Performance**  
   * Basic checks that public gallery pages load quickly.  
   * The actual face swap is asynchronous, so main load is on the Flask side (not your concern here).  
4. **Security**  
   * RLS ensures user can only see their own faces, jobs.  
   * Admin routes protected with role checks.  
5. **UAT** (User Acceptance Testing)  
   * A small user group tries sign-up, swapping, buying credits, etc.

**Deliverables**

* Test suite with passing coverage for critical features.  
* RLS-verified security.  
* Ready for final checks before production.

---

## **6\. Deployment & Production**

1. **Supabase**  
   * Use a production Supabase project. Migrate final schema.  
   * Ensure environment variables for `SUPABASE_KEY` and `SUPABASE_URL`.  
2. **Next.js Hosting**  
   * Deploy to Vercel or your own Node server.  
   * Configure `.env` for LN \+ Email service keys, Supabase service key for secure calls in API routes.  
3. **Emails**  
   * Set up a production email provider (SendGrid, Mailgun, or own SMTP).  
   * Verify domain to avoid spam issues.  
4. **LN Payment**  
   * Integrate real LN node or LN service in production mode.  
   * Ensure invoice creation & webhooks are stable.  
5. **Monitoring & Logging**  
   * Basic logs for face swap job statuses, LN payments.  
   * Error tracking (Sentry or similar).

**Deliverables**

* Live Next.js \+ Supabase site.  
* Production LN integration.  
* CI/CD pipeline for auto-build, auto-deployment.

---

## **7\. Post-Launch & Maintenance**

1. **Monitor & Fix Bugs**  
   * Watch logs for job errors, LN payment failures, or email bounces.  
   * Respond quickly to user feedback.  
2. **Enhancements**  
   * Additional search/filter features, model-based browsing, favorites, or more advanced admin analytics.  
   * More robust user notifications or real-time job progress.  
3. **Performance Tuning**  
   * If volume grows, optimize DB queries, add caching for the public gallery.  
   * Possibly scale horizontally if the user base or the number of swaps skyrockets.  
4. **Yearly Payment Reminders**  
   * If you do yearly image storage, automate email reminders when nearing expiry.

**Deliverables**

* A stable MVP in production.  
* Roadmap for ongoing improvements and new features.

---

### **Conclusion**

This **Next.js \+ Supabase-focused roadmap** ensures you:

1. **Authenticate** users with secure RLS in Supabase.  
2. **Store** user faces, handle **asynchronous** swap jobs by calling out to the existing Flask service.  
3. **Collect payments** via LN Bitcoin, updating user credits.  
4. Provide a minimal but functional **public gallery** with tags, a **cart** system to pick images, and an **admin** dashboard for oversight.  
5. Launch with robust **testing**, **deployment**, and **monitoring** strategies, and then iterate post-launch as user feedback guides future enhancements.

# User Stories

**Below is a priority table for all the user stories. The priorities are illustrative and can be adjusted based on your team’s specific needs (e.g., P1 \= High, P2 \= Medium, P3 \= Low).**

|  | User Story | Priority |
| ----- | ----- | ----- |
| **1** | **[As a user I want to sign up]()** | **P1** |
| **2** | **As a user I want to sign in** | **P1** |
| **3** | **As a user I want to recover my password** | **P1** |
| **4** | **As a user I want to verify my email** | **P2** |
| **5** | **As a user I want to browse public tags in the gallery** | **P2** |
| **6** | **As a user I want to filter or search the public gallery** | **P2** |
| **7** | **As a user I want to view albums in a tag** | **P2** |
| **8** | **As a user I want to favorite or bookmark certain public images or albums (if “favorites” is in scope)** | **P3** |
| **9** | **As a user I want to add images to my cart** | **P1** |
| **10** | **As a user I want to view and manage my cart** | **P1** |
| **11** | **As a user I want to remove images from my cart** | **P2** |
| **12** | **As a user I want to upload face images to my private library** | **P1** |
| **13** | **As a user I want to label and organize my faces** | **P2** |
| **14** | **As a user I want to remove or delete a face from my private library** | **P2** |
| **15** | **As a user I want to edit the label or metadata of a face in my library** | **P2** |
| **16** | **As a user I want to initiate a face swap on images in my cart** | **P1** |
| **17** | **As a user I want to see the status and results of my face swaps** | **P1** |
| **18** | **As a user I want to receive a notification when my face swap job is completed** | **P2** |
| **19** | **As a user I want to manage my notification preferences (e.g., email vs. none)** | **P3** |
| **20** | **As a user I want to preview the swapped image result before saving it** | **P2** |
| **21** | **As a user I want to delete a completed face swap result** | **P2** |
| **22** | **As a user I want to purchase swap credits using LN Bitcoin** | **P1** |
| **23** | **As a user I want to pay a yearly fee for storing my images** | **P2** |
| **24** | **As a user I want to see and manage my remaining swap credits** | **P1** |
| **25** | **As an admin I want to view overall usage statistics** | **P2** |
| **26** | **As an admin I want to manage user roles** | **P2** |
| **27** | **As an admin I want to manage tags, models, and studios** | **P2** |
| **28** | **As an admin I want to manage albums and images in the public gallery** | **P2** |
| **29** | **As an admin I want to handle LN payment transactions and user credits** | **P1** |
| **30** | **As an admin I want to ban or suspend malicious users** | **P2** |
| **31** | **As an admin I want to view detailed logs of all face swap jobs** | **P3** |

**\- P1 (High): Essential for core functionality or immediate user needs.**  
 **\- P2 (Medium): Important but can be delivered after core functions.**  
 **\- P3 (Low): Nice-to-have, can be scheduled after higher-priority items are addressed.**

# ⚪ ADMIN Stories

# ⚪ I want to view overall usage statistics

**User Story**  
 **Title:** As an admin I want to view overall usage statistics

---

## **Description / Narrative**

* **Who:** An **admin** user with elevated privileges to oversee and manage the application.  
* **What:** The admin wants to **view** a high-level **dashboard** or page showing **key metrics** (e.g., total users, swaps performed, credits purchased, storage usage).  
* **Why (Goal):** By having access to **overall usage stats**, the admin can monitor system health, user engagement, and financial performance (if applicable).

---

## **Acceptance Criteria**

1. **Statistics Dashboard**

   * Given the admin navigates to an **Admin Dashboard** page,  
   * When the system loads the **usage statistics**,  
   * Then the admin sees **key metrics** such as:  
     * Number of **registered users**  
     * Number of **active users** (daily/weekly/monthly, if tracked)  
     * Total **swaps** performed (and possibly success vs. failure rates)  
     * **Credits** purchased or used (if relevant)  
     * Total images or faces stored, if storage stats are tracked  
2. **Data Visualization** (Optional)

   * The stats may be displayed as **charts** (bar, line, pie) or **numeric counters**.  
   * The admin can quickly grasp trends (e.g., weekly/monthly comparisons) if the design includes time-based graphs.  
3. **Filters / Time Range** (Optional)

   * If the system supports filtering by date range,  
   * The admin can select a **time range** (e.g., “Last 7 days,” “Last 30 days,” “All Time”) to refine the statistics.  
   * The page updates to show stats only for that selected period.  
4. **Security & Access Control**

   * Only **admin** roles can see this page. A non-admin user must not be able to access or view these stats.  
   * If a user attempts to navigate to the stats page without admin privileges, show an “Access Denied” error.  
5. **Error Handling**

   * If data retrieval fails (mock or real DB error), the admin sees a message (“Unable to load usage stats. Please try again or contact support.”).  
   * The admin may retry or investigate logs for system health.

---

## **Constraints / Additional Notes**

* **Authentication & Authorization**: Ensure the admin route is protected by role checks or an admin flag in the user profile.  
* **MVP vs. Future**:  
  * MVP might show basic counters (total users, total swaps).  
  * Future expansions can add advanced analytics (user retention, swap success rates over time, revenue from LN credits, etc.).  
* **Mock vs. Real**: In a mock scenario, the data can be placeholders. In production, real-time or near-real-time DB queries or analytics tools might power the dashboard.

---

## **Summary (For Human & AI)**

This user story lets **admin** users see **overall usage stats** in an **Admin Dashboard**. The **acceptance criteria** detail which **metrics** are shown, how the data might be **filtered** or **visualized**, and the **access control** ensuring only admins can view it. Both **human developers** and **AI Agents** can implement this feature for effective **system monitoring** and **administrative oversight**.

# 25 \- FT \- Overview

1. **Create an Admin Dashboard Page for Usage Statistics**  
2. **Implement Total Registered Users Metric**  
3. **Implement Total Face Swaps Performed Metric**  
4. **Implement Total Images Uploaded Metric**  
5. **Implement Total Tags Count Metric**  
6. **Implement Total Models Usage Metric**  
7. **Implement Total Swap Credits Purchased and Used Metrics**  
8. **Integrate Charts and Graphs for Visualizing Statistics**  
9. **Add Time Range Filtering for Usage Data**  
10. **Implement Data Refresh and Error Handling for Statistics**  
11. 

# ⚪ I want to manage user roles

**User Story**  
 **Title:** As an admin I want to handle LN payment transactions and user credits

---

## **Description / Narrative**

* **Who:** An **admin** user overseeing the financial side of the application.  
* **What:** The admin wants to **review** LN payment transactions (credits purchases) and **manage** users’ credit balances (e.g., adjust credits if needed).  
* **Why (Goal):** By monitoring and controlling **Lightning (LN) transactions** and **credits**, the admin can ensure correct billing, spot fraudulent activity, and assist users with payment or credit issues.

---

## **Acceptance Criteria**

1. **Payment Transactions Overview**

   * Given the admin navigates to a **Payments** or **Transactions** page (e.g., `/(admin)/payments`),  
   * When the system loads the LN payment records,  
   * Then the admin can see a **list** of transactions, each with details like **invoice\_id**, **user\_id**, **amount\_sats**, **status** (pending, confirmed, failed), and **timestamp**.  
2. **Filter & Search**

   * The admin can **filter** transactions by status (pending, confirmed, failed) or search by `invoice_id` or `user_id`.  
   * This helps locate specific transactions for troubleshooting or auditing.  
3. **Verification & Adjustments**

   * If a transaction failed but the user insists they paid, the admin can mark the payment as “manually confirmed,” potentially adjusting the user’s credit balance.  
   * Conversely, if a transaction appears fraudulent, the admin can revoke credits or set the transaction status to “refunded/void.”  
4. **User Credits Management**

   * The admin can see each user’s **current credit balance** and, if needed, **manually add or remove** credits (e.g., due to support issues or promotional reasons).  
   * A short note or reason might be logged (“Added 10 credits due to LN invoice mismatch”).  
5. **Security & Authorization**

   * Only **admins** can access this page. If a non-admin tries, they are denied or redirected.  
   * All edits to transaction status or credits should be logged for auditing in a real scenario (not necessarily in an MVP).  
6. **Feedback & Error Handling**

   * After the admin updates a transaction or adjusts credits, show a success message (“Transaction updated,” “Credits added to user”), or an error if something fails (“Unable to update transaction, please try again”).

---

## **Constraints / Additional Notes**

* **MVP**: Basic table listing LN transactions, a simple filter/search, and minimal credit adjustment functionality.  
* **Future Enhancements**:  
  * Bulk editing or advanced analytics on payments.  
  * Automated fraud detection.  
  * More detailed logs or integration with external payment dashboards.

---

## **Summary (For Human & AI)**

This user story ensures an **admin** can **view** LN payment transactions, **adjust** or **confirm** them if needed, and **manage users’ credit balances** accordingly. The **acceptance criteria** detail **filtering/searching** transactions, **manually** updating statuses, **adding/removing** user credits, and **security** measures. Both **human developers** and **AI Agents** can use these guidelines to implement a straightforward, secure **payment & credits administration** feature.

# 26 \- FT \- Overview

1. **Implement a User Management Page for Viewing User Roles**  
2. **Add a Role Change Dropdown for Each User**  
3. **Implement Role Update Functionality and API Integration**  
4. **Display a Confirmation Dialog for Role Changes**  
5. **Provide Visual Feedback After Successful Role Update**  
6. **Validate Role Changes and Prevent Self-Demotion**  
7. **Secure the User Role Management Section for Admins Only**  
8. 

# ⚪ I want to manage tags, models, and studios

**User Story**  
 **Title:** As an admin I want to manage user roles

---

## **Description / Narrative**

* **Who:** An **admin** user who oversees the application and user base.  
* **What:** The admin wants to **view and modify** the roles of users, such as promoting a regular user to admin or revoking admin privileges if necessary.  
* **Why (Goal):** By managing user roles, the admin can control access to restricted features (e.g., only admins can see usage stats, moderate content, etc.), thus maintaining proper governance of the system.

---

## **Acceptance Criteria**

1. **User List & Role Display**

   * Given the admin navigates to a **User Management** page (e.g., `/(admin)/users`),  
   * When the system loads the **user list**,  
   * Then the admin sees each user’s **username** or **email**, and their **current role** (e.g., “user,” “admin,” “disabled” if that exists).  
2. **Role Change**

   * Given the admin sees a particular user,  
   * When they click an **“Edit Role”** or **“Change Role”** button (or dropdown),  
   * Then the system shows the available roles (e.g., “User,” “Admin,” “Disabled”).  
   * Once the admin selects a new role and saves, the system updates that user’s role in the mock or real database.  
3. **Confirmation & Feedback**

   * After a successful update, the admin sees a **confirmation message**: “User role updated to Admin.”  
   * If an error occurs (e.g., insufficient privileges, mock or real DB issue), an error message appears: “Unable to update user role, please try again.”  
4. **Prevent Self-Demotion** (Optional)

   * To avoid locking oneself out, if the admin tries to remove their own admin privileges, the system might show a warning (“You cannot remove your own admin role”) or require a second admin to do so.  
   * This rule is optional, depending on your application’s design.  
5. **Security / Authorization**

   * Only **admins** can access the **User Management** page.  
   * If a non-admin tries to access it, show an “Access Denied” or redirect them.  
   * Changes to user roles should be logged (in a real system) for auditing.  
6. **User Search or Filters** (Optional)

   * The admin can filter users by role or search by username/email, making it easier to find the user they want to edit.  
   * Not mandatory for an MVP but enhances usability.

---

## **Constraints / Additional Notes**

* **MVP**: Basic list of users, a drop-down or button to switch roles, and a success message.  
* **Future Enhancements**:  
  * Bulk role changes (select multiple users).  
  * Logging or tracking who changed which user’s role.  
  * More complex role hierarchies (e.g., “moderator,” “support staff”).

---

## **Summary (For Human & AI)**

This user story enables **admin** users to **view** all user accounts and **modify** their roles (e.g., from “user” to “admin,” or disabling an account). The **acceptance criteria** outline how the **user list** is displayed, how **role changes** occur, what **feedback** or **error handling** is provided, and the **security** measures ensuring only admins can perform role updates. Both **human developers** and **AI Agents** can use these guidelines to implement a straightforward, secure **user role management** feature.

# 27 \- FT \- Overview

1. **Create an Admin page to list all tags, models, and studios**  
2. **Add a form to add new tags, models, or studios (name, slug, description)**  
3. **Implement “Edit” functionality for existing tags, models, or studios**  
4. **Provide a “Delete” or “Remove” option with confirmation dialog**  
5. **Validate and handle duplicate slugs or names (if applicable)**  
6. **Ensure only admin users can access this management section**

# ⚪ to manage albums and images in the public gallery

**User Story**  
 **Title:** As an admin I want to manage tags, models, and studios

---

## **Description / Narrative**

* **Who:** An **admin** user with elevated privileges to moderate and organize the public gallery.  
* **What:** The admin wants to **create**, **edit**, or **delete** various **tags**, **models**, and **studios** that categorize or define the public gallery’s albums and images.  
* **Why (Goal):** By managing these metadata elements, the admin can keep the gallery organized, ensure accurate labeling, and provide a better browsing experience for users.

---

## **Acceptance Criteria**

1. **Administration Pages**

   * Given the admin navigates to the **Tags**, **Models**, or **Studios** management sections (e.g., `/(admin)/public-gallery/tags`, `/(admin)/public-gallery/models`, etc.),  
   * When the page loads,  
   * Then the admin sees a **list** of existing tags/models/studios (depending on which page they’re on), plus options to **add**, **edit**, or **delete** each item.  
2. **Add New Items**

   * When the admin clicks an **“Add”** button (e.g., “Add Tag”),  
   * Then they can fill out a **form** (e.g., tag name, slug, optional description).  
   * Upon submitting, the new item is created and displayed in the list with a success message (“Tag created successfully\!”).  
3. **Edit Existing Items**

   * When the admin clicks an **“Edit”** or **pencil** icon next to an existing item,  
   * Then they see a form with the current data (e.g., name, slug, description) pre-filled.  
   * After updating and saving, the list refreshes, showing the updated data with a success message (“Model updated\!”).  
4. **Delete / Remove**

   * When the admin clicks a **“Delete”** or **trash** icon next to an item,  
   * A confirmation modal or dialog appears: “Are you sure you want to delete \[item name\]?”  
   * On confirming, the item is removed from the list and any references in the gallery (or at least flagged as removed in a mock scenario).  
   * A success message is displayed (“Studio deleted.”). If an error occurs, display “Unable to delete. Please try again.”  
5. **Validation & Constraints**

   * If any item must be **unique** (e.g., slug names), the system checks for duplicates.  
   * If the user tries to create or edit an item with invalid data (e.g., empty name, existing slug), an error message is shown.  
6. **Security & Authorization**

   * Only admins can access these pages. A non-admin user is denied access if they try.  
   * The system logs or tracks who added/edited/deleted items for auditing (in a real scenario, not necessarily in MVP).  
7. **Impact on Public Gallery**

   * Adding, editing, or deleting tags/models/studios **directly** affects how items appear in the public gallery.  
   * If an item is deleted, any associated references (albums/images that used that tag/model/studio) might need updating or the references removed to avoid broken links.

---

## **Constraints / Additional Notes**

* **MVP**: Basic CRUD for each entity (tags, models, studios) with minimal fields—name, slug, description.  
* **Future Enhancements**:  
  * Bulk editing (select multiple items).  
  * Hierarchical or nested tagging systems.  
  * More advanced validation or dependency checks (e.g., preventing deletion if still in use).

---

## **Summary (For Human & AI)**

This user story enables **admin** users to **manage** (create, edit, delete) **tags**, **models**, and **studios** that categorize the **public gallery**. The **acceptance criteria** describe the **CRUD** operations, how **validation** and **confirmation** dialogs work, and **security** measures ensuring only admins can modify these metadata elements. Both **human developers** and **AI Agents** can implement these guidelines to provide a clear, organized **public gallery** management system.

# 28 \- FT \- Overview

1. **Create an Admin page to list and manage existing albums**  
2. **Add “Create Album” functionality (title, description, cover image, etc.)**  
3. **Implement “Edit Album” action for updating album details**  
4. **Provide “Delete Album” with a confirmation dialog (handle associated images)**  
5. **Create an Admin page or section to list and manage images within an album**  
6. **Add “Upload Image” functionality for public gallery albums**  
7. **Implement “Edit Image” action (title, description, album assignment)**  
8. **Provide “Delete Image” with a confirmation dialog**  
9. **Validate album/image data (required fields, uniqueness, etc.)**  
10. **Restrict access to admin users only**

# ⚪ to handle LN payment transactions and user credits

**User Story**  
 **Title:** As an admin I want to manage albums and images in the public gallery

---

## **Description / Narrative**

* **Who:** An **admin** user responsible for overseeing and organizing the public gallery content.  
* **What:** The admin wants to **create**, **edit**, and **delete** **albums** and **images** that appear in the public gallery so that it remains accurate, up-to-date, and properly categorized.  
* **Why (Goal):** By managing these core gallery items, the admin can ensure users see only valid, high-quality, and well-organized content.

---

## **Acceptance Criteria**

1. **Albums Management**

   * **List & View**: The admin can see a list of existing albums with basic details (title, description, associated studio or tags).  
   * **Add New Album**: Clicking “Add Album” presents a form to enter a **title**, **description**, **cover image** (optional), and link it to tags or a studio if needed.  
   * **Edit Album**: An “Edit” button allows updating the album’s title, description, or associations.  
   * **Delete Album**: A “Delete” button triggers a confirmation dialog. On confirmation, the album is removed from the gallery. If images are still linked to it, the admin decides how to handle those (e.g., reassign or remove them).  
2. **Images Management**

   * **List & View**: The admin can see all images across the public gallery or within a specific album.  
   * **Add New Image**: Clicking “Add Image” opens a form or upload tool to place a new image into an album, with fields for **title**, **description**, and **image file** or URL.  
   * **Edit Image**: An “Edit” or “pencil” icon allows updating the title, description, or other metadata (e.g., which album or tags it belongs to).  
   * **Delete Image**: A “Delete” or “trash” icon triggers a confirmation dialog. On confirmation, the image is removed. The system might prompt how to handle references or tags.  
3. **Validation & Constraints**

   * If any required fields (e.g., album title, image file) are missing or invalid, the admin sees an error message.  
   * If an album or image name must be unique within certain scope, the system checks for duplicates and denies creation if it conflicts.  
4. **Confirmation & Feedback**

   * After each creation, edit, or deletion, a **success message** appears (“Album created successfully\!”).  
   * If an error occurs (mock or real), an error message is shown (“Unable to delete image, please try again.”).  
5. **Security & Authorization**

   * Only admins can access these management pages. Non-admins who attempt to do so are denied or redirected.  
   * Changes should be recorded or logged for audit purposes in a real scenario (not necessarily in an MVP).  
6. **References & Consistency**

   * If an album is deleted, the admin decides how images within it are handled (e.g., also delete images or move them to another album).  
   * If an image is updated, any references to that image’s tags or metadata in the public gallery reflect those changes.

---

## **Constraints / Additional Notes**

* **MVP**: Basic CRUD for albums and images: creation, editing, deletion, and minimal metadata fields (title, description, optional cover image).  
* **Future Enhancements**:  
  * Bulk operations (e.g., select multiple albums/images to delete).  
  * Reordering images within an album, advanced metadata (exif data, geolocation, etc.).  
  * Multi-image upload with drag-and-drop support.

---

## **Summary (For Human & AI)**

This user story ensures an **admin** can **create**, **edit**, and **delete** **albums** and **images** in the **public gallery**, maintaining high-quality, well-structured content for end-users. The **acceptance criteria** detail the **CRUD operations**, **confirmation dialogs**, **feedback messages**, and **security requirements**. Both **human developers** and **AI Agents** can implement these guidelines to provide a robust **gallery management** system.

# 29 \- FT \- Overview

1. **Create an Admin Payments Dashboard to View LN Payment Transactions**  
2. **Implement LN Invoice Generation Log Display**  
3. **Develop Search and Filter Functionality for LN Transactions**  
4. **Integrate Payment Confirmation Details into the Dashboard**  
5. **Display User Credit Balances on the Admin Dashboard**  
6. **Implement Manual Credit Adjustment Functionality for Users**  
7. **Provide Error Handling and Logging for LN Payment Issues**  
8. **Secure the LN Payment and Credit Management Section for Admins Only**  
9. 

# ⚪ I want to ban or suspend malicious users

# 30 \- FT \- Overview

1. **Create an Admin User Management Page for Banning/Suspending Users**  
2. **Add Ban/Suspend Action Button for Each User Entry**  
3. **Implement a Confirmation Dialog for Ban/Suspend Actions**  
4. **Display Banned/Suspended Status in the User List**  
5. **Log Ban/Suspend Actions for Audit Purposes**  
6. **Secure the Ban/Suspend Functionality for Admins Only**  
7. 

# ⚪ I want to view detailed logs of all face swap jobs

# 31 \- FT \- Overview

1. **Create an Admin Face Swap Logs Dashboard**  
2. **Display Detailed Information for Each Face Swap Job**  
3. **Implement Filtering Options for Logs (by Date, User, Status)**  
4. **Add Search Functionality to Locate Specific Swap Jobs**  
5. **Enable Pagination or Infinite Scrolling for Log Entries**  
6. **Provide a Log Export or Download Option for Analysis**  
7. **Ensure Secure Access to the Face Swap Logs Dashboard for Admins Only**  
8. 

# ⚪ USER Stories

# ⚪ I want to sign up

**Title:** As a user I want to sign up

---

## **Description / Narrative**

* **Who:** An unregistered visitor (no account yet).  
* **What:** The user wants to create a new account in the application by providing the necessary information (e.g., email, password).  
* **Why (Goal):** Having an account enables the user to access personalized features, such as uploading faces, managing credits, or saving a cart for face swaps.

---

## **Acceptance Criteria**

1. **Sign-Up Form Visibility**  
   * Given a user is on the **Sign-Up** page (or sees a sign-up modal),  
   * When the user selects “Sign Up,”  
   * Then they should see a form requesting **minimum credentials** (typically email, password, and password confirmation).  
2. **Data Validation**  
   * Given the user fills out the sign-up form,  
   * When the user clicks “Submit,”  
   * Then the system must validate the input (e.g., correct email format, password meets criteria).  
   * If validation fails, display **specific** error messages (e.g., “Invalid email,” “Password too short,” etc.).  
3. **Successful Account Creation**  
   * Given valid credentials are submitted,  
   * When the system processes the sign-up request,  
   * Then a **new user account** is created in the system (mock or real DB for now) with **status \= active** (or pending verification if applicable).  
   * And the user receives a **success confirmation** (e.g., “Your account has been created\!”).  
4. **Post-Sign-Up Experience**  
   * Upon successful sign-up, the user may be:  
     * Automatically **logged in** and redirected to a **dashboard** or welcome screen, **OR**  
     * Asked to **verify** their email address via a verification email (if your app has email verification).  
   * A relevant success page or message should appear.  
5. **Error Handling**  
   * If something goes wrong during sign-up (e.g., email already taken, network issue),  
   * Then the system should display a meaningful **error message** explaining the issue and how to proceed.

---

## **Constraints / Additional Notes**

* If implementing **email verification**, ensure a follow-up ticket covers sending the verification link.  
* For the **MVP**, we may skip advanced password policies or multi-factor auth.  
* Future enhancements might include **social sign-up** (Google, GitHub) or more profile fields.

---

## **Summary (For Human & AI)**

This user story ensures **unregistered visitors** can **create a new account** by filling out a **sign-up form** and receiving **feedback** on success or errors. Once successfully created, the **user** is **recognized** by the system (either logged in immediately or required to verify), enabling them to use the app’s personalized features. The acceptance criteria define **form validation**, **error messaging**, and **the post-sign-up flow**, so both **human developers** and **AI Agents** can implement the feature without ambiguity.

# 1 \- FT \- Overview

1. **Implement the sign-up form UI with email, password, and confirm password fields**  
2. **Validate sign-up form inputs and display appropriate error messages**  
3. **Handle sign-up form submission and integrate with the user registration API**  
4. **Display a sign-up success message and redirect the user (or prompt for email verification)**  
5. **(Optional) Initiate email verification process immediately after sign-up**

# ⚪ I want to sign in

**User Story**  
 **Title:** As a user I want to sign in

---

## **Description / Narrative**

* **Who:** A user who already has an account.  
* **What:** The user wants to log into the application with their existing credentials (e.g., email and password) in order to access personalized features.  
* **Why (Goal):** By signing in, the user gains access to their private data (faces, cart, swap history) and can perform actions that require authentication (e.g., initiating face swaps, managing credits).

---

## **Acceptance Criteria**

1. **Sign-In Form Visibility**

   * Given a user opens the **Sign-In** page (or modal),  
   * When the user chooses “Sign In,”  
   * Then they should see a form requesting **email** and **password** fields.  
2. **Validation of Input**

   * Given the user has typed in their email and password,  
   * When the user clicks “Submit” (or similar),  
   * Then the system checks if the credentials meet basic format validations (e.g., correct email format, non-empty password).  
   * If format validation fails, a **clear error message** (e.g., “Invalid email format”) is displayed.  
3. **Authentication Check**

   * Given the user’s input is valid in format,  
   * When the system verifies the credentials against the user database (mock or real),  
   * Then one of the following occurs:  
     * **Successful Sign-In**: The user’s session is established, and a success confirmation or redirect occurs.  
     * **Failed Sign-In**: An error message shows (“Incorrect email or password”) and the user remains on the sign-in page.  
4. **Post Sign-In Experience**

   * If **successful**, the user is logged in and either:  
     * Redirected to a **dashboard** page, **or**  
     * Shown a landing/welcome screen confirming they are now signed in.  
   * An indicator (e.g., user avatar or “logout” button) should confirm the user’s signed-in status.  
5. **Error Handling**

   * If the account is locked/disabled or not found, display a relevant error.  
   * If server or network issues occur, show a general “Try again later” message.

---

## **Constraints / Additional Notes**

* If you have **email verification** in place, you may optionally block sign-in for users with unverified emails.  
* For **MVP**, we may skip advanced security checks (e.g., 2FA, captcha).  
* Future enhancements might include **“Remember Me”** or **Social Sign-In** (Google, GitHub, etc.).

---

## **Summary (For Human & AI)**

This user story ensures that **returning users** can **log in** by providing **email** and **password**. If the credentials match an existing account, the user is **authenticated** and given access to **personalized features**. The acceptance criteria define **input validation**, **authentication checks**, and **post sign-in behaviors**, ensuring that both **human developers** and **AI Agents** can implement the sign-in process clearly.

# 2 \- FT \- Overview

1. **Implement the sign-in form UI with email and password fields**  
2. **Validate sign-in form inputs and display error messages for invalid data**  
3. **Handle sign-in form submission and manage user session/authentication**  
4. **Display a sign-in success message and redirect to the dashboard**  
5. **(Optional) Include a “Remember Me” option for persistent sessions**

# ⚪ recover my password

**User Story**  
 **Title:** As a user I want to recover my password

---

## **Description / Narrative**

* **Who:** A user who has an account but cannot remember their password.  
* **What:** The user wants a way to reset or recover their password using their registered email address (or another recovery method).  
* **Why (Goal):** By recovering their password, the user can regain access to their account and its features (faces, cart, swaps, etc.) without permanently losing their data.

---

## **Acceptance Criteria**

1. **“Forgot Password” Link**

   * Given the user is on the **Sign-In** page,  
   * When the user clicks “Forgot Password,”  
   * Then they should see a **password recovery** form or a prompt requesting their **email**.  
2. **Request for Recovery**

   * Given the user provides a valid email address in the recovery form,  
   * When the user clicks “Submit” (or “Send Reset Link”),  
   * Then the system sends a **password reset link** (or code) to that email **if** an account with that email exists.  
   * If the email is not associated with any account, display a **non-identifying** message (e.g., “If this email exists in our system, we’ll send a recovery link”).  
3. **Password Reset Confirmation**

   * After the user submits their email,  
   * The user sees a **confirmation message**: “Check your inbox for a password reset link.”  
   * The actual reset link can be **mock** in an MVP or a real email in production.  
4. **New Password Entry**

   * When the user opens the **reset link** (or inputs the recovery code),  
   * Then they are prompted for a **new password** (and possibly confirm it again).  
   * If the password meets validation criteria, the system updates the user’s password.  
5. **Successful Reset**

   * Given a valid new password is submitted,  
   * When the system confirms the reset,  
   * Then the user can **sign in** with the newly set password.  
   * A success message like “Your password has been updated” is displayed, and the user can proceed to log in.

---

## **Constraints / Additional Notes**

* For **MVP**, a simple email/password reset flow is sufficient. Future improvements might include **multi-factor** recovery or security questions.  
* Ensure the **reset link** or **token** has a short-lived expiration for security reasons.  
* For a mock scenario (no real email server), you can simulate or log the reset link to the console for testing.

---

## **Summary (For Human & AI)**

This user story ensures that **users** who **forget their password** can **recover** access to their account by **submitting** their email and **receiving** a **reset link** (or code). The **acceptance criteria** specify the **“Forgot Password”** link, the **email form**, the **reset link** handling, and the final step to **set a new password**. Both **human developers** and **AI Agents** can follow these requirements to implement a clear, secure, and user-friendly **password recovery** process.

# 3 \- FT \- Overview

1. **Add a “Forgot Password” link on the sign-in page**  
2. **Implement the password recovery form UI to capture the user's email**  
3. **Validate the recovery email input and handle form submission to request a reset link**  
4. **Display a confirmation message instructing the user to check their email**  
5. **Implement the password reset form UI for entering a new password and confirmation**  
6. **Validate new password inputs and update the password via the API**

# ⚪ verify my email

**User Story**  
 **Title:** As a user I want to verify my email

---

## **Description / Narrative**

* **Who:** A user who has created an account but has not yet verified their email address.  
* **What:** The user wants to confirm ownership of their provided email by clicking on a verification link or entering a verification code.  
* **Why (Goal):** By verifying the email, the user gains full access to features that require a trusted email (e.g., password recovery, email notifications, and possibly complete account functionality).

---

## **Acceptance Criteria**

1. **Verification Link/Code Generation**

   * Given the user has successfully signed up (or triggered an email verification manually),  
   * When the system processes this request,  
   * Then a **unique verification token** or link is sent to the user’s email address.  
   * Alternatively, a **verification code** could be generated for user input on the website.  
2. **Delivery of Verification Instructions**

   * Given the system sent a verification link or code,  
   * When the user checks their email inbox,  
   * Then they see an **email** with clear instructions and a link/code to verify their account.  
   * If the email fails, the user is notified to retry or check spam folders.  
3. **Verification Flow**

   * Given the user opens the link (or enters the code on a verification page),  
   * When the system validates the token/code,  
   * Then the user’s **email\_verified** status is set to **true** (or some equivalent flag),  
   * And a success message like “Your email is now verified” is displayed.  
4. **Access to Restricted Features**

   * If certain features are **restricted** to verified users only,  
   * Then once the email is successfully verified,  
   * The user can access or unlock these features (e.g., complete face swaps, purchase credits, or manage account data).  
5. **Error Handling**

   * If the token is invalid, expired, or has already been used, the system shows an error message like “Verification link invalid or expired. Please request a new link.”  
   * Users can re-request verification if needed.

---

## **Constraints / Additional Notes**

* For **MVP**, a simple **email link** approach is sufficient. Future enhancements might include **resend verification** triggers or advanced emailing templates.  
* If operating in a **mock** environment (no real email), you can simulate the link or log it to the console.  
* Make sure tokens or codes **expire** after a short duration for security.

---

## **Summary (For Human & AI)**

This user story ensures that **users** can **verify** their email address after signing up (or upon re-request). The system **generates** a **verification link** or code, **sends** it via email, and **updates** the user’s status to **verified** once validated. The acceptance criteria outline **token generation**, **email delivery**, **verification success**, and **error handling**, so **human developers** and **AI Agents** can implement a clear, secure **email verification** flow.

# 4 \- FT \- Overview

1. **Generate and include an email verification token/link during sign-up**  
2. **Send an email verification message with clear instructions and a verification link**  
3. **Implement the email verification page that processes the verification token**  
4. **Validate the token and update the user's email verification status**  
5. **Display a verification success message and redirect the user appropriately**  
6. **(Optional) Provide a “Resend Verification Email” option if needed**

# ⚪ browse public tags in the gallery

**User Story**  
 **Title:** As a user I want to browse public tags in the gallery

---

## **Description / Narrative**

* **Who:** A user (logged-in or guest) exploring the application’s public image gallery.  
* **What:** The user wants to see all available **tags** (e.g., “Beach,” “Portrait,” “Urban”) that categorize the public images and albums.  
* **Why (Goal):** By browsing tags, the user can discover relevant or interesting images/albums and quickly navigate through the gallery.

---

## **Acceptance Criteria**

1. **Tags Overview Page**

   * Given the user navigates to the **Public Gallery** or a specific **Tags** page,  
   * When the system loads the available tags (mock or real),  
   * Then the user should see a **listing** of each tag with a **name** and possibly an **image** or **icon** representing that tag.  
2. **Tag Cards / Tiles**

   * Each tag is displayed as a **card** or **tile** with a label (e.g., “Beach”) and an optional thumbnail or icon.  
   * Clicking/tapping a tag card should link to a page or modal showing **albums/images** associated with that tag.  
3. **Pagination or Infinite Scroll** (Optional)

   * If the list of tags is long, the user can scroll or navigate between pages to view more tags.  
   * This could be out of scope for the MVP if only a handful of tags exist.  
4. **Responsive Layout**

   * The tags listing should work across various devices (desktop, mobile).  
   * On small screens, the cards might stack vertically; on larger screens, they might form a grid.  
5. **Error Handling**

   * If tags fail to load (e.g., an API or mock data error), the user should see a **friendly message** or a **retry** button.

---

## **Constraints / Additional Notes**

* This user story focuses on **displaying** available tags. Browsing **albums** or **images** within a tag belongs to related user stories (e.g., “view albums in a tag”).  
* For an MVP with **mock data**, we can store tags in an array (like `mockTags`).  
* Future enhancements might include **tag search**, **filter by popularity**, or **user-generated tags**.

---

## **Summary (For Human & AI)**

This user story ensures that **any user** (logged in or guest) can **browse** the **public tags** in the gallery. The system **shows** each tag with a label and optional image, allowing the user to **discover** or **navigate** to albums/images that match each tag. The acceptance criteria outline how the **tag cards** appear, how the user **accesses** them, and **error handling**, enabling both **human developers** and **AI Agents** to implement a clear, user-friendly **tag browsing** experience.

# 5 \- FT \- Overview

1. **Implement a “Tags” listing page showing all available public tags**  
2. **Add tag cards with label and optional thumbnail or icon**  
3. **Provide navigation from the landing page or gallery page to the tag listing**  
4. **Handle “No tags found” message if no tags exist**  
5. **Ensure proper error handling and loading states for the tag data**  
6. **(Optional) Add pagination or infinite scrolling for the tag listing**

# FT1 \- Tags Listing Page

**Feature Ticket:** Implement a “Tags” Listing Page Showing All Available Public Tags

---

## **Description / Narrative**

Create a dedicated page for browsing all available public tags in the public gallery. This page should be built using the Next.js App Router and placed under the `(public-gallery)/tags` directory. It will display each tag as a card or tile (using a component such as `components/publicGallery/TagsList.tsx`) and will source its data from a mock data file (e.g., `lib/mockData.ts`). Each tag card must be clickable and should navigate to the tag detail page located at `app/(public-gallery)/tags/[tagSlug]/page.tsx`.

---

## **Acceptance Criteria**

1. **Page Location & Routing**  
   * The page must be created at:  
     `face-swap-app/app/(public-gallery)/tags/page.tsx`  
   * It should be accessible via navigation (for example, from the landing page or a “View All Tags” link).  
2. **Data Sourcing**  
   * The page should import a list of tag objects from a mock data file, e.g., `face-swap-app/lib/mockData.ts`.  
   * Each tag object should contain at least the following properties: `slug`, `name`, and optionally an `imageUrl` for a thumbnail.  
3. **UI Layout & Display**  
   * Use a responsive grid layout (via Tailwind CSS classes) to display each tag as a card.  
   * Each tag card should include:  
     * The tag’s **name** (e.g., “Beach”, “Portrait”).  
     * An optional **thumbnail** or icon (use a placeholder image if not provided).  
   * The design should follow the existing styling guidelines, using Tailwind CSS and optionally components from the `components/publicGallery/` directory (e.g., `TagsList.tsx`).  
4. **Navigation Interaction**  
   * Each tag card must be clickable.  
   * Clicking on a tag card should route the user to the corresponding tag detail page at:  
     `face-swap-app/app/(public-gallery)/tags/[tagSlug]/page.tsx`  
   * Ensure proper dynamic routing is implemented for tag detail pages.  
5. **Loading and Error States**  
   * Display a loading indicator (if necessary) while the mock data is being loaded.  
   * If no tags are available (i.e., the data array is empty), display a friendly message such as “No tags available.”  
6. **Accessibility & Feedback**  
   * The tag cards should be accessible (keyboard-navigable, proper ARIA labels if using icons).  
   * Provide any necessary hover or focus effects to indicate interactivity.

---

## **Constraints / Additional Notes**

* **Mock Data:**  
  * Use a file like `face-swap-app/lib/mockData.ts` to export an array of tag objects.

Example structure:  
ts  
Copier  
`// lib/mockData.ts`  
`export const mockTags = [`  
  `{`  
    `slug: 'beach',`  
    `name: 'Beach',`  
    `imageUrl: '/images/placeholder-beach.jpg',`  
  `},`  
  `{`  
    `slug: 'portrait',`  
    `name: 'Portrait',`  
    `imageUrl: '/images/placeholder-portrait.jpg',`  
  `},`  
  `// ... more tags`  
`];`

*   
* **Design Consistency:**  
  * Ensure that the styling is consistent with other pages (e.g., use Tailwind CSS classes already defined in your global styles and follow your design system).  
* **Technology Stack:**  
  * Next.js 14 with the App Router.  
  * Tailwind CSS for styling.  
  * Optional: Use Shadcn/ui components if available, for example, a Card component for tag cards.

---

## **Summary (For Human & AI)**

This feature ticket requires the implementation of a “Tags” listing page in the public gallery, located at `face-swap-app/app/(public-gallery)/tags/page.tsx`. The page must display all available public tags (sourced from `lib/mockData.ts`) in a responsive grid layout, with each tag presented as a clickable card that navigates to its detail page (`app/(public-gallery)/tags/[tagSlug]/page.tsx`). The implementation must include handling for loading states, empty data, and basic accessibility. This clear specification enables both human developers and AI Agents to implement the feature accurately according to the established project architecture.

# FT2 \- Tag Card

**Feature Ticket:** Add Tag Cards with Label and Optional Thumbnail or Icon

---

## **Description / Narrative**

Create a reusable **Tag Card** component that displays a tag's name and, optionally, a thumbnail image or icon. The component should be styled using the Shadcn/ui design system integrated with Tailwind CSS. It will be used on the public gallery’s tag listing page and should allow users to navigate to a tag detail page when clicked. This component must be responsive, accessible, and consistent with the overall look and feel of the application.

The component will consume tag data from the mock data file (e.g., `face-swap-app/lib/mockData.ts`) where each tag object includes at least a `slug` and `name`, and optionally an `imageUrl`.

---

## **Acceptance Criteria**

1. **Component Creation and File Location**  
   * The Tag Card component is created in:  
     `face-swap-app/components/publicGallery/TagCard.tsx`  
   * It is written in TypeScript using JSX and integrates Shadcn/ui components for base styling, with Tailwind CSS classes applied for custom styles and responsiveness.  
2. **UI Layout and Styling**  
   * The component displays the tag’s **name** prominently.  
   * If an `imageUrl` is provided, display the image as a thumbnail or icon alongside the tag name. If not provided, display a default placeholder icon or fallback style.  
   * Use Shadcn/ui primitives (or a Shadcn/ui Card component, if available) combined with Tailwind CSS classes to achieve a modern, consistent design.  
   * Ensure the component is responsive (adapts well to different screen sizes) and follows the design system specified in your Tailwind configuration.  
3. **Interactivity and Navigation**  
   * The entire card acts as a clickable element, using a Shadcn/ui button or link component that adheres to accessibility best practices.  
   * On hover and focus, the card should indicate interactivity (for example, a subtle background change or shadow).  
   * Clicking the card should navigate the user to the tag detail page at:  
     `face-swap-app/app/(public-gallery)/tags/[tagSlug]/page.tsx`  
     where `[tagSlug]` is dynamically replaced based on the tag’s `slug`.  
4. **Accessibility**  
   * Ensure the component is fully keyboard-navigable.  
   * Use semantic HTML elements (such as `<a>` or `<button>`) provided by Shadcn/ui.  
   * Provide appropriate ARIA attributes or `alt` text for images (e.g., “Thumbnail for \[tag name\]”).  
5. **Error Handling and Fallbacks**  
   * If the tag data is missing required fields (such as `name`), the component should either render a default message or not render the card.  
   * If no image/icon is provided, a default placeholder should be used to maintain visual consistency.  
6. **Integration with Mock Data**  
   * The component should be easily reusable in the Tags List page (e.g., `face-swap-app/app/(public-gallery)/tags/page.tsx`), which maps through the array of tag objects imported from `face-swap-app/lib/mockData.ts`.

---

## **Constraints / Additional Notes**

* **Frontend Stack:**  
  * The project uses Shadcn/ui for base component styling and Tailwind CSS for utility classes and custom styling. Ensure that Shadcn/ui components and Tailwind classes are used harmoniously.  
* **Design Consistency:**  
  * Follow the established design system in the project, including typography, spacing, and color schemes defined in `tailwind.config.js` and any Shadcn/ui configuration files.  
* **Reusability:**  
  * The Tag Card component should be designed to be reusable across multiple pages where tag representation is required.

---

## **Summary (For Human & AI)**

This feature ticket requires the creation of a reusable **Tag Card** component at `face-swap-app/components/publicGallery/TagCard.tsx` that displays a tag’s name and an optional thumbnail or icon. The component must integrate Shadcn/ui components with Tailwind CSS to ensure a modern, consistent, and responsive design. It should be fully interactive and accessible, serving as a clickable element that routes to the corresponding tag detail page (`face-swap-app/app/(public-gallery)/tags/[tagSlug]/page.tsx`). Additionally, it should handle missing data gracefully by using appropriate fallbacks. This clear specification is intended to ensure that both human developers and AI Agents can implement the feature without ambiguity.

# FT3 \- Navigation

**Feature Ticket:** Provide Navigation from the Landing Page or Gallery Page to the Tag Listing

---

## **Description / Narrative**

Develop a navigation element that allows users to access the complete list of public tags. This navigation should be available from key entry points in the application—specifically the Landing Page (`face-swap-app/app/page.tsx`) and the Public Gallery main page (`face-swap-app/app/(public-gallery)/page.tsx`). When users click on this navigation element (such as a link or button), they should be routed to the Tag Listing page located at `face-swap-app/app/(public-gallery)/tags/page.tsx`.

The navigation element should use Shadcn/ui components for base styling integrated with Tailwind CSS utilities to maintain a consistent design throughout the app. It must be accessible and responsive, ensuring that users on various devices can easily discover and use the navigation option.

---

## **Acceptance Criteria**

1. **Navigation Element Visibility**  
   * **Landing Page:**  
     * The Landing Page (`face-swap-app/app/page.tsx`) must include a clearly visible navigation element (e.g., a button or link) labeled “View All Tags” or similar.  
   * **Public Gallery Page:**  
     * Similarly, the Public Gallery main page (`face-swap-app/app/(public-gallery)/page.tsx`) must also include a navigation element that directs users to the tag listing.  
2. **Routing Functionality**

Clicking the navigation element should route the user to the Tag Listing page at:  
swift  
Copier  
`face-swap-app/app/(public-gallery)/tags/page.tsx`

*   
  * The routing should use Next.js 14 App Router's dynamic linking (e.g., using the `Link` component from `next/link` or an equivalent Shadcn/ui navigation component).  
3. **Styling & Responsiveness**  
   * The navigation element should be styled using Shadcn/ui components with Tailwind CSS classes to match the overall design of the application.  
   * It should be responsive, ensuring usability on both desktop and mobile devices.  
4. **Accessibility**  
   * The navigation element must be keyboard accessible and include appropriate ARIA attributes (if needed) so that screen readers can interpret it correctly.  
   * The element should have focus and hover styles to clearly indicate interactivity.  
5. **Error Handling**  
   * If routing fails or if there’s an issue with the link (e.g., due to misconfiguration), the user should see a fallback error message or be redirected to a safe default page.

---

## **Constraints / Additional Notes**

* **Directory Structure:**  
  * The navigation element on the Landing Page and Public Gallery Page should conform to the project’s directory architecture.  
  * The Tag Listing page is located at `face-swap-app/app/(public-gallery)/tags/page.tsx`.  
* **Technology Stack:**  
  * Use Next.js 14 with the App Router.  
  * Base styling should use Tailwind CSS with integration of Shadcn/ui components.  
* **Design Consistency:**  
  * Ensure that the navigation element’s styling (colors, typography, spacing) is consistent with other UI elements defined in your global styles and Shadcn/ui configuration.  
* **Reusability:**  
  * The navigation component can be designed as a reusable component (for example, a `ViewAllTagsButton` component in `face-swap-app/components/publicGallery/`) that can be imported into multiple pages.

---

## **Summary (For Human & AI)**

This feature ticket requires the implementation of a navigation element that directs users from both the Landing Page (`face-swap-app/app/page.tsx`) and the Public Gallery main page (`face-swap-app/app/(public-gallery)/page.tsx`) to the Tag Listing page (`face-swap-app/app/(public-gallery)/tags/page.tsx`). The solution must utilize Next.js 14 App Router for routing, integrate Shadcn/ui components for base styling, and apply Tailwind CSS for custom design consistency. The element should be responsive and accessible, providing a clear, error-free pathway for users to view all public tags. This detailed specification ensures both human developers and AI Agents have a clear guide for implementation.

# FT4 \- No Tags Found

**Feature Ticket:** Handle “No tags found” Message if No Tags Exist

---

## **Description / Narrative**

Develop functionality to gracefully handle scenarios when there are no public tags to display on the tag listing page. When the data source (e.g., the mock data array imported from `face-swap-app/lib/mockData.ts`) is empty or returns no tag objects, the application must inform the user by displaying a friendly “No tags available” message. This behavior should be implemented on the tag listing page located at `face-swap-app/app/(public-gallery)/tags/page.tsx`, ensuring a smooth user experience even in the absence of tag data.

The solution should integrate with the existing frontend stack using Next.js 14 with the App Router, styled with Tailwind CSS and Shadcn/ui components for consistency with the rest of the application.

---

## **Acceptance Criteria**

1. **Data Check Implementation**  
   * On the tag listing page (`face-swap-app/app/(public-gallery)/tags/page.tsx`), the component must check if the array of tag objects (imported from `face-swap-app/lib/mockData.ts`) is empty or undefined.  
2. **Display “No Tags Available” Message**  
   * If the tag array is empty, display a clear, centrally-aligned message on the page stating: “No tags available.”  
   * The message should be styled with Tailwind CSS and, if possible, incorporate Shadcn/ui typography components to match the design system.  
3. **Fallback for Errors**  
   * If there is an error retrieving the tag data (e.g., the import fails or data is not in the expected format), display a similar friendly error message (“No tags available” or “Unable to load tags. Please try again later.”).  
4. **Accessibility**  
   * Ensure that the message is accessible and can be read by screen readers.  
   * Use appropriate semantic HTML elements (e.g., a `<p>` or `<div>` with proper ARIA attributes if needed) to display the message.  
5. **Responsiveness and Consistency**  
   * The “No tags available” message must be responsive and visible on all device sizes.  
   * The styling should be consistent with the overall design of the public gallery pages.

---

## **Constraints / Additional Notes**

* **Mock Data Source:**  
  * The tag listing page should import data from a local mock data file located at `face-swap-app/lib/mockData.ts`. In the mock data, ensure that an empty array scenario is testable.  
* **Technology Stack:**  
  * Use Next.js 14 with the App Router for page routing.  
  * Tailwind CSS should be used for styling, and the design must be consistent with Shadcn/ui components if they are being utilized elsewhere in the project.  
* **Reusability:**  
  * The logic to handle empty data may be implemented as a small reusable helper component or function to maintain consistency across different pages if needed.  
* **Future Enhancements:**  
  * In the future, this message might be dynamically replaced by a call-to-action (e.g., “No tags available, please check back later” or “Add tags if you are an admin”) depending on the application’s evolving requirements.

---

## **Summary (For Human & AI)**

This feature ticket requires the implementation of functionality to handle scenarios where no public tags exist. On the tag listing page (`face-swap-app/app/(public-gallery)/tags/page.tsx`), if the imported array of tag objects is empty or if an error occurs while fetching the data, the system must display a friendly “No tags available” message. The solution must be styled consistently using Tailwind CSS and Shadcn/ui components, be responsive and accessible, and provide a smooth user experience even when no tags are present. This clear specification enables both human developers and AI Agents to implement the feature without ambiguity.

# FT5 \- Error State Handling

**Feature Ticket:** Ensure Proper Error Handling and Loading States for the Tag Data

---

## **Description / Narrative**

Develop robust error handling and loading state management for the tag listing page in the public gallery. This feature ensures that when the tag data is being fetched (even if it is from mock data in `face-swap-app/lib/mockData.ts`), users receive clear feedback via a loading indicator. Additionally, if an error occurs during data retrieval or if the data is empty, a user-friendly error or "no data" message should be displayed. The implementation should be integrated into the tag listing page located at `face-swap-app/app/(public-gallery)/tags/page.tsx` and should follow the design guidelines using Shadcn/ui components along with Tailwind CSS for styling.

---

## **Acceptance Criteria**

1. **Loading Indicator**  
   * **When** the tag listing page is loaded and the tag data is being fetched (from the mock data source),  
   * **Then** display a visually clear loading indicator (e.g., a spinner or progress bar) that matches the app's design system.  
   * **And** ensure that the loading indicator is accessible (e.g., announced by screen readers).  
2. **Error Handling**  
   * **When** an error occurs during the fetching of tag data (e.g., data is null, undefined, or the fetch operation fails),  
   * **Then** display a friendly error message such as “Unable to load tags. Please try again later.”  
   * **And** provide a retry mechanism (e.g., a “Retry” button) that allows the user to attempt loading the data again.  
3. **No Data Scenario**  
   * **When** the tag data array imported from `face-swap-app/lib/mockData.ts` is empty,  
   * **Then** display a message like “No tags available” in a user-friendly and prominent manner.  
4. **Integration with UI**  
   * The error and loading states should be integrated within the tag listing page (`face-swap-app/app/(public-gallery)/tags/page.tsx`) and should not break the page layout.  
   * Use Shadcn/ui components (if applicable) combined with Tailwind CSS for styling to ensure consistency with the rest of the application.  
5. **Accessibility and Responsiveness**  
   * All loading and error messages must be accessible (i.e., use appropriate semantic HTML and ARIA attributes).  
   * The implementation should be fully responsive and display correctly on various screen sizes.

---

## **Constraints / Additional Notes**

* **Data Source:**  
  * The tag data is sourced from a mock data file, e.g., `face-swap-app/lib/mockData.ts`, which exports an array of tag objects.  
* **Technology Stack:**  
  * Use Next.js 14 with the App Router.  
  * Styling must be done using Tailwind CSS, and if applicable, Shadcn/ui components should be integrated.  
* **Reusability:**  
  * Consider abstracting the loading and error handling logic into a reusable component or custom hook (e.g., `useFetchTags`) that can be reused across other pages in the future.

---

## **Summary (For Human & AI)**

This feature ticket requires implementing robust loading and error handling for fetching tag data on the tag listing page (`face-swap-app/app/(public-gallery)/tags/page.tsx`). The implementation must display a clear loading indicator while the data is being fetched, handle errors gracefully by showing a user-friendly error message with a retry option, and provide a fallback message if no tag data exists. The solution should adhere to the project’s design standards using Shadcn/ui and Tailwind CSS, ensuring accessibility and responsiveness. This detailed specification is intended to guide both human developers and AI Agents in coding the feature accurately without ambiguity.

# FT6 \- Infinite Scroll

**Feature Ticket:** Add Infinite Scrolling for the Tag Listing

---

## **Description / Narrative**

Enhance the tag listing page in the public gallery so that it supports infinite scrolling. Instead of loading all tags at once, the page should load a limited number of tag cards initially and automatically load additional tags as the user scrolls down. This functionality should improve performance and user experience, especially when the number of tags is large. The implementation should use Next.js 14 with the App Router and be styled with Tailwind CSS in combination with Shadcn/ui components for consistency.

The infinite scrolling behavior should integrate with the mock data (e.g., from `face-swap-app/lib/mockData.ts`). In a mock setup, the data can be paginated client-side, simulating a real API call that returns chunks of data.

---

## **Acceptance Criteria**

1. **Initial Data Load**  
   * On the tag listing page located at `face-swap-app/app/(public-gallery)/tags/page.tsx`, the component loads an initial subset of tag cards (e.g., 10 tags).  
2. **Infinite Scrolling Behavior**  
   * As the user scrolls near the bottom of the page, additional tag cards are automatically loaded and appended to the existing list.  
   * The loading mechanism should be smooth and should not block the UI.  
   * A loading indicator (spinner or progress bar) should be displayed while additional tags are being fetched/loaded.  
3. **Mock Data Pagination**  
   * Use the mock data from `face-swap-app/lib/mockData.ts` and simulate pagination. For example, if the mock data array contains 50 tags, the component should initially load the first 10 and then load the next 10 upon each scroll event until all tags are displayed.  
   * If no more tags are available, the infinite scroll should cease loading further content and optionally display a message like “All tags loaded.”  
4. **Error Handling**  
   * If an error occurs during the loading of additional tags (e.g., a simulated fetch failure), display an appropriate error message (e.g., “Unable to load more tags, please try again.”) and provide a way to retry the loading process.  
5. **Responsiveness and Performance**  
   * The infinite scrolling implementation should be responsive and perform well across different devices and screen sizes.  
   * Ensure that the mechanism does not cause excessive re-rendering or memory issues.  
6. **Accessibility**  
   * Ensure that the infinite scrolling behavior is accessible. For instance, if a loading indicator is used, it should be announced to screen readers.  
   * Keyboard navigation should not be disrupted by the dynamic loading of additional content.

---

## **Constraints / Additional Notes**

* **Technology Stack:**  
  * Use Next.js 14 (App Router), Tailwind CSS, and Shadcn/ui for styling.  
  * The infinite scrolling should work with client-side mock data and be designed to easily integrate with a real API in the future.  
* **Data Source:**  
  * The mock data is located at `face-swap-app/lib/mockData.ts` and should be structured to support paginated loading (e.g., an array of tag objects).  
* **Design Consistency:**  
  * The design of the tag cards and the loading indicator should match the overall design system of the application.  
* **Reusability:**  
  * Consider abstracting the infinite scrolling logic into a custom hook (e.g., `useInfiniteScroll`) for reuse in other parts of the application if needed.

---

## **Summary (For Human & AI)**

This feature ticket requires the implementation of infinite scrolling on the tag listing page (`face-swap-app/app/(public-gallery)/tags/page.tsx`). The component should initially load a subset of tag cards from mock data and automatically load additional tags as the user scrolls near the bottom of the page. The solution must include a loading indicator, handle errors gracefully, and be responsive and accessible. The implementation should use Next.js 14, Tailwind CSS, and Shadcn/ui, and it should be designed with reusability in mind. This clear specification enables both human developers and AI Agents to code the infinite scrolling feature without ambiguity.

# ⚪ filter or search the public gallery

**User Story**  
 **Title:** As a user I want to filter or search the public gallery

---

## **Description / Narrative**

* **Who:** A user (logged-in or guest) exploring the public gallery, looking for specific images, albums, or tags.  
* **What:** The user wants to **filter** or **search** the displayed gallery content (e.g., by text input, tag selection, or model/studio filter).  
* **Why (Goal):** By narrowing down results based on keywords or categories, the user can quickly find images or albums of interest rather than scrolling through all available content.

---

## **Acceptance Criteria**

1. **Search/Filter Input**

   * Given the user is on the **Public Gallery** page,  
   * When a **search bar** or **filter UI** is displayed,  
   * Then the user can type a keyword (e.g., “beach” or “holiday”) or select a filter (e.g., specific tag or model).  
2. **Real-Time or On-Submit Filtering**

   * After the user enters a keyword or selects a filter,  
   * The gallery listing **updates** to show only the items (tags/albums/images) that match the search criteria.  
   * This can happen automatically (real-time) or after clicking a “Search” button.  
3. **No Results Message**

   * If no items match the user’s search/filter,  
   * Then a **friendly message** like “No results found for ‘X’” should appear, with an option to clear or refine the search.  
4. **Reset / Clear Filters**

   * Given the user has applied one or more filters,  
   * When the user clicks “Clear” or “Reset,”  
   * Then the gallery reverts to **show all** items again.  
5. **Performance & Feedback**

   * If the filtering process takes time (even if mocked), provide a short **loading indicator**.  
   * In an MVP with mock data, it can be instant. For real APIs, handle loading states gracefully.

---

## **Constraints / Additional Notes**

* For an MVP with **mock data**, we might store the gallery items in an array, then filter them in client-side code.  
* Future enhancements could include **advanced filters** (e.g., by date, popularity, model name, studio).  
* Be mindful of **accessibility**: the search or filter controls should be keyboard-accessible and screen-reader-friendly.

---

## **Summary (For Human & AI)**

This user story enables **users** to **quickly find** specific images, albums, or tags within the **public gallery** by **searching** (text input) or **filtering** (tag or other criteria). The **acceptance criteria** detail how the search bar and filter UI should function (real-time or button submit), handling of **“no results,”** and **reset** behavior. This provides both **human developers** and **AI Agents** a clear guide for implementing a user-friendly **gallery filtering** experience.

# 6 \- FT \- Overview

1. **Add a search bar for text-based filtering in the public gallery**  
2. **Implement a filter bar for tags, models, and other criteria**  
3. **Display a “No results found” message when no items match the search/filter**  
4. **Include a “Clear Search” or “Reset Filters” button**  
5. **Provide loading or progress feedback during filtering**  
6. **Persist user’s last applied filters/search term across navigation**

# ⚪ view albums in a tag

**User Story**  
 **Title:** As a user I want to view albums in a tag

---

## **Description / Narrative**

* **Who:** A user (logged-in or guest) who has discovered or clicked on a specific tag in the public gallery.  
* **What:** The user wants to see all **albums** associated with that tag—e.g., “Beach” might have multiple photo albums like “Summer 2023” or “Sunsets.”  
* **Why (Goal):** By viewing the albums linked to a tag, the user can further explore relevant collections of images without rummaging through unrelated content.

---

## **Acceptance Criteria**

1. **Tag Detail Page**

   * Given the user selects or clicks a **tag** (e.g., “Beach”) from the public gallery,  
   * When the system loads the **Tag Detail** page (or section),  
   * Then the user sees a **list of albums** that are labeled as belonging to “Beach.”  
2. **Album Cards**

   * Each album is displayed as a **card** or **tile** with a title (e.g., “Summer 2023”), a cover image (if available), and an optional short description (e.g., “Highlights from June”).  
   * Clicking an album card should lead the user to that album’s image gallery (if a future user story covers viewing images in an album).  
3. **Paging / Scrolling**

   * If there are many albums under this tag, the user can scroll or navigate across pages (optional for MVP).  
   * The user can still see a **back to tags** link or **home** link to easily return to the main gallery or tag listing.  
4. **No Albums Found**

   * If a tag has no albums associated with it,  
   * Then display a friendly message like “No albums found for this tag” and/or suggest other tags.  
5. **Mock Data or Real Data**

   * For MVP, we can store album references in a mock array (e.g., each tag object has an `albums: []` field).  
   * The page filters or fetches only the albums relevant to the chosen tag.

---

## **Constraints / Additional Notes**

* This user story specifically focuses on **albums** under a **single tag**. Viewing **images** inside an album is a separate user story.  
* Future enhancements may include additional details on each album (dates, number of images, popularity).

---

## **Summary (For Human & AI)**

This user story ensures that **users** can **navigate** from a **tag** (e.g., “Beach”) to see all **albums** associated with that tag. The **acceptance criteria** describe **album cards**, possible **paging**, and how the system displays an appropriate **no-results message** if no albums exist. Both **human developers** and **AI Agents** can use these requirements to implement a clear, user-friendly **tag-to-albums** browsing flow.

# 7 \- FT \- Overview

1. **Implement a Tag Detail page to display albums associated with a specific tag**  
2. **Create album cards showing cover image, title, and description for each album**  
3. **Add routing logic (e.g., `[tagSlug]/page.tsx`) to fetch and display the appropriate albums**  
4. **Handle ‘No albums found’ scenario when a tag has zero albums**  
5. **Provide a ‘Back to Tags’ or ‘Back to Gallery’ link for easy navigation**

# ⚪ favorite/bookmark certain public images or albums

**User Story**  
 **Title:** As a user I want to favorite or bookmark certain public images or albums

---

## **Description / Narrative**

* **Who:** A user (logged-in) exploring the public gallery who wants to revisit specific images or albums later.  
* **What:** The user wants a way to mark (“favorite” or “bookmark”) certain items so they appear in a personal favorites list.  
* **Why (Goal):** By favoriting items, the user can quickly access them in the future without having to search or browse through the entire gallery again.

---

## **Acceptance Criteria**

1. **Favorite/Bookmark Button**

   * Given the user sees an **image card** or **album card** in the public gallery,  
   * When the user clicks a **“Favorite”** or **“Bookmark”** icon or button,  
   * Then the item is added to their **favorites** list in the user’s private profile/data.  
2. **Feedback on Favorite Action**

   * When the user taps the **Favorite** button,  
   * A **visual cue** (e.g., icon changes color or text changes to “Favorited”) confirms the action.  
   * If an error occurs (mock or real), a short message appears: “Unable to favorite. Please try again.”  
3. **Prevent Duplicate Favorites**

   * If the user has already favorited an item,  
   * Then the **button** should indicate it is **already favorited** (e.g., highlighted/starred) to avoid confusion.  
   * Clicking again could **unfavorite** the item (depending on design).  
4. **Favorites List / Page**

   * Given the user has favorited one or more items,  
   * When the user navigates to a **“Favorites”** page or section of their dashboard,  
   * Then they see a list of all **favorited** images or albums, allowing them to revisit or remove items from the list.  
5. **Persistence**

   * The favorite status must **persist** across sessions as long as the user is logged in (i.e., store it in user-specific data, not just in-memory).  
   * If we’re using a mock setup, we can store it in an array or context, but plan for future real DB integration.

---

## **Constraints / Additional Notes**

* **Authentication**: Favoriting likely requires the user to be signed in so their list can be personal and saved.  
* **UX**: The UI for “favorite” can be a **heart icon**, **star icon**, or a simple “Add to Favorites” button.  
* **Future Enhancements**: Sorting favorites, tagging favorites, or adding them to custom collections.

---

## **Summary (For Human & AI)**

This user story lets **users** **favorite** or **bookmark** public images/albums they find interesting. It specifies how to **mark** them, **show feedback**, and **persist** them in a **favorites list**. The acceptance criteria ensure both **human developers** and **AI Agents** know how to implement the feature, including preventing duplicates, displaying a favorites list, and handling sign-in requirements.

# 8 \- FT \- Overview

1. **Add a Favorite/Bookmark button/icon on public image cards**  
2. **Implement UI feedback to indicate an item is favorited**  
3. **Create functionality to toggle favorite status (favorite/unfavorite)**  
4. **Persist favorited items in a user-specific favorites list (mock or in-memory)**  
5. **Develop a Favorites page for viewing all bookmarked images or albums**

# ⚪ add images to my cart

**User Story**  
 **Title:** As a user I want to add images to my cart

---

## **Description / Narrative**

* **Who:** A logged-in user (or potentially a guest, if guest carts are allowed) browsing the public gallery.  
* **What:** The user wants a way to select one or more images and accumulate them in a “cart,” preparing for future actions like face swaps.  
* **Why (Goal):** By adding images to a cart, the user can easily keep track of which images they plan to use in a face swap without having to initiate a swap immediately or lose their selection.

---

## **Acceptance Criteria**

1. **Add to Cart Button**

   * Given the user is viewing the **public gallery** (albums, images),  
   * When they see each **image card**,  
   * Then they should be able to click an **“Add to Cart”** button (or icon) on that card.  
2. **Immediate Feedback**

   * When the user clicks “Add to Cart,”  
   * The **cart state** (stored in memory or a mock context) is updated to include the selected image’s info (ID, title, thumbnail, etc.).  
   * The user sees a **confirmation** that the image was added (e.g., a toast message or a cart icon increment).  
3. **Prevent Duplicate Adds**

   * If an image is already in the cart,  
   * Then the user either sees the button disabled or text changed to “Added” to indicate it’s already in the cart.  
   * No duplicate entries should appear in the cart list.  
4. **Persisted Cart Across Navigation**

   * Given the user added images to the cart,  
   * When the user navigates to other pages in the app (e.g., to view other tags/albums),  
   * Then the **cart content** remains intact until manually cleared or the session ends.  
5. **Viewing the Cart**

   * Given the user has at least one image in the cart,  
   * When they open the **Cart Page** (e.g., `/dashboard/cart`),  
   * Then they see a list of all currently added images, including any relevant details (thumbnail, title).

---

## **Constraints / Additional Notes**

* **Authentication**: If the app requires sign-in for cart functionality, a guest user might see a prompt to sign in first. Otherwise, a guest cart can be session-based.  
* **Error Handling**: If adding to the cart fails (mock scenario or real), show an error message and allow retry.  
* **Future Enhancements**: Removing items from the cart, adjusting item details, or persisting the cart to a database.

---

## **Summary (For Human & AI)**

This user story ensures that **browsers of the public gallery** can easily **add images** to a **cart** for later face swap actions. It specifies how the “Add to Cart” button appears on each image card, how the cart updates on click, how duplicates are handled, and how the user sees confirmation. Both **human developers** and **AI Agents** can follow these acceptance criteria to implement a clear, user-friendly **cart** feature.

# 9 \- FT \- Overview

1. **Provide an “Add to Cart” button on each public gallery image card**  
2. **Display confirmation feedback upon adding an image to the cart**  
3. **Persist cart state (session-level) across navigation**  
4. **Indicate cart item count or status in the UI (e.g., navbar icon)**  
5. **Allow removal of images from the cart**  
6. **Implement a dedicated cart page to view all added images**  
7. **Prevent duplicate adds of the same image**

# FT1 \- Add To Cart Button

**Feature Ticket:** Provide an “Add to Cart” button on each public gallery image card

---

## **Description / Narrative**

* We need a straightforward way for users to add images from the public gallery to their cart.  
* Each displayed image card in the gallery should include a button labeled (or icon-labeled) “Add to Cart.”  
* This ensures the user can quickly select images they plan to use for face swaps, without leaving the current gallery browsing flow.

---

## **Requirements / Acceptance Criteria**

1. **UI Placement**

   * On every public gallery image card, there must be a clearly visible **“Add to Cart”** button.  
   * It can appear on hover/focus or be permanently displayed, depending on the design.  
2. **Button Label and Appearance**

   * The button text should read: **“Add to Cart.”**  
   * Alternatively, you may use an icon (shopping cart icon) with a tooltip or label if that fits the design system.  
   * The button must match the existing app style (colors, typography, or Shadcn/ui component conventions).  
3. **Click Handling**

   * When the user clicks **“Add to Cart,”** the selected image’s relevant data (e.g., image ID, thumbnail URL, title) is appended to the cart state in the client.  
   * The button transitions to a state indicating it has been added (e.g., “Added\!” or a disabled button) to avoid confusion about multiple adds.  
4. **Feedback & Confirmation**

   * A brief visual confirmation (e.g., toast message, or cart icon updating its count) informs the user that the image was successfully added.  
   * If an error occurs (mock or real), a simple error message is displayed, allowing the user to retry.  
5. **Accessibility**

   * The button must be **keyboard-accessible** (focusable).  
   * If using icons, include **aria-label** or an accessible name for screen readers.  
6. **Resilience**

   * Must not break or reset if the user navigates around the gallery. The button remains functional as long as the cart logic is loaded on the page.

---

## **Constraints / Additional Notes**

* **No real backend** integration is required at this stage; we operate on a **mock** or client-side cart state only.  
* Ensure that the final implementation aligns with the overall design (e.g., card layout, Shadcn/ui components, Tailwind styling).  
* Future tickets may cover **removing** items from the cart or **persisiting** the cart to a backend, so keep the code flexible for expansion.

---

## **Summary (For Human & AI)**

This feature ensures that **each public gallery image card** includes a visible **“Add to Cart”** button. When clicked, the **image** is **added** to the **cart’s in-memory state**, and the UI **confirms** success via a visual indicator (e.g., toast message or updated cart icon). This lets a **user** accumulate images for **face swaps** without leaving the gallery. The requirements detail how an AI or human developer can implement this, covering **button labeling**, **click behavior**, **feedback** mechanisms, and **accessibility** considerations.

# ⚪ view and manage my cart

**User Story**  
 **Title:** As a user I want to view and manage my cart

---

## **Description / Narrative**

* **Who:** A user (most likely logged in) who has added images to their cart in preparation for a face swap or other actions.  
* **What:** The user wants to open a dedicated “Cart” view to see all items they’ve selected, and manage those items (e.g., remove some images, proceed to the next step).  
* **Why (Goal):** By having a centralized cart page, the user can easily review, organize, or modify their selected images before finalizing any face swap actions or purchases.

---

## **Acceptance Criteria**

1. **Dedicated Cart Page**

   * Given the user has added at least one image to the cart,  
   * When the user navigates to the **Cart Page** (e.g., `/dashboard/cart`),  
   * Then they see a list of all **currently added** images (titles, thumbnails, or relevant info).  
2. **Remove or Clear Items**

   * When viewing the cart, the user can remove individual images (e.g., a “Remove” or “X” button next to each item).  
   * Alternatively, they can clear the entire cart if needed (a “Clear Cart” button), which empties the cart state.  
3. **Update / Sync Cart State**

   * If the user removes or clears items,  
   * The **cart state** (stored in memory, context, or a mock DB) updates immediately.  
   * The UI reflects the change (items disappear, total count updates, etc.).  
4. **Confirmation or Next Step**

   * If the user wants to proceed (e.g., to face swap or checkout),  
   * A “Proceed” or “Continue” button leads them to the next step (face selection, payment, or further action).  
   * If an error occurs (in a mock scenario, for example), display an appropriate message.  
5. **Persistence (Session Scope)**

   * The cart contents remain consistent as the user navigates through the site.  
   * If the user logs out (or the session ends), the cart may reset, depending on design. (For an MVP, in-memory cart is sufficient.)

---

## **Constraints / Additional Notes**

* **Authentication**: Typically, a cart is tied to the user’s session or account. If guests can have a cart, they’ll lose it upon session expiration unless extra steps are taken.  
* **Visual Feedback**: The cart page should show item thumbnails or minimal detail to let the user recognize each image.  
* **Future Enhancements**: Automatic saving to a backend for persistent carts across devices, or showing cart item counts in the site header.

---

## **Summary (For Human & AI)**

This user story enables a **user** to **view** all images in their **cart** and **manage** them (remove unwanted items, clear the entire cart, or proceed to the next step). The acceptance criteria define the **Cart Page** layout, item **removal** features, **session-based** persistence, and **navigation** to further actions. Both **human developers** and **AI Agents** can implement these guidelines to create a user-friendly, flexible **cart management** experience.

# 10 \- FT \- Overview

1. **Create a dedicated “Cart” page to display all added images**  
2. **Provide the ability to remove individual items from the cart**  
3. **Implement a “Clear Cart” option to empty the cart**  
4. **Show cart item count and update in real time**  
5. **Offer a “Proceed” button to face swap or checkout actions**

# ⚪ remove images from my cart

**User Story**  
 **Title:** As a user I want to remove images from my cart

---

## **Description / Narrative**

* **Who:** A user (likely logged in) who has already added images to their cart.  
* **What:** The user wants to take one or more images *out* of the cart before finalizing a face swap or any other action.  
* **Why (Goal):** Removing unwanted items ensures the user only swaps faces on the images they actually want, avoiding confusion or extra steps.

---

## **Acceptance Criteria**

1. **Removal Controls**

   * Given the user has navigated to their **Cart Page** (e.g., `/dashboard/cart`) and sees one or more images,  
   * When the user clicks a **“Remove”** or “Delete” button/icon next to a specific image,  
   * Then that image is **immediately removed** from the cart’s state.  
2. **Instant Feedback**

   * Upon removing an image, the user sees an **updated cart** list, and the removed image no longer appears.  
   * If an error (in a mock scenario or real) occurs during removal, a short **error message** displays (e.g., “Unable to remove image, please try again”).  
3. **Cart State Update**

   * The cart’s item count and any relevant totals (if needed) update accordingly.  
   * The user should remain on the cart page, with no forced page reload unless required by design.  
4. **Undo or Re-Add (Optional)**

   * If the design includes an **undo** feature or a short toast message (“Image removed. Undo?”), the user can revert the removal.  
   * If not included in the MVP, the user can simply re-add the image from the public gallery if they change their mind.  
5. **Empty Cart Handling**

   * If the user removes the last image from the cart, show a **friendly message** like “Your cart is empty” and optionally a link to return to the gallery.

---

## **Constraints / Additional Notes**

* **Authentication**: If carts are tied to a user account, ensure the user is signed in; if a guest cart is supported, handle session scope accordingly.  
* **Future Enhancements**: A “remove all” or “clear cart” option, batch removal, or advanced prompts before removing multiple items.

---

## **Summary (For Human & AI)**

This user story covers the action of **removing** unwanted images from a **cart**. The **acceptance criteria** define how the user **initiates removal**, how the **cart updates** immediately, and what feedback or error handling the user sees. Both **human developers** and **AI Agents** can implement these details to create a straightforward, intuitive **remove-from-cart** experience.

# 11 \- FT \- Overview

1. **Provide a “Remove” button/icon for each item in the cart**  
2. **Implement immediate feedback or confirmation when removing an item**  
3. **Update cart item count dynamically upon removal**  
4. **(Optional) Offer an “Undo” window or button to revert accidental removal**  
5. **Handle errors or conflicts if removing an item fails**

# ⚪ upload face images to my private library

**User Story**  
 **Title:** As a user I want to upload face images to my private library

---

## **Description / Narrative**

* **Who:** A logged-in user who needs to store personal face images for future face-swap operations.  
* **What:** The user wants to **upload** face photos into their **private library**, each possibly labeled or tagged.  
* **Why (Goal):** Having a **private face library** lets the user quickly select from their own stored face images when performing face swaps, without re-uploading each time.

---

## **Acceptance Criteria**

1. **Upload Interface**

   * Given the user is on the **Faces** section of their dashboard (e.g., `/(dashboard)/faces`),  
   * When they click “Upload New Face,”  
   * Then they should see a file upload form or button, allowing them to select an image from their device.  
2. **Validation**

   * When the user selects an image,  
   * The system checks the **file type** (e.g., `.png`, `.jpg`) and possibly a **size limit** (e.g., 5MB max).  
   * If the file is invalid (wrong type or too large), an error message appears (e.g., “Unsupported file type” or “File too large”).  
3. **Preview / Label** (Optional)

   * If desired, once the user selects a valid image, a **preview** is shown.  
   * The user can optionally add a **label** or name for the face (e.g., “Smiling Face,” “Profile Shot”).  
4. **Upload Processing**

   * When the user confirms the upload,  
   * The image is sent to the application’s storage (mock or real).  
   * If successful, the face image is added to the user’s private library array (e.g., `mockFaces` or DB).  
5. **Feedback & Confirmation**

   * After a successful upload, the user sees the new face image **appended** to their faces list, along with any label provided.  
   * If an error occurs (e.g., network issue in a real scenario), an error message prompts the user to retry.  
6. **Accessibility & Security**

   * The upload feature must be **keyboard-accessible**.  
   * If user authentication is required, ensure only logged-in users can upload private faces.  
   * For mock scenarios, simply store the image in a temporary array or local object.

---

## **Constraints / Additional Notes**

* **Authentication**: Uploading private faces should require the user to be logged in, as these faces are private data.  
* **File Storage**: In an MVP or mock scenario, data can be stored in memory or a mock folder. Production might require a secure hosting solution (e.g., Supabase Storage or a cloud bucket).  
* **Future Enhancements**: Cropping/rotation tools, face detection/validation, multiple file uploads at once, or image tagging for better organization.

---

## **Summary (For Human & AI)**

This user story enables **logged-in users** to **upload personal face images** into a **private library** for use in face swaps. The **acceptance criteria** define how the user **selects**, **previews**, and **confirms** an upload, how the system **validates** and **stores** the file, and how **feedback** is provided. Both **human developers** and **AI Agents** can follow these guidelines to create a secure, user-friendly **face upload** feature.

# 12 \- FT \- Overview

1. **Create an “Upload Face” button and form**  
2. **Validate image file type and size before uploading**  
3. **Show a preview of the selected face image (optional)**  
4. **Store uploaded face image in the user’s private library (mock or real)**  
5. **Provide success/failure feedback upon upload completion**

# ⚪ label and organize my faces

**User Story**  
 **Title:** As a user I want to label and organize my faces

---

## **Description / Narrative**

* **Who:** A logged-in user who has uploaded one or more face images to their private library.  
* **What:** The user wants to **label** (e.g., “Smiling Face,” “Side Profile”) and possibly **organize** (sort, categorize) their faces for easy selection during face swaps.  
* **Why (Goal):** By clearly labeling and organizing their faces, the user can quickly identify which face image to use, especially if they have many faces stored.

---

## **Acceptance Criteria**

1. **Face Labeling**

   * Given the user is in their **Faces** dashboard section,  
   * When the user clicks on an **“Edit Label”** or similar action for a face,  
   * Then they can enter a **name or label** (e.g., “Happy Face,” “Profile Shot”).  
   * Upon saving, the label is updated and displayed prominently next to that face’s thumbnail.  
2. **Sorting / Filtering** (Optional)

   * If the user has multiple faces,  
   * They can sort them by **name**, **date uploaded**, or **label**, or filter by partial text match.  
   * This is optional for MVP but beneficial for organization if numerous faces are present.  
3. **Category / Folder Grouping** (Optional)

   * If the system supports grouping or categorizing faces,  
   * Then the user can create simple “folders” or “categories” (e.g., “Work Profile,” “Family Shots”),  
   * And move faces into these categories for better organization.  
4. **Instant Feedback**

   * After editing a label or reorganizing faces,  
   * The user sees the **updated label** or the new position (if sorted) without needing a page refresh.  
   * If an error occurs (in a mock or real environment), a short message indicates the issue (“Couldn’t update label, please retry”).  
5. **Data Persistence**

   * If the user logs out and back in, the **labels** and any **organization** remain intact.  
   * In a mock setup, storing label info in an array or object is sufficient. In production, it would go in a database.

---

## **Constraints / Additional Notes**

* **Authentication:** Only logged-in users can view and label their private faces.  
* **MVP vs. Future:** For an MVP, a simple “label” field may suffice. Future expansions could include tags, categories, or advanced face attributes.  
* **UX:** Provide an “Edit” button or inline editing to rename a face quickly. If no sorting/filtering is implemented, the user might still see all faces in chronological order by default.

---

## **Summary (For Human & AI)**

This user story empowers **users** to **label** and potentially **organize** their **private face images**. The **acceptance criteria** detail how they **edit** face labels, optionally **sort/filter** them, and ensure **data persistence**. Both **human developers** and **AI Agents** can implement these requirements to give users a clear, easy-to-use system for **managing** multiple face images in their library.

# 13 \- FT \- Overview

1. **Implement face labeling fields and inline editing functionality**  
2. **Create sorting/filtering options for faces (by label, date, etc.)**  
3. **(Optional) Add folder/category structure for grouping faces**  
4. **Enable real-time updates to labels and organization**  
5. **Provide feedback messages on successful or failed label changes**

# ⚪ remove or delete a face from my private library

**User Story**  
 **Title:** As a user I want to remove or delete a face from my private library

---

## **Description / Narrative**

* **Who:** A logged-in user who has one or more face images uploaded to their private library.  
* **What:** The user wants the ability to **remove** a specific face image that is no longer needed or is outdated.  
* **Why (Goal):** By deleting unnecessary faces, the user keeps their library organized and avoids confusion when selecting a face image for swaps.

---

## **Acceptance Criteria**

1. **Delete Action**

   * Given the user is in their **Faces** dashboard section,  
   * When they click a **“Delete”** or **“Remove”** button/icon on a specific face card/entry,  
   * Then the system prompts for confirmation to ensure the user truly wants to remove it.  
2. **Confirmation Prompt**

   * Upon initiating the delete action, a **confirm dialog** or modal appears, stating: “Are you sure you want to delete this face image?”  
   * The user can click “Yes” (or “Delete”) to proceed, or “No” (or “Cancel”) to abort.  
3. **Successful Deletion**

   * If the user confirms,  
   * The system **removes** that face from the private library array/mock data,  
   * The **Faces list** refreshes to reflect that the image no longer exists.  
   * A short **success message** (“Face image deleted”) may be displayed.  
4. **Error Handling**

   * If an error occurs during deletion (mock or real), an error message is shown (“Unable to delete face, please retry”).  
   * The user can re-attempt deletion if needed.  
5. **No Undelete for MVP**

   * For an MVP, once deleted, the face image is permanently removed. If advanced recovery is desired, that’s a future story (e.g., trash bin or versioning).  
6. **Data Persistence**

   * If the user logs out and back in, the deleted face remains gone.  
   * For a mock environment, store the updated list in memory. In production, remove from the database or storage.

---

## **Constraints / Additional Notes**

* **Authentication**: Only the **owner** of the face library (logged-in user) can delete their own face images.  
* **UX**: Provide a clear visual to avoid accidental deletion (e.g., confirm dialog or an “are you sure?” message).  
* **Future Enhancements**: Add a “recently deleted” concept or an undo feature to restore accidentally removed faces.

---

## **Summary (For Human & AI)**

This user story ensures that **logged-in users** can **delete** (permanently remove) an unwanted **face** from their private library. The **acceptance criteria** cover the **delete button**, **confirmation prompt**, **list refresh**, **error handling**, and **persistence** concerns. Both **human developers** and **AI Agents** can implement these requirements to create a user-friendly and secure **face deletion** feature.

# 14 \- FT \- Overview

1. **Add a “Delete” button for each face in the user’s library**  
2. **Show a confirmation dialog before removing a face**  
3. **Update the user’s face list immediately upon deletion**  
4. **Provide success/failure feedback after the delete action**  
5. **Handle the “no faces left” scenario if the user deletes all faces**

# ⚪ edit the label or metadata of a face in my library

**User Story**  
 **Title:** As a user I want to edit the label or metadata of a face in my library

---

## **Description / Narrative**

* **Who:** A logged-in user who has uploaded one or more face images into their private library.  
* **What:** The user wants to **update** the label or additional metadata (e.g., notes, tags) associated with a particular face image, without re-uploading the file.  
* **Why (Goal):** By modifying labels/metadata, the user can keep their face library accurate and clear—for example, changing “Profile Shot 2022” to “Profile Shot 2023” or adding notes like “Wearing glasses.”

---

## **Acceptance Criteria**

1. **Edit or Settings Action**

   * Given the user is in the **Faces** section of their dashboard,  
   * When they click an **“Edit”** or **“Settings”** button on a specific face entry,  
   * Then a form or inline field appears allowing them to modify the **label** (or other metadata fields).  
2. **Metadata Fields**

   * The face may have various fields, such as:  
     * **Label** (e.g., “Smiling Face,” “Profile Shot”)  
     * **Notes** (optional short description or comments)  
   * The user can change one or all fields at once.  
3. **Saving Changes**

   * When the user saves the edited metadata,  
   * The system updates that face’s data in the mock array (or real DB).  
   * The page or list **refreshes** to display the new label/metadata.  
4. **Validation**

   * If fields are empty or invalid (according to design rules), the user gets an error message (e.g., “Label cannot be blank”).  
   * If the update is successful, display a short success confirmation (e.g., “Face metadata updated”).  
5. **Error Handling**

   * If an error occurs (network or internal), an error message is shown (“Unable to update metadata, please retry”).  
   * The user can retry or cancel editing.  
6. **Data Persistence**

   * If the user navigates away or logs out and back in, the updated metadata remains consistent.  
   * In a mock environment, this means storing changes in a local array; in production, persisting to the database.

---

## **Constraints / Additional Notes**

* **Authentication**: Only the **owner** of the face library can edit the metadata of their private face images.  
* **UX**: Provide a **clear, minimal** editing interface. Inline editing or a small modal can be used.  
* **Future Enhancements**: More advanced metadata fields (e.g., “mood,” “event,” or “timestamp”), or the ability to mass-edit multiple faces at once.

---

## **Summary (For Human & AI)**

This user story allows **users** to **edit** the **label** or **metadata** of a face image they already uploaded, enabling them to keep their library **organized** and **up to date**. The **acceptance criteria** outline how the user **initiates** editing, what **fields** can be changed, how **validation** and **feedback** occur, and how the **system** persists those changes. Both **human developers** and **AI Agents** can implement these requirements to create a user-friendly, flexible **face metadata editing** experience.

# 15 \- FT \- Overview

1. **Add an “Edit” button for each face in the library**  
2. **Implement an inline editing interface for face labels and metadata**  
3. **Validate user inputs during metadata editing**  
4. **Update the face data in the mock state upon saving changes**  
5. **Display confirmation feedback after successful metadata update**  
6. 

# ⚪ I want to initiate a faceswap on images in my cart

**User Story**  
 **Title:** As a user I want to initiate a face swap on images in my cart

---

## **Description / Narrative**

* **Who:** A user (typically logged in) who has added images to their cart and has at least one face image in their private library.  
* **What:** The user wants to **select** which **face** to use and **apply** it to the images in their cart, triggering a face swap process.  
* **Why (Goal):** By performing a face swap on selected images, the user can see results without manually re-adding images or faces each time—this is the primary goal of the application’s face swap functionality.

---

## **Acceptance Criteria**

1. **Face Selection**

   * Given the user has **one or more faces** in their library,  
   * When they go to the **Cart Page** (e.g., `/dashboard/cart`),  
   * Then they should see a **dropdown** or **list** of available faces to pick from (e.g., “Smiling Face,” “Side Profile,” etc.).  
2. **Swap Confirmation**

   * When the user selects a face and clicks **“Swap Now”** (or similar button),  
   * The system begins the **face swap** process for all images currently in the cart.  
   * The user sees some indication that a swap is **initiating** (e.g., a status message or a “Swap in Progress” screen).  
3. **Mock or Real Face Swap**

   * For an MVP or mock environment, the swap might be purely **simulated** (e.g., creating a new record in `mockSwaps` with `status = 'in_progress'`).  
   * In a real environment, the system sends the request to the **Flask AI** or whichever server handles the swap, then updates the status accordingly.  
4. **Status Feedback**

   * The user sees **immediate feedback** or a **confirmation** that the swap job has been queued or started.  
   * If the system is asynchronous, the user can check the “Swap History” or “Swaps Page” to monitor progress.  
5. **Cart Cleanup or Next Step**

   * After initiating the swap, the user may choose to **clear** the cart or keep the items.  
   * The system might automatically **empty** the cart if the workflow calls for that, or prompt the user with next steps (“View Swap Status,” “Continue Shopping,” etc.).  
6. **Error Handling**

   * If the user does not have any faces in their library, show a message like “No faces available—please upload a face first.”  
   * If the swap action fails (mock or real) due to an internal error or incomplete data, display an error message (“Unable to start swap. Please try again.”).

---

## **Constraints / Additional Notes**

* **Authentication**: User must be signed in, have a valid **face** in their library, and have images in their cart.  
* **MVP**: No real AI processing is needed—just simulate a “swap in progress” job. A separate user story covers checking or viewing the swap results.  
* **Credits**: If credit usage is required, the system might check the user’s swap credits before initiating. This may be tied to another user story about credits/payment.

---

## **Summary (For Human & AI)**

This user story enables **users** to **initiate** a **face swap** on the images they have in their **cart**, selecting which **face** from their private library to use. The **acceptance criteria** detail the **face selection**, **confirmation**, how the process might be **mocked** or **real**, and **error handling**. Both **human developers** and **AI Agents** can follow these guidelines to implement a straightforward, user-friendly **face swap initiation** feature.

# 16 \- FT \- Overview

1. **Add a “Choose Face” dropdown or selector on the cart page**  
2. **Implement a “Swap Now” button to start the face swap process**  
3. **Create a swap job record (mock or real) upon user confirmation**  
4. **Show immediate feedback or confirmation that the swap has been initiated**  
5. **Handle potential errors (e.g., no faces available, in-progress swap failures)**

# ⚪ to see the status and results of my face swaps

**User Story**  
 **Title:** As a user I want to see the status and results of my face swaps

---

## **Description / Narrative**

* **Who:** A logged-in user who has initiated one or more face swaps in the application.  
* **What:** The user wants to **check** the **status** (e.g., in progress, done, error) of each swap, as well as **view** the final swapped images when they’re completed.  
* **Why (Goal):** By having a clear overview of ongoing and completed swaps, the user can track progress, see their resulting images, and manage or download them without confusion.

---

## **Acceptance Criteria**

1. **Swap History / Swaps Page**

   * Given the user navigates to a **Swaps** page in their dashboard (e.g., `/dashboard/swaps`),  
   * Then they see a **list** of each swap job they initiated, including a **status** indicator (`in_progress`, `done`, `failed`, etc.).  
   * The list should also display the **timestamp** when each swap was initiated or completed (mock or real).  
2. **Ongoing vs. Completed**

   * If a swap is still **in progress**, the user might see an **in-progress** label or spinner.  
   * Once the system marks it as **done**, the user sees the **result** (e.g., a thumbnail of the swapped image or a link to the result).  
   * If it **failed**, a clear message is shown (“Swap failed. Please retry.”) with possible retry actions if relevant.  
3. **Result Preview**

   * For **completed** swaps, the user can see a small **preview** (thumbnail) of the swapped image.  
   * Clicking or tapping this thumbnail might open a larger view or a separate page with the full image (depending on design).  
4. **Error Handling**

   * If the list of swaps cannot be loaded (mock or real DB error), the user is shown a message (“Unable to fetch swap data. Please try again.”).  
   * If a particular swap has no result image (e.g., error in processing), show “No result available.”  
5. **Retention & Cleanup**

   * The user can see past swaps for a certain period or indefinitely, depending on business rules.  
   * (Optional) The user might delete old or unneeded swap results—this could be a separate feature ticket.  
6. **Refresh / Polling** (Optional)

   * If the system is asynchronous, the page might **auto-refresh** or allow the user to **refresh** to see updated statuses (for an MVP, a manual refresh might suffice).  
   * Real-time updates could be a future enhancement.

---

## **Constraints / Additional Notes**

* **Authentication**: Only the user who initiated the swap can see these swap records (private data).  
* **MVP**: Acceptable to store the statuses and result URLs in a **mock** array or object. In production, a DB or job queue would track real statuses.  
* **Future Enhancements**:  
  * Download functionality for the swapped image.  
  * Tag or label the result for easy organization.

---

## **Summary (For Human & AI)**

This user story provides **users** a **Swaps** page where they can **view** each face swap’s **status** (in progress, done, failed) and **see** (or download) the final **result** images. The **acceptance criteria** detail how the list should display swaps, how results appear for completed ones, and how errors are handled. Both **human developers** and **AI Agents** can use these guidelines to build a user-friendly **face swap status & result** feature.

# 17 \- FT \- Overview

1. **Implement a “Swaps” page listing all swap jobs for the user**  
2. **Display swap status (in\_progress, done, failed) in the swaps list**  
3. **Show final result images or thumbnails for completed swaps**  
4. **Provide manual or automatic refresh to update swap statuses**  
5. **Handle errors or missing results gracefully**

# ⚪ receive a notif when my face swap job is completed

**User Story**  
 **Title:** As a user I want to receive a notification when my face swap job is completed

---

## **Description / Narrative**

* **Who:** A logged-in user who has initiated one or more face swaps.  
* **What:** The user wants a **notification** (email, push notification, or in-app alert) when their **face swap** finishes processing.  
* **Why (Goal):** Instead of constantly checking the swaps page, the user can be **informed automatically** that the swap is done and ready to view.

---

## **Acceptance Criteria**

1. **Notification Preference / Trigger**

   * Given the user starts a **face swap** job,  
   * When the system or AI process **completes** the swap,  
   * Then a **notification** is triggered. The system checks the user’s preference (e.g., email, in-app, or both).  
2. **Content of the Notification**

   * The notification should contain **relevant info**: which images were swapped, a link to the completed result, and possibly the time finished.  
   * If it’s an email: a short subject (“Your Face Swap is Complete\!”) and a brief message with a link to the results.  
   * If it’s an in-app toast or alert: a quick message like “Your face swap for \[image name(s)\] is done\!”  
3. **In-App vs. External**

   * **In-App**: The user sees an alert or message when they revisit or refresh the site (if real-time, a WebSocket/Realtime approach could push the alert immediately).  
   * **Email / External**: If user’s email is verified and notifications are enabled, they get an email containing the swap result link.  
4. **Error Handling**

   * If the swap fails, the user might receive a **failure notification** (“Face Swap Failed: Please Retry”).  
   * If notifications cannot be sent (mock or real error), the user can still see the result manually in their Swaps page.  
5. **Notification Settings** (Optional for MVP)

   * The user might have a toggle in their account preferences to enable/disable “Email Notifications” for face swaps.  
   * If disabled, no external email is sent; the user can rely on in-app updates only.

---

## **Constraints / Additional Notes**

* **MVP Implementation**: For a purely mock solution, sending a real email might be skipped, but an in-app message or console log can simulate it.  
* **Authentication**: The user must be logged in and own the swap job to receive notifications.  
* **Future Enhancements**:  
  * Push notifications on mobile.  
  * More detailed progress updates (e.g., “50% done, 80% done”) if the AI pipeline supports it.

---

## **Summary (For Human & AI)**

This user story ensures that **users** are **notified** automatically when their **face swap job** finishes, preventing them from constantly checking the Swaps page. The **acceptance criteria** describe how the notification is triggered, how it’s delivered (email, in-app, or both), what info it contains, and optional user preferences. Both **human developers** and **AI Agents** can follow these guidelines to implement a clear, user-friendly **completion notification** flow.

# 18 \- FT \- Overview

1. **Implement notification trigger upon face swap job completion**  
2. **Develop in-app notification UI component for swap completion alerts**  
3. **Integrate email notification functionality for completed face swap jobs**  
4. **Display real-time notification feedback on the dashboard**  
5. **Handle error notifications if a swap job fails or times out**  
6. 

# ⚪ to manage my notification preferences

**User Story**  
 **Title:** As a user I want to manage my notification preferences

---

## **Description / Narrative**

* **Who:** A logged-in user who may receive various notifications (e.g., face swap completion, payment confirmations).  
* **What:** The user wants a **settings** or **preferences** section where they can **enable or disable** different types of notifications (email, in-app, etc.).  
* **Why (Goal):** By customizing **notification preferences**, the user has control over which notifications they receive and through which channels, avoiding unwanted emails or missing important alerts.

---

## **Acceptance Criteria**

1. **Notification Settings UI**

   * Given the user accesses an **Account Settings** or **Notifications** page,  
   * When they view the **notification preferences**,  
   * Then they should see a **list** of notification types (e.g., “Face Swap Complete,” “Payment Confirmation,” “Promotional Updates”) with toggles or checkboxes for how they want to be notified (e.g., Email, In-App, or None).  
2. **Update & Save**

   * When the user **toggles** a notification type on or off (or changes a channel from Email to None),  
   * And clicks **“Save”** (if needed),  
   * Then the system updates their preferences in the mock or real database.  
   * A short success message like “Notification preferences updated” appears.  
3. **Default Settings**

   * If the user has never changed their preferences, the system may have **default** settings (e.g., “Email for face swap completion is on,” “Promotional emails off,” etc.).  
   * The user can override these defaults at any time.  
4. **Error Handling**

   * If there’s an issue saving preferences, a message is shown (“Unable to update preferences, please try again.”).  
   * The user can retry or cancel changes.  
5. **Reflection in Real Notifications**

   * If “Email for face swap completion” is turned off, no further face swap completion emails are sent.  
   * If “In-App” is turned on, the user sees in-app alerts.  
   * For an MVP with mock data, these might be partial or simulated behaviors.

---

## **Constraints / Additional Notes**

* **Authentication**: Only logged-in users can access or modify their personal notification settings.  
* **MVP**: Some or all notification types might be placeholders (e.g., only face swap completion is real).  
* **Future Enhancements**:  
  * More granular channels (push notifications, SMS).  
  * Scheduling or “do not disturb” times.  
  * Per-notification customization (priority levels).

---

## **Summary (For Human & AI)**

This user story lets **users** configure which **notifications** they receive and via which **channels** (email, in-app, etc.). The **acceptance criteria** detail how the user **views** and **updates** these preferences, how **default** settings work, and what happens if an **error** occurs. Both **human developers** and **AI Agents** can follow this guide to implement a user-friendly **notification preferences** system.

# 19 \- FT \- Overview

1. **Create a Notification Preferences Settings Page**  
2. **Implement UI Toggles for Email and In-App Notifications**  
3. **Develop Save and Update Logic for Notification Preferences**  
4. **Persist User Notification Preferences in Local State or Storage**  
5. **Provide Visual Feedback Upon Successful Preference Updates**  
6. **Implement Error Handling for Preference Update Failures**  
7. 

# ⚪ preview the swapped image result before saving it

**User Story**  
 **Title:** As a user I want to preview the swapped image result before saving it

---

## **Description / Narrative**

* **Who:** A logged-in user who is about to perform a face swap or has just initiated one.  
* **What:** The user wants a **preview** of how the swapped image will look (or already looks) **before** officially confirming or saving it to their gallery.  
* **Why (Goal):** By seeing a **preview**, the user can decide whether the result is acceptable (e.g., alignment is good, expression is appropriate) or if they need to retry or pick a different face image.

---

## **Acceptance Criteria**

1. **Swap Preview Generation**

   * Given the user selects a face and images from their cart for a swap,  
   * When the system performs (or simulates) the face swap,  
   * Then it provides a **preview** version of the swapped image(s) without permanently storing it in the user’s library.  
   * For an MVP or mock environment, this might be a placeholder image or partial preview.  
2. **Preview Display**

   * Once the swap is complete (or the preview is generated),  
   * The user is shown a **“Preview”** page or modal, displaying the swapped image at a reasonable size or resolution.  
   * The user can zoom in or see enough detail to judge if the swap looks correct (depending on scope).  
3. **Accept or Discard**

   * The user can choose to **“Save”** or **“Apply”** the previewed swap result, which adds it to their private gallery (or finalizes it as a completed swap).  
   * Alternatively, the user can **discard** or **cancel**, leaving no permanent record of this swap attempt in their library.  
   * If the user discards, the system removes the preview and resets the swap state.  
4. **Error Handling**

   * If the preview fails to generate (mock or real error), the user sees an error message (“Couldn’t generate preview, please retry”).  
   * The user can attempt the swap again or pick a different face.  
5. **Performance Considerations** (Optional)

   * If generating previews is computationally heavy, the system might queue the request or show a progress bar.  
   * In a mock scenario, you can display a placeholder for a short time to simulate processing.

---

## **Constraints / Additional Notes**

* **Authentication**: Typically only logged-in users can do face swaps and thus see previews.  
* **MVP**: You may simulate this feature with mock or sample images. A real AI pipeline would generate the actual preview.  
* **UX**: Provide clear buttons or calls to action (“Save” vs. “Discard”), and inform the user what happens if they discard.

---

## **Summary (For Human & AI)**

This user story ensures users can **see** what a **face-swapped** image looks like **before** committing it to their gallery. The **acceptance criteria** cover the **preview generation**, **preview display**, **accept/discard** flow, and **error handling**. Both **human developers** and **AI Agents** can implement these guidelines to create a user-friendly **face swap preview** feature, allowing users to decide if the swap result meets their expectations.

# 20 \- FT \- Overview

1. **Implement a face swap preview generation mechanism (mock or real)**  
2. **Create a “Preview” UI/modal to display the temporarily swapped image**  
3. **Add “Accept” and “Discard” buttons to confirm or cancel the previewed result**  
4. **Show a loading or progress state while the preview is being generated**  
5. **Handle errors (e.g., preview generation failed) and revert to the cart or face selection**

# ⚪ to delete a completed face swap result

**User Story**  
 **Title:** As a user I want to delete a completed face swap result

---

## **Description / Narrative**

* **Who:** A logged-in user who has previously performed a face swap and has the resulting swapped image saved in their swap history or private gallery.  
* **What:** The user wants to **remove** or **delete** a face swap result (i.e., the final swapped image) they no longer need.  
* **Why (Goal):** By deleting unused or older swapped images, the user keeps their history or gallery organized, freeing up space or preventing clutter.

---

## **Acceptance Criteria**

1. **Delete Option**

   * Given the user is viewing their **completed swaps** list or gallery,  
   * When the user clicks a **“Delete”** or **“Remove”** button next to a specific completed swap result,  
   * Then a confirmation dialog or modal appears: “Are you sure you want to delete this swapped image?”  
2. **Confirmation Prompt**

   * Once the user confirms,  
   * The swapped image (and any associated metadata in the mock data or DB) is **removed** from their history or gallery.  
   * The UI refreshes to show that the image is no longer present.  
3. **Immediate Feedback**

   * After a successful delete, show a **toast or message** indicating “Swap result deleted.”  
   * If an error occurs (mock or real scenario), display a short error message (“Unable to delete swap result, please try again.”).  
4. **Irreversible Action** (MVP)

   * Once removed, the image cannot be easily restored (no “trash” or “undo” in MVP).  
   * Future enhancements might allow an undo period or recycle bin concept.  
5. **Data Consistency**

   * The system ensures the swap record is updated so that result is no longer accessible.  
   * If the user logs out and back in, the deleted result remains gone.

---

## **Constraints / Additional Notes**

* **Authentication**: Only the user who owns the completed swap can delete it.  
* **MVP vs. Future**: MVP can have a simple “Yes/No” delete confirmation. More advanced functionality (multi-delete, trash bin) can come later.  
* **Storage**: In a real deployment, removing the image from the DB or storage bucket may be required. In a mock scenario, removing from an array is sufficient.

---

## **Summary (For Human & AI)**

This user story ensures **users** can **delete** previously **completed face swap results** they no longer wish to keep. The **acceptance criteria** define how the **delete action** is presented, confirmed, and processed, along with **feedback** or **error handling**. Both **human developers** and **AI Agents** can implement this feature to maintain a clean, user-controlled **swap history**.

# 21 \- FT \- Overview

1. **Add a “Delete” button/icon on each completed face swap result**  
2. **Implement a confirmation dialog for swap result deletion**  
3. **Update the swap history UI immediately after deletion**  
4. **Provide feedback (toast/message) upon successful deletion**  
5. **Handle errors during deletion and display appropriate messages**  
6. 

# ⚪ to purchase swap credits using LN Bitcoin

**User Story**  
 **Title:** As a user I want to purchase swap credits using LN Bitcoin

---

## **Description / Narrative**

* **Who:** A user who has an account and needs more face swap credits.  
* **What:** The user wants to **buy** additional face swap credits by paying with **Bitcoin Lightning (LN)**.  
* **Why (Goal):** By purchasing credits, the user can continue performing face swaps if they run out of their initial or previously bought credits.

---

## **Acceptance Criteria**

1. **Credits Purchase UI**

   * Given the user navigates to a **Credits** or **Billing** page,  
   * When they see available **credit bundles** (e.g., $1 \= 10 swaps, $5 \= 50 swaps, etc.),  
   * Then they can select a desired bundle and proceed to the **LN payment** flow.  
2. **Generate LN Invoice**

   * Once the user confirms the bundle choice (e.g., $5 for 50 swaps),  
   * The system generates a **Lightning invoice** (or LNURL) for the corresponding amount in BTC sats based on current exchange rates.  
   * A QR code or invoice string is shown so the user can pay via their LN wallet.  
3. **Await Payment Confirmation**

   * After the invoice is generated, the system **listens** or **polls** for the LN payment to be completed.  
   * During this time, the user sees a “Waiting for Payment” status or instructions on how to pay the invoice from their LN wallet.  
4. **Successful Payment & Credit Allocation**

   * Once the LN payment is confirmed (mock or real),  
   * The user’s **swap credits** balance is **increased** by the bundle amount (e.g., \+50 swaps).  
   * The user receives a success message (“Payment received\! You now have 50 additional swaps.”).  
5. **Error Handling**

   * If the invoice expires or the payment fails, show a clear message: “Payment not completed. Please try again or generate a new invoice.”  
   * If the LN node or service has an issue, allow the user to regenerate an invoice or contact support.  
6. **Transaction History (Optional)**

   * The user can view a **payment transactions** list showing the date, amount, and status of each LN purchase for their records.  
   * This might be a separate feature or user story if needed for MVP.

---

## **Constraints / Additional Notes**

* **Authentication**: Only logged-in users can purchase credits tied to their account.  
* **MVP**:  
  * For a mock scenario, we can simulate or skip real LN invoice creation.  
  * For production, integrate an LN solution or provider that can generate and confirm invoices.  
* **Exchange Rates**: The system needs an approximate BTC/USD rate or use real-time LN payment logic to handle partial sats.  
* **Security**: LN payment links must be valid, properly generated, and managed.  
* **Future Enhancements**: Automatic LNURL pay, LNURL-auth for easy sign-in, multi-tiered bundles, or subscription-based models.

---

## **Summary (For Human & AI)**

This user story ensures **users** can **buy face swap credits** using **Bitcoin Lightning** payments. The **acceptance criteria** detail how the user **selects** a bundle, the system **generates** an LN invoice, the user **pays** via LN wallet, and upon **confirmation**, credits are **added** to the user’s balance. Both **human developers** and **AI Agents** can follow these steps to implement a working LN payment flow for purchasing swap credits.

# 22 \- FT \- Overview

1. **Develop a credit bundle selection interface for LN Bitcoin purchases**  
2. **Integrate LN invoice generation and display mechanism**  
3. **Implement a QR code display for LN invoice scanning**  
4. **Create polling or webhook logic to confirm LN payment status**  
5. **Update user credit balance upon successful LN payment confirmation**  
6. **Provide error handling and user feedback for failed or expired LN invoice**  
7. 

# ⚪ to pay a yearly fee for storing my images

**User Story**  
 **Title:** As a user I want to pay a yearly fee for storing my images

---

## **Description / Narrative**

* **Who:** A user who already has an account and is uploading/storing a large number of images (above any free tier).  
* **What:** The user wants to **pay** a **yearly** fee to keep using cloud storage for their images without interruptions.  
* **Why (Goal):** By paying an annual subscription or fee, the user ensures they can store more than the free-tier allowance of images, preventing forced deletions or restricted uploads.

---

## **Acceptance Criteria**

1. **Subscription / Payment UI**

   * Given the user navigates to a **Storage Plans** or **Billing** page,  
   * When they see a **yearly fee** option (e.g., $20/year for up to N images),  
   * Then the user can select that plan and proceed to **payment**.  
2. **Payment Method**

   * The system supports **Bitcoin Lightning** or other payment methods (depending on your design).  
   * When the user confirms they want the yearly plan, the system generates a **yearly subscription invoice** or LN invoice for the specified amount.  
3. **Plan Activation**

   * After payment is **confirmed** (mock or real), the user’s **storage plan** is set to **active** for one year (e.g., until 12 months from the purchase date).  
   * The user receives a success message (“Your yearly storage plan is now active until \[date\].”).  
4. **Usage Checks**

   * While the plan is active, the user can store up to the plan’s image limit without additional fees.  
   * If the user goes beyond the limit (or the plan expires), the system either prompts them to renew or blocks further uploads, depending on design.  
5. **Expiration & Renewal**

   * When the plan’s expiration date nears, the user gets a reminder (“Your yearly plan will expire in 14 days—renew now to avoid losing storage.”).  
   * If the user does not renew, their storage reverts to the free tier or restricted status.  
6. **Error Handling**

   * If payment fails or invoice expires, display “Unable to process payment. Please try again.”  
   * If the user tries to upload images beyond their plan limit and the plan is not active, show a “Storage limit exceeded” message.

---

## **Constraints / Additional Notes**

* **Authentication**: Only signed-in users can purchase and apply a storage plan to their account.  
* **MVP**:  
  * For a mock environment, you can simulate or skip real LN invoice creation.  
  * In production, integrate a real LN or payment service to confirm the yearly plan purchase.  
* **Plan Management**: The system must track the user’s **plan status** and **expiration date**.  
* **Future Enhancements**:  
  * Different yearly tiers (e.g., 100 images vs. 500 images).  
  * Automatic renewal options.  
  * Email or push notifications for plan expiry.

---

## **Summary (For Human & AI)**

This user story allows **users** to **pay a yearly fee** to maintain **expanded image storage** beyond any free tier. The **acceptance criteria** detail how the user **selects** the plan, how **payment** is **handled** (e.g., LN invoice), how the **plan** becomes **active**, and how the **system** enforces or **renews** that plan. Both **human developers** and **AI Agents** can follow these guidelines to implement a smooth, clear **yearly storage payment** process.

# 23 \- FT \- Overview

1. **Create a yearly storage plan selection interface**  
2. **Display detailed information for the yearly storage plan**  
3. **Integrate LN invoice generation for the yearly fee**  
4. **Implement a payment confirmation mechanism for the yearly fee**  
5. **Update user account with active yearly storage status**  
6. **Provide renewal notifications for expiring yearly storage plans**  
7. **Handle errors during yearly fee payment processing**  
8. 

# ⚪ to see and manage my remaining swap credits

**User Story**  
 **Title:** As a user I want to see and manage my remaining swap credits

---

## **Description / Narrative**

* **Who:** A logged-in user who has purchased or been allocated face swap credits.  
* **What:** The user wants to **view** how many swap credits they have left and possibly **manage** or **top up** those credits if they run low.  
* **Why (Goal):** By having a clear view of remaining credits, the user can decide whether they need to purchase more or budget how many swaps to perform.

---

## **Acceptance Criteria**

1. **Credits Overview**

   * Given the user navigates to their **Account** or **Dashboard** page,  
   * When the system displays their **swap credits** info,  
   * Then the user sees a clear **credit balance** (e.g., “You have 24 swaps remaining”) and the **date/time** of the last update if relevant.  
2. **Usage History** (Optional)

   * If the user wants to see how credits were spent,  
   * They may view a **history log** (e.g., “Swap on Oct 1 used 1 credit”), depending on design.  
   * This may be helpful if the user wonders where their credits went.  
3. **Purchase or Refill**

   * If the user’s balance is low or zero,  
   * A “Buy More Credits” or “Purchase Credits” button should be visible, linking them to the LN payment flow (or whichever method you use).  
   * This might open a new user story or existing functionality for credit purchase.  
4. **Error Handling**

   * If the credits fail to load (mock or real DB error), show an error message (“Unable to retrieve credits. Please refresh or try again.”).  
   * If the user’s credits are out of sync, the system might refresh or recalculate them once the user performs an action (like a face swap).  
5. **MVP vs. Future Enhancements**

   * **MVP**: Display a simple numeric credit count and a link to purchase more.  
   * **Future**: Show a detailed usage log, upcoming expiry dates if credits can expire, or advanced credit pooling (group accounts).

---

## **Constraints / Additional Notes**

* **Authentication**: Only the **logged-in user** can see or manage their own credits.  
* **Mock or Real**: For an MVP, you can store the credits in an in-memory or mock array. In production, a DB or account management system keeps track.  
* **Notifications**: If credits drop below a threshold, you might notify the user to purchase more (optional separate story).

---

## **Summary (For Human & AI)**

This user story ensures a **user** can **view** how many **face swap credits** remain and **manage** them (e.g., purchase more if low). The **acceptance criteria** outline displaying the **credit balance**, providing an **optional usage history**, enabling **purchase** links, and handling **errors**. Both **human developers** and **AI Agents** can implement these guidelines to offer a clear, user-friendly **credits management** experience.

# 24 \- FT \- Overview

1. **Display current swap credit balance on the user dashboard**  
2. **Implement a swap credits detail view with usage history**  
3. **Add a “Refresh Swap Credits” functionality for real-time updates**  
4. **Provide a “Purchase More Credits” call-to-action when balance is low**  
5. **Implement error handling for failed swap credit retrieval**  
6. 