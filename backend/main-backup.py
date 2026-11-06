
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from datetime import datetime

app = FastAPI(title="ArchiMind API")

# Allow the React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "archimind.db"


# Database connection
def get_connection():
    return sqlite3.connect(DATABASE)


# Create database table
def create_table():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


create_table()


# Project input format
class Project(BaseModel):
    id: int
    name: str
    description: str


# Home API
@app.get("/")
def home():
    return {
        "message": "Welcome to ArchiMind API",
        "status": "Running"
    }


# Create project
@app.post("/projects")
def create_project(project: Project):
    conn = get_connection()

    try:
        conn.execute(
            """INSERT INTO projects
            (id, name, description, created_at)
            VALUES (?, ?, ?, ?)""",
            (
                project.id,
                project.name,
                project.description,
                datetime.now().isoformat()
            )
        )
        conn.commit()
        return {"message": "Project created successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Project ID already exists"
        )
    finally:
        conn.close()


# Get all projects
@app.get("/projects")
def get_projects():
    conn = get_connection()
    conn.row_factory = sqlite3.Row

    rows = conn.execute(
        "SELECT * FROM projects ORDER BY created_at DESC"
    ).fetchall()

    projects = [dict(row) for row in rows]
    conn.close()

    return projects


# Get one project
@app.get("/projects/{project_id}")
def get_project(project_id: int):
    conn = get_connection()
    conn.row_factory = sqlite3.Row

    row = conn.execute(
        "SELECT * FROM projects WHERE id = ?",
        (project_id,)
    ).fetchone()

    conn.close()

    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return dict(row)


# Update project
@app.put("/projects/{project_id}")
def update_project(project_id: int, project: Project):
    conn = get_connection()

    cursor = conn.execute(
        """UPDATE projects
        SET name = ?, description = ?
        WHERE id = ?""",
        (project.name, project.description, project_id)
    )

    conn.commit()
    updated = cursor.rowcount
    conn.close()

    if updated == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project updated successfully"}


# Delete project
@app.delete("/projects/{project_id}")
def delete_project(project_id: int):
    conn = get_connection()

    cursor = conn.execute(
        "DELETE FROM projects WHERE id = ?",
        (project_id,)
    )

    conn.commit()
    deleted = cursor.rowcount
    conn.close()

    if deleted == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project deleted successfully"}
