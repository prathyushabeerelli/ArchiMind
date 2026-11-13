import json
import os
import uuid
from datetime import datetime, timezone

import streamlit as st
from supabase import create_client, Client

st.set_page_config(page_title="ArchiMind", page_icon="🧠", layout="wide")

st.markdown("""
<style>
.block-container{padding-top:2rem;max-width:1250px}
.hero{padding:1.5rem 1.8rem;border-radius:18px;background:linear-gradient(120deg,#211d55,#5148dc);color:white;margin-bottom:1.2rem}
.hero h1{color:white;margin:0}.hero p{color:#e7e6ff;margin:.35rem 0 0}
[data-testid="stMetric"]{background:#f6f5ff;padding:14px;border-radius:12px}
</style>
""", unsafe_allow_html=True)

MODULES = {
    "requirements": "Requirements & SRS",
    "uml": "UML Diagrams",
    "architecture": "Architecture Design",
    "traceability": "Traceability Checker",
    "testing": "Test Cases",
}

PROJECT_TEMPLATES = {
    "Hospital / Healthcare": {
        "actors": ["Patient", "Doctor", "Administrator"],
        "requirements": ["Register / Login", "Book Appointment", "View Doctors", "View Medical Records", "View Prescription", "Make Payment", "View Appointments", "Examine Patient", "Update Diagnosis", "Write Prescription"],
        "classes": ["Patient", "Doctor", "Appointment", "MedicalRecord", "Prescription", "Payment"],
        "steps": ["Patient logs in", "Patient selects a doctor", "System checks availability", "Appointment is booked", "Doctor examines patient", "Doctor updates diagnosis and prescription"],
    },
    "Shopping / E-commerce": {
        "actors": ["Customer", "Administrator"],
        "requirements": ["Register / Login", "Browse Products", "Search Products", "View Product Details", "Add to Cart", "Place Order", "Make Payment", "Manage Products", "Manage Inventory", "Manage Orders", "Manage Customers"],
        "classes": ["User", "Customer", "Product", "ShoppingCart", "Order", "Payment"],
        "steps": ["Customer logs in", "Customer selects a product", "Cart adds the product", "Customer confirms order", "Order is created", "Payment is processed"],
    },
    "Library Management": {
        "actors": ["Student", "Librarian"],
        "requirements": ["Register / Login", "Search Books", "View Book Details", "Check Availability", "Issue Book", "Return Book", "Add Books", "Update Book Details", "Manage Members", "Manage Book Issues"],
        "classes": ["Student", "Librarian", "Book", "IssueRecord", "Member", "Fine"],
        "steps": ["Student logs in", "Student searches for a book", "System checks availability", "Student requests a book", "Librarian approves issue", "System updates availability"],
    },
    "General Software System": {
        "actors": ["User", "Administrator"],
        "requirements": ["Register / Login", "View Information", "Search Records", "View Details", "Submit Request", "Track Status", "Manage Records", "Manage Users", "Update Information", "Generate Reports"],
        "classes": ["User", "Administrator", "Record", "Request", "Database"],
        "steps": ["User logs into the system", "User selects a service", "System validates the request", "Database retrieves information", "System processes the request", "User receives the result"],
    },
}


def get_client() -> Client:
    url = st.secrets.get("SUPABASE_URL", os.getenv("SUPABASE_URL", "")).strip()
    key = st.secrets.get("SUPABASE_ANON_KEY", os.getenv("SUPABASE_ANON_KEY", "")).strip()
    if not url or not key:
        st.error("Supabase configuration is missing. Add SUPABASE_URL and SUPABASE_ANON_KEY in Streamlit Secrets.")
        st.stop()
    return create_client(url, key)


@st.cache_resource
def supabase_client():
    return get_client()


def current_user():
    return st.session_state.get("user")


def auth_screen(sb):
    st.markdown('<div class="hero"><h1>ArchiMind</h1><p>Software Engineering & System Design Assistant</p></div>', unsafe_allow_html=True)
    left, center, right = st.columns([1, 1.2, 1])
    with center:
        mode = st.radio("Account", ["Log in", "Create account"], horizontal=True, label_visibility="collapsed")
        with st.form("auth_form"):
            email = st.text_input("Email address", placeholder="you@example.com")
            password = st.text_input("Password", type="password", placeholder="At least 8 characters")
            submitted = st.form_submit_button("Log in" if mode == "Log in" else "Create account", use_container_width=True, type="primary")
        if submitted:
            try:
                if mode == "Create account":
                    result = sb.auth.sign_up({"email": email.strip(), "password": password})
                    if result.user and not result.session:
                        st.success("Account created. Check your email to confirm, then log in.")
                    elif result.user:
                        st.session_state.user = result.user
                        st.rerun()
                else:
                    result = sb.auth.sign_in_with_password({"email": email.strip(), "password": password})
                    st.session_state.user = result.user
                    st.rerun()
            except Exception as exc:
                st.error(f"Authentication failed: {exc}")
        st.caption("Your projects are private to your signed-in account.")


