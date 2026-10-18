# AI-Based Interview Preparation and Evaluation System

An intelligent, full-stack AI-powered interview preparation platform designed to conduct mock interviews, evaluate candidate performance across technical and behavioral dimensions, and generate tailored questions directly from uploaded resumes.

---

## 🌟 Key Features

- **Automated AI Interview Evaluations**: Instant multi-dimensional scoring across Content Relevance, Technical Accuracy, Communication Skills, Confidence & Fluency, Grammar & Vocabulary, and Response Time.
- **Resume-Tailored Question Generation**: Context-aware AI question synthesis extracting concrete skills and project experiences from uploaded resumes.
- **Comprehensive Candidate Dashboard**: Visual performance breakdown, historical interview tracking, and targeted strength/improvement feedback.
- **Interactive Learning Paths**: Curated modules and topic-specific practice tracks to strengthen technical fundamentals.
- **Secure Authentication & Cloud Storage**: Supabase-powered authentication, Row Level Security (RLS) data isolation, and secure avatar asset storage.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite |
| **UI Components & Styling** | TailwindCSS, Radix UI (shadcn/ui), Lucide Icons, Framer Motion |
| **State & Data Fetching** | TanStack React Query |
| **Backend & Database** | Supabase (PostgreSQL with Row Level Security) |
| **Serverless AI Logic** | Supabase Edge Functions (Deno TypeScript) |
| **AI LLM Inference** | Groq API (`openai/gpt-oss-20b` with structured function calling) |
| **Testing** | Vitest, Testing Library |

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher) or [Bun](https://bun.sh/)
- A [Supabase](https://supabase.com/) project
- A [Groq Cloud](https://console.groq.com/) API Key

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Manoj-1122/Ai-Based-Interview-Preparation-and-Evalution-System-.git
cd Ai-Based-Interview-Preparation-and-Evalution-System-
npm install
```

### 3. Environment Configuration

Copy the example environment template and configure your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your project keys:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_APP_URL=http://localhost:8080
```

### 4. Supabase Setup & Edge Functions

1. Apply the database migrations located in `supabase/migrations/` to your Supabase project.
2. Set your Groq API key in your Supabase project secrets:
   ```bash
   supabase secrets set GROQ_API_KEY=your_groq_api_key
   ```
3. Deploy the Edge Functions:
   ```bash
   supabase functions deploy evaluate-interview
   supabase functions deploy generate-resume-questions
   ```

### 5. Run the Application

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🔒 Security Practices

- **Zero Hardcoded Secrets**: All private keys and service credentials must reside in environment variables or Supabase Vault secrets.
- **Row Level Security (RLS)**: Enforced across all database tables (`interviews`, `profiles`, `learning_progress`), ensuring users can only read and write their own data.
- **Untrusted Input Sanitation**: Resumes and user prompts are bounded and isolated within strict prompt templates before evaluation.

---

## 📄 License & Documentation

Detailed project architecture and requirements documentation can be found in [`docs/AI_Interview_System_Project_Report_Final.pdf`](docs/AI_Interview_System_Project_Report_Final.pdf).
