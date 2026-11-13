# ArchiMind — Streamlit deployment

This Streamlit edition uses the existing Supabase project for authentication and PostgreSQL storage. It includes the five modules from the React application: Requirements & SRS, UML Diagrams, Architecture Design, Traceability Checker, and Test Cases.

## Streamlit Community Cloud

1. Add `app.py`, `requirements.txt`, and `.streamlit/config.toml` to the root of the GitHub repository (or deploy this folder as the app root).
2. In Streamlit Community Cloud, create an app from the GitHub repository and set the main file path to `app.py`.
3. In the app's **Settings → Secrets**, add:

```toml
SUPABASE_URL = "https://hrovcrgfuxsltwrrbywr.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_..."
```

Use the Supabase **Publishable** key only. Never put an `sb_secret_` or service-role key in Streamlit app secrets.

## Database assumptions

The app expects the existing public tables:

- `projects`: `id` (generated UUID), `user_id` (UUID), `name`, `description`, `created_at`
- `project_data`: `project_id`, `module_key`, `content` (JSONB), `updated_at`, with a unique constraint on `(project_id, module_key)`

The existing RLS policies should permit authenticated users to select/insert/update/delete only their own projects, and to access `project_data` only when its project belongs to `auth.uid()`.

If the actual `projects.id` type/default or project_data unique constraint differs, fix the schema before using this app. Do not drop tables or existing data.

## Notes

- This app uses Supabase Auth email/password. If email confirmation is enabled, users must confirm their email before logging in.
- Each module saves JSON data to `project_data` when **Save module** is clicked.
- The project template choice is currently held in Streamlit session state; it is not persisted in the database. Module content itself is persisted.
- This is a template-driven engineering assistant, not an LLM-generated system design engine.