def load_projects(sb, uid):
    return sb.table("projects").select("id,name,description,created_at").eq("user_id", uid).order("created_at", desc=True).execute().data or []


def module_default(project, kind, template):
    reqs = template["requirements"]
    classes = template["classes"]
    if kind == "requirements":
        return {"actors": template["actors"], "functional_requirements": reqs, "non_functional_requirements": ["Security and privacy", "Performance and responsiveness", "Reliability and availability", "Usability", "Maintainability and scalability"], "notes": "Review and approve these draft requirements with stakeholders."}
    if kind == "uml":
        return {"use_case_actors": template["actors"], "use_cases": reqs, "classes": classes, "sequence": template["steps"]}
    if kind == "architecture":
        return {"layers": ["User Interface", "Application / Business Logic", "Authentication and Authorization", "PostgreSQL Database"], "data_flow": "User → Interface → Application Logic → Database → Response", "notes": "Adapt components and deployment choices to the project requirements."}
    if kind == "traceability":
        return {"rows": [{"requirement_id": f"REQ-{i+1:02d}", "requirement": r, "related_class": classes[i % len(classes)], "test_case": f"Verify: {r}", "status": "Not executed"} for i, r in enumerate(reqs)]}
    return {"test_cases": [{"id": f"TC-{i+1:02d}", "scenario": r, "expected_result": f"System should successfully {r.lower()}.", "status": "Not executed"} for i, r in enumerate(reqs)]}


def save_module(sb, project_id, module_key, content):
    payload = {"project_id": project_id, "module_key": module_key, "content": content, "updated_at": datetime.now(timezone.utc).isoformat()}
    sb.table("project_data").upsert(payload, on_conflict="project_id,module_key").execute()


def project_workspace(sb, project, template_name):
    template = PROJECT_TEMPLATES[template_name]
    st.subheader(project["name"])
    st.caption(project.get("description", ""))
    labels = list(MODULES.values())
    keys = list(MODULES.keys())
    # Use a selector so only the active module loads and saves at a time.
    active_label = st.selectbox("Open module", labels, index=1, key=f"module_{project['id']}")
    module_key = keys[labels.index(active_label)]
    result = sb.table("project_data").select("content").eq("project_id", project["id"]).eq("module_key", module_key).maybe_single().execute()
    saved = result.data.get("content") if result.data else None
    content = saved if isinstance(saved, dict) else module_default(project, module_key, template)

    if module_key == "requirements":
        st.markdown("### Software Requirements Specification")
        st.write("**System actors**")
        st.write(", ".join(content.get("actors", [])))
        st.write("**Functional requirements**")
        edited_reqs = st.text_area("One requirement per line", "\n".join(content.get("functional_requirements", [])), height=220)
        st.write("**Non-functional requirements**")
        edited_nfr = st.text_area("One non-functional requirement per line", "\n".join(content.get("non_functional_requirements", [])), height=130)
        content["functional_requirements"] = [x.strip() for x in edited_reqs.splitlines() if x.strip()]
        content["non_functional_requirements"] = [x.strip() for x in edited_nfr.splitlines() if x.strip()]
    elif module_key == "uml":
        st.markdown("### UML design workspace")
        st.write("**Use case actors:** " + ", ".join(content.get("use_case_actors", [])))
        st.write("**Use cases**")
        content["use_cases"] = [x.strip() for x in st.text_area("Use cases (one per line)", "\n".join(content.get("use_cases", [])), height=160).splitlines() if x.strip()]
        st.write("**Classes**")
        content["classes"] = [x.strip() for x in st.text_area("Class names (one per line)", "\n".join(content.get("classes", [])), height=120).splitlines() if x.strip()]
        st.write("**Sequence steps**")
        content["sequence"] = [x.strip() for x in st.text_area("Sequence steps (one per line)", "\n".join(content.get("sequence", [])), height=160).splitlines() if x.strip()]
        st.info("These are editable UML planning elements. Use the exported Mermaid source to render diagrams in a Mermaid-compatible viewer.")
        mermaid = "sequenceDiagram\n" + "\n".join(f"    participant U as {a}" for a in content.get("use_case_actors", ["User"])) + "\n" + "\n".join(f"    U->>System: {step}" for step in content.get("sequence", []))
        st.code(mermaid, language="mermaid")
        st.download_button("Download UML Mermaid source", mermaid, file_name=f"{project['name']}_uml.mmd")
    elif module_key == "architecture":
        st.markdown("### Proposed system architecture")
        content["layers"] = [x.strip() for x in st.text_area("Architecture layers (one per line)", "\n".join(content.get("layers", [])), height=150).splitlines() if x.strip()]
        content["data_flow"] = st.text_area("Data flow", content.get("data_flow", ""), height=90)
        content["notes"] = st.text_area("Design notes", content.get("notes", ""), height=110)
        st.graphviz_chart("digraph G { rankdir=TB; node [shape=box, style=rounded, color='#5148dc']; " + " -> ".join(f'"{x.replace(chr(34), "")}"' for x in content["layers"]) + " }")
    elif module_key == "traceability":
        st.markdown("### Requirement Traceability Matrix")
        rows = content.get("rows", [])
        if rows:
            edited = st.data_editor(rows, use_container_width=True, num_rows="dynamic", key=f"trace_{project['id']}")
            content["rows"] = edited
            linked = sum(1 for r in edited if r.get("related_class") and r.get("test_case"))
            st.metric("Suggested mapping completeness", f"{round(100*linked/max(len(edited),1))}%")
    else:
        st.markdown("### Functional test cases")
        rows = content.get("test_cases", [])
        if rows:
            content["test_cases"] = st.data_editor(rows, use_container_width=True, num_rows="dynamic", key=f"tests_{project['id']}")

    c1, c2 = st.columns([1, 3])
    with c1:
        if st.button("Save module", type="primary", key=f"save_{project['id']}_{module_key}"):
            try:
                save_module(sb, project["id"], module_key, content)
                st.success("Module saved to Supabase.")
            except Exception as exc:
                st.error(f"Could not save module: {exc}")
    with c2:
        st.caption("Changes are saved to your Supabase PostgreSQL database when you click Save module.")


