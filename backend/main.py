from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import sqlite3
import json
from datetime import datetime
from pathlib import Path

app = FastAPI(title="ArchiMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep the database beside this main.py file, regardless of the terminal folder.
DATABASE = Path(__file__).resolve().parent / "archimind.db"


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def create_tables():
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        # Stores each project's module content as JSON.
        # Existing projects are preserved; no table is dropped.
        conn.execute("""
            CREATE TABLE IF NOT EXISTS project_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                module_key TEXT NOT NULL,
                content TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(project_id, module_key),
                FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        """)
        conn.commit()
    finally:
        conn.close()


create_tables()


class Project(BaseModel):
    id: int
    name: str
    description: str


class ProjectModuleData(BaseModel):
    content: Any


@app.get("/")
def home():
    return {"message": "Welcome to ArchiMind API", "status": "Running"}


@app.get("/health")
def health():
    return {"status": "ok", "database": "connected"}


@app.post("/projects")
def create_project(project: Project):
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO projects (id, name, description, created_at)
               VALUES (?, ?, ?, ?)""",
            (project.id, project.name, project.description, datetime.now().isoformat())
        )
        conn.commit()
        return {"message": "Project created successfully", "project_id": project.id}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Project ID already exists")
    finally:
        conn.close()


@app.get("/projects")
def get_projects():
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM projects ORDER BY created_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


@app.get("/projects/{project_id}")
def get_project(project_id: int):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return dict(row)
    finally:
        conn.close()


@app.put("/projects/{project_id}")
def update_project(project_id: int, project: Project):
    conn = get_connection()
    try:
        cursor = conn.execute(
            """UPDATE projects SET name = ?, description = ? WHERE id = ?""",
            (project.name, project.description, project_id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"message": "Project updated successfully"}
    finally:
        conn.close()


@app.delete("/projects/{project_id}")
def delete_project(project_id: int):
    conn = get_connection()
    try:
        # Explicitly delete module data too, including for older SQLite setups.
        conn.execute("DELETE FROM project_data WHERE project_id = ?", (project_id,))
        cursor = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"message": "Project deleted successfully"}
    finally:
        conn.close()


# Save or replace one module's content for a project.
# module_key examples: requirements, srs, use_case, class_diagram,
# sequence_diagram, architecture, traceability, test_cases.
@app.put("/projects/{project_id}/data/{module_key}")
def save_project_module(project_id: int, module_key: str, data: ProjectModuleData):
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")

        try:
            content_json = json.dumps(data.content, ensure_ascii=False)
        except (TypeError, ValueError):
            raise HTTPException(status_code=422, detail="Module content must be JSON-compatible")

        now = datetime.now().isoformat()
        conn.execute(
            """INSERT INTO project_data (project_id, module_key, content, updated_at)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(project_id, module_key)
               DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at""",
            (project_id, module_key, content_json, now)
        )
        conn.commit()
        return {
            "message": "Module data saved successfully",
            "project_id": project_id,
            "module_key": module_key,
            "updated_at": now
        }
    finally:
        conn.close()


# Load one saved module.
@app.get("/projects/{project_id}/data/{module_key}")
def get_project_module(project_id: int, module_key: str):
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")

        row = conn.execute(
            """SELECT content, updated_at FROM project_data
               WHERE project_id = ? AND module_key = ?""",
            (project_id, module_key)
        ).fetchone()
        if row is None:
            return {"project_id": project_id, "module_key": module_key,
                    "content": None, "updated_at": None}
        return {
            "project_id": project_id,
            "module_key": module_key,
            "content": json.loads(row["content"]),
            "updated_at": row["updated_at"]
        }
    finally:
        conn.close()


# Load every saved module for one project.
@app.get("/projects/{project_id}/data")
def get_all_project_data(project_id: int):
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")

        rows = conn.execute(
            """SELECT module_key, content, updated_at FROM project_data
               WHERE project_id = ? ORDER BY module_key""",
            (project_id,)
        ).fetchall()
        return {
            "project_id": project_id,
            "modules": {
                row["module_key"]: {
                    "content": json.loads(row["content"]),
                    "updated_at": row["updated_at"]
                }
                for row in rows
            }
        }
    finally:
        conn.close()
