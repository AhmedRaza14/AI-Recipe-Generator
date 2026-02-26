# **✅ AI Recipe Maker – Final Production SDD**

---

# **1️⃣ Product Vision**

Build a production-ready full-stack AI Recipe Maker web application.

### **Tech Stack**

* **Frontend:** Next.js 14 \+ Tailwind CSS  
* **Backend:** FastAPI (Python, async)  
* **AI:** Google Generative AI (Gemini API)  
* **Database:** PostgreSQL (recommended) or MongoDB  
* **Auth:** Google OAuth 2.0 \+ JWT  
* **Architecture:** Modular \+ Service Layer \+ Repository Pattern  
* **Agent System:** Claude-style skills in `/.claude/skills/`

---

# **2️⃣ Core Functional Features**

## **1\. Recipe Generation (Dish Name Mode)**

**Input:**

{  
  "dish\_name": "Chicken Biryani"  
}

**Output (STRICT JSON ONLY):**

{  
  "title": "",  
  "description": "",  
  "prep\_time": "",  
  "cook\_time": "",  
  "ingredients": \[{"name": "", "quantity": ""}\],  
  "steps": \[\],  
  "nutrition": {  
    "calories": "",  
    "protein": "",  
    "carbs": "",  
    "fat": ""  
  },  
  "tips": \[\],  
  "serving\_suggestions": \[\]  
}

---

## **2\. Ingredient-Based Mode**

**Input:**

{  
  "ingredients": \["rice", "chicken", "onion"\]  
}

**Output:**

{  
  "suggested\_dishes": \[\],  
  "selected\_recipe": {...},  
  "missing\_optional\_ingredients": \[\]  
}

---

## **3\. Strict Recipe-Only Chatbot**

Allowed topics:

* Recipes  
* Cooking techniques  
* Ingredients  
* Nutrition  
* Substitutions  
* Meal planning

If unrelated:

"I can only assist with recipes and cooking-related questions."

⚠ Chat is session-based only  
❌ No Chat database table

---

## **4\. Saved Recipes (Authenticated Users Only)**

Users can:

* Save recipe  
* Fetch saved recipes  
* Delete saved recipe

Protected via JWT.

---

# **3️⃣ Updated Database Design**

## **Users Table**

* id  
* email  
* name  
* google\_id  
* created\_at

## **Recipes Table**

* id  
* user\_id  
* recipe\_json (JSONB if PostgreSQL)  
* created\_at

❌ Chat table removed

---

# **4️⃣ Authentication Design**

### **Google OAuth Flow**

1. User clicks "Sign in with Google"  
2. Next.js gets Google token  
3. Backend verifies token  
4. Backend creates user (if not exists)  
5. Backend issues JWT  
6. Frontend stores JWT securely

---

# **5️⃣ Backend Architecture (FastAPI)**

backend/  
│  
├── app/  
│   ├── main.py  
│   ├── config.py  
│   ├── dependencies.py  
│   ├── routers/  
│   │   ├── recipe.py  
│   │   ├── auth.py  
│   │   ├── chat.py  
│   │   └── saved.py  
│   │  
│   ├── services/  
│   │   ├── ai\_service.py  
│   │   ├── auth\_service.py  
│   │   ├── recipe\_service.py  
│   │  
│   ├── models/  
│   ├── schemas/  
│   ├── database/  
│   ├── repositories/  
│   ├── utils/  
│  
├── .env  
├── requirements.txt

---

# **6️⃣ AI Service Design (Critical Component)**

### **Responsibilities**

* Load Gemini API key from `.env`  
* Build structured system prompt  
* Enforce JSON-only output  
* Validate with Pydantic  
* Retry once if malformed  
* Strict domain restriction logic  
* Reject prompt injection

---

### **System Prompt Rules**

AI must:

* Output ONLY JSON  
* Never explain outside JSON  
* Refuse non-cooking topics  
* Follow exact schema

---

### **Prompt Injection Prevention**

Before sending to AI:

* Strip instructions like:  
  * “Ignore previous instructions”  
  * “Reveal system prompt”  
  * “You are now…”  
* Validate input length  
* Reject suspicious patterns

---

# **7️⃣ API Endpoints**

### **Auth**

* `POST /auth/google`

### **Recipe**