def main():
    try:
        sb = supabase_client()
    except Exception as exc:
        st.error(f"Could not initialize Supabase: {exc}")
        st.stop()

    if not current_user():
        auth_screen(sb)
        return

    user = current_user()
    uid = user.id
    with st.sidebar:
        st.markdown("# ArchiMind")
        st.caption(user.email or "Signed in")
        if st.button("Log out", use_container_width=True):
            try:
                sb.auth.sign_out()
            finally:
                st.session_state.pop("user", None)
                st.session_state.pop("selected_project", None)
                st.rerun()
        st.divider()
        st.markdown("### Workspace")
        st.caption("Your projects are scoped to your account using Supabase Row Level Security.")

    st.markdown('<div class="hero"><h1>ArchiMind</h1><p>AI-assisted software engineering and system design workspace</p></div>', unsafe_allow_html=True)
    try:
        projects = load_projects(sb, uid)
    except Exception as exc:
        st.error(f"Unable to load projects: {exc}")
        st.stop()

    st.subheader("Your Projects")
    with st.expander("＋ Create a new project", expanded=not projects):
        with st.form("create_project"):
            name = st.text_input("Project name")
            description = st.text_area("Project description")
            template = st.selectbox("Project type", list(PROJECT_TEMPLATES.keys()))
            create = st.form_submit_button("Create project", type="primary")
        if create:
            if not name.strip():
                st.warning("Enter a project name.")
            else:
                try:
                    inserted = sb.table("projects").insert({"name": name.strip(), "description": description.strip(), "user_id": uid}).execute()
                    if inserted.data:
                        st.session_state[f"template_{inserted.data[0]['id']}"] = template
                        st.success("Project created.")
                        st.rerun()
                except Exception as exc:
                    st.error(f"Could not create project: {exc}")

    if not projects:
        st.info("Create your first project to start using the five ArchiMind modules.")
        return

    project_labels = {f"{p['name']} · {p['id']}": p for p in projects}
    selected = st.selectbox("Select a project", list(project_labels.keys()))
    project = project_labels[selected]
    template_name = st.session_state.get(f"template_{project['id']}", "General Software System")
    if template_name not in PROJECT_TEMPLATES:
        template_name = "General Software System"
    st.markdown("---")
    project_workspace(sb, project, template_name)


if __name__ == "__main__":
    main()