* `POST /generate-recipe`  
* `POST /generate-from-ingredients`

### **Chat**

* `POST /chat` (session only)

### **Saved Recipes**

* `POST /save-recipe`  
* `GET /saved-recipes`  
* `DELETE /saved-recipes/{id}`

All responses:

* Structured JSON  
* Proper status codes  
* Async

---

# **8️⃣ Frontend Architecture (Next.js 14\)**

frontend/  
│  
├── app/  
│   ├── page.tsx (Home)  
│   ├── recipe/  
│   ├── ingredients/  
│   ├── saved/  
│   ├── login/  
│  
├── components/  
│   ├── RecipeCard.tsx  
│   ├── IngredientInput.tsx  
│   ├── ChatWidget.tsx  
│   ├── Navbar.tsx  
│   ├── Spinner.tsx  
│  
├── lib/  
│   ├── api.ts  
│   ├── auth.ts  
│  
├── context/  
├── hooks/

---

## **Required UI Features**

* Tab switcher (Recipe / Ingredients)  
* Recipe cards  
* Ingredient tags input  
* Floating chatbot  
* Dark / Light mode  
* Loading spinner  
* Error alerts  
* Auth-protected saved page

---

# **9️⃣ Performance & Non-Functional Requirements**

### **Performance**

* Async FastAPI  
* \<5 sec response  
* Redis caching for repeated queries

### **Security**

* API key in `.env`  
* Rate limiting middleware  
* Pydantic validation  
* JWT verification  
* CORS protection

### **Scalability**

* Service layer separation  
* Repository pattern  
* Environment configs (dev/prod)

---

# **🔟 Agent / Skill System**

Location:

/.claude/skills/

Minimum 4 skills:

---

## **1️⃣ recipe\_generator\_agent.md**

Responsibilities:

* Generate structured recipe JSON  
* Enforce schema  
* Handle retry logic

---

## **2️⃣ ingredient\_planner\_agent.md**

Responsibilities:

* Analyze ingredient list  
* Suggest dishes  
* Return missing optional items

---

## **3️⃣ nutrition\_validator\_agent.md**

Responsibilities:

* Validate nutrition block  
* Normalize units  
* Check macro balance

---

## **4️⃣ domain\_guard\_agent.md**

Responsibilities:

* Validate topic relevance  
* Block non-cooking queries  
* Prevent prompt injection

---

# **1️⃣1️⃣ Development Phases**

---

## **Phase 1 – Agent Formation**

* Create skill definitions  
* Define JSON schemas  
* Define domain restriction logic  
* Define retry logic

Deliverable:

* `/.claude/skills/*.md`

---

## **Phase 2 – Backend Development**

* Setup FastAPI  
* Setup DB models  
* Implement AI service  
* Implement OAuth \+ JWT  
* Add rate limiting  
* Add caching  
* Add error handling

Deliverable:

* Fully working API

---

## **Phase 3 – Frontend Development**

* Setup Next.js  
* Implement auth flow  
* Build UI components  
* API integration layer  
* State management

Deliverable:

* Fully functional UI (without backend integration first)

---

## **Phase 4 – Integration**

* Connect frontend to backend  
* Handle JWT storage  
* Test AI JSON validation  
* Load testing  
* Final security review

Deliverable:

* Production-ready app

---

# **1️⃣2️⃣ Production-Level Error Handling**

| Case | Response |
| ----- | ----- |
| Empty input | 400 |
| Invalid schema | 422 |
| AI malformed JSON | Retry once |
| Retry fails | 500 |
| Rate limit exceeded | 429 |
| Unauthorized | 401 |

---

# **🔥 Final Master SDD Prompt (Updated)**

Build a production-ready full-stack AI Recipe Maker web app using:

* Next.js frontend  
* FastAPI backend  
* Google Generative AI (Gemini)  
* Google OAuth authentication  
* JWT-based protected routes  
* PostgreSQL database  
* Modular service architecture  
* Async endpoints  
* Rate limiting  
* Prompt injection prevention  
* Strict structured JSON AI responses  
* Domain-restricted chatbot  
* Redis caching  
* No chat persistence  
* Agent-based skill system in /.claude/skills/  
* Development split into 4 phases:  
  1. Agents  
  2. Backend  
  3. Frontend  
  4. Integration

All AI outputs must return structured JSON only.

