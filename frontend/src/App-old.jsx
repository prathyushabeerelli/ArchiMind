
import { useState } from "react";
import "./App.css";

/* =====================================
   PROJECT CONFIGURATIONS
===================================== */

const projectTypes = {
  hospital: {
    actors: ["Patient", "Doctor"],
    leftCases: [
      "Register / Login",
      "Book Appointment",
      "View Doctors",
      "View Medical Records",
      "View Prescription",
      "Make Payment"
    ],
    rightCases: [
      "View Appointments",
      "Examine Patient",
      "Update Diagnosis",
      "Write Prescription"
    ],
    classes: [
      { name: "Patient", items: ["patientId", "name", "email", "bookAppointment()"] },
      { name: "Doctor", items: ["doctorId", "name", "specialization", "viewAppointments()"] },
      { name: "Appointment", items: ["appointmentId", "date", "status", "schedule()"] },
      { name: "MedicalRecord", items: ["recordId", "diagnosis", "updateRecord()"] },
      { name: "Prescription", items: ["prescriptionId", "medicines", "createPrescription()"] },
      { name: "Payment", items: ["paymentId", "amount", "processPayment()"] }
    ],
    sequence: [
      ["Patient", "Logs into the hospital system"],
      ["Patient", "Selects a doctor"],
      ["Appointment System", "Checks doctor availability"],
      ["Appointment System", "Books the appointment"],
      ["Doctor", "Examines the patient"],
      ["Doctor", "Updates diagnosis and prescription"]
    ]
  },

  shopping: {
    actors: ["Customer", "Administrator"],
    leftCases: [
      "Register / Login",
      "Browse Products",
      "Search Products",
      "View Product Details",
      "Add to Cart",
      "Place Order",
      "Make Payment"
    ],
    rightCases: [
      "Manage Products",
      "Manage Inventory",
      "Manage Orders",
      "Manage Customers"
    ],
    classes: [
      { name: "User", items: ["userId", "name", "email", "login()"] },
      { name: "Customer", items: ["customerId", "address", "viewProducts()"] },
      { name: "Product", items: ["productId", "name", "price", "updateStock()"] },
      { name: "ShoppingCart", items: ["cartId", "addItem()", "removeItem()"] },
      { name: "Order", items: ["orderId", "orderDate", "placeOrder()"] },
      { name: "Payment", items: ["paymentId", "amount", "processPayment()"] }
    ],
    sequence: [
      ["Customer", "Logs into the shopping system"],
      ["Customer", "Selects a product"],
      ["Shopping Cart", "Adds product to cart"],
      ["Customer", "Confirms the order"],
      ["Order System", "Creates the order"],
      ["Payment System", "Processes payment"]
    ]
  },

  library: {
    actors: ["Student", "Librarian"],
    leftCases: [
      "Register / Login",
      "Search Books",
      "View Book Details",
      "Check Availability",
      "Issue Book",
      "Return Book"
    ],
    rightCases: [
      "Add Books",
      "Update Book Details",
      "Manage Members",
      "Manage Book Issues"
    ],
    classes: [
      { name: "Student", items: ["studentId", "name", "email", "searchBooks()"] },
      { name: "Librarian", items: ["librarianId", "name", "addBook()"] },
      { name: "Book", items: ["bookId", "title", "author", "checkAvailability()"] },
      { name: "IssueRecord", items: ["issueId", "issueDate", "returnDate"] },
      { name: "Member", items: ["memberId", "name", "register()"] },
      { name: "Fine", items: ["fineId", "amount", "calculateFine()"] }
    ],
    sequence: [
      ["Student", "Logs into the library system"],
      ["Student", "Searches for a book"],
      ["Library System", "Checks book availability"],
      ["Student", "Requests to issue the book"],
      ["Librarian", "Approves the book issue"],
      ["Library System", "Updates book availability"]
    ]
  }
};

const defaultConfig = {
  actors: ["User", "Administrator"],
  leftCases: [
    "Register / Login",
    "View Information",
    "Search Records",
    "View Details",
    "Submit Request",
    "Track Status"
  ],
  rightCases: [
    "Manage Records",
    "Manage Users",
    "Update Information",
    "Generate Reports"
  ],
  classes: [
    { name: "User", items: ["userId", "name", "email", "login()"] },
    { name: "Administrator", items: ["adminId", "name", "manageUsers()"] },
    { name: "Record", items: ["recordId", "title", "createRecord()"] },
    { name: "Request", items: ["requestId", "status", "submitRequest()"] },
    { name: "Database", items: ["databaseId", "saveData()", "retrieveData()"] }
  ],
  sequence: [
    ["User", "Logs into the system"],
    ["User", "Selects a service"],
    ["System", "Validates the request"],
    ["Database", "Retrieves required information"],
    ["System", "Processes the request"],
    ["User", "Receives the result"]
  ]
};

/* =====================================
   PROJECT TYPE DETECTION
===================================== */

function detectProjectType(project) {
  const text = `${project.name} ${project.description}`.toLowerCase();

  if (
    text.includes("hospital") ||
    text.includes("healthcare") ||
    text.includes("medical") ||
    text.includes("patient") ||
    text.includes("clinic")
  ) return "hospital";

  if (
    text.includes("shopping") ||
    text.includes("e-commerce") ||
    text.includes("ecommerce") ||
    text.includes("online store")
  ) return "shopping";

  if (
    text.includes("library") ||
    text.includes("book issue") ||
    text.includes("librarian")
  ) return "library";

  return "default";
}

/* =====================================
   PNG EXPORT FUNCTION
===================================== */

function exportDiagram(button) {
  const container = button.closest(".diagram-container");
  const svg = container?.querySelector("svg");

  if (!svg) {
    alert("No diagram found to export.");
    return;
  }

  const clone = svg.cloneNode(true);
  const viewBox = clone.viewBox.baseVal;
  const width = viewBox.width || 1000;
  const height = viewBox.height || 600;

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], {
    type: "image/svg+xml;charset=utf-8"
  });

  const imageUrl = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Unable to export diagram.");
        URL.revokeObjectURL(imageUrl);
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const heading = container.querySelector("h3")?.textContent || "UML_Diagram";

      link.href = downloadUrl;
      link.download = `${heading.replace(/[^a-z0-9]/gi, "_")}.png`;
      link.click();

      URL.revokeObjectURL(downloadUrl);
      URL.revokeObjectURL(imageUrl);
    }, "image/png");
  };

  image.onerror = () => {
    alert("Unable to create PNG image.");
    URL.revokeObjectURL(imageUrl);
  };

  image.src = imageUrl;
}

/* =====================================
   COMMON DIAGRAM DOWNLOAD BUTTON
===================================== */

function DownloadButton({ label }) {
  return (
    <button
      className="primary-btn"
      onClick={(event) => exportDiagram(event.currentTarget)}
    >
      Download {label} PNG
    </button>
  );
}

/* =====================================
   ACTOR DRAWING
===================================== */

function Actor({ x, y, label }) {
  return (
    <g>
      <circle cx={x} cy={y} r="16" fill="none" stroke="#222" strokeWidth="3" />
      <line x1={x} y1={y + 16} x2={x} y2={y + 70} stroke="#222" strokeWidth="3" />
      <line x1={x} y1={y + 32} x2={x - 28} y2={y + 52} stroke="#222" strokeWidth="3" />
      <line x1={x} y1={y + 32} x2={x + 28} y2={y + 52} stroke="#222" strokeWidth="3" />
      <line x1={x} y1={y + 70} x2={x - 25} y2={y + 105} stroke="#222" strokeWidth="3" />
      <line x1={x} y1={y + 70} x2={x + 25} y2={y + 105} stroke="#222" strokeWidth="3" />
      <text x={x} y={y + 128} textAnchor="middle"
        fontSize="15" fontWeight="bold" fill="#222">{label}</text>
    </g>
  );
}

/* =====================================
   USE CASE DIAGRAM
===================================== */

function UseCaseDiagram({ project, config }) {
  const height = Math.max(
    470,
    100 + Math.max(config.leftCases.length, config.rightCases.length) * 65
  );

  return (
    <div className="diagram-container">
      <h3>Use Case Diagram – {project.name}</h3>
      <p>Actors and their interactions with the system.</p>

      <DownloadButton label="Use Case Diagram" />

      <svg viewBox={`0 0 1000 ${height}`} width="100%"
        role="img" aria-label="Use Case Diagram">

        <rect x="150" y="35" width="700" height={height - 65}
          rx="12" fill="#f8f9ff" stroke="#5148dc" strokeWidth="2.5" />

        <text x="500" y="65" textAnchor="middle" fontSize="20"
          fontWeight="bold" fill="#29245f">{project.name}</text>

        <Actor x={75} y={height / 2 - 65} label={config.actors[0]} />
        <Actor x={925} y={height / 2 - 65} label={config.actors[1]} />

        {config.leftCases.map((label, index) => {
          const y = 105 + index * 65;

          return (
            <g key={label}>
              <line x1="105" y1={height / 2 - 10} x2="195" y2={y + 22}
                stroke="#888" strokeWidth="1.3" />
              <ellipse cx="300" cy={y} rx="115" ry="23"
                fill="#e9e7ff" stroke="#5148dc" strokeWidth="1.6" />
              <text x="300" y={y + 5} textAnchor="middle"
                fontSize="14" fill="#29245f">{label}</text>
            </g>
          );
        })}

        {config.rightCases.map((label, index) => {
          const y = 105 + index * 65;

          return (
            <g key={label}>
              <line x1="895" y1={height / 2 - 10} x2="805" y2={y + 22}
                stroke="#888" strokeWidth="1.3" />
              <ellipse cx="700" cy={y} rx="115" ry="23"
                fill="#e4f4ff" stroke="#1685c5" strokeWidth="1.6" />
              <text x="700" y={y + 5} textAnchor="middle"
                fontSize="14" fill="#174e70">{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* =====================================
   HOSPITAL CLASS DIAGRAM
===================================== */

function HospitalClassDiagram({ project }) {
  const classBoxes = [
    { name: "Patient", x: 30, y: 45, attributes: ["patientId", "name", "email"], methods: ["bookAppointment()"] },
    { name: "Doctor", x: 350, y: 45, attributes: ["doctorId", "name", "specialization"], methods: ["viewAppointments()"] },
    { name: "Appointment", x: 670, y: 45, attributes: ["appointmentId", "date", "status"], methods: ["schedule()"] },
    { name: "MedicalRecord", x: 30, y: 350, attributes: ["recordId", "diagnosis"], methods: ["updateRecord()"] },
    { name: "Prescription", x: 350, y: 350, attributes: ["prescriptionId", "medicines"], methods: ["createPrescription()"] },
    { name: "Payment", x: 670, y: 350, attributes: ["paymentId", "amount"], methods: ["processPayment()"] }
  ];

  return (
    <div className="diagram-container">
      <h3>Class Diagram – {project.name}</h3>
      <p>Classes, attributes, methods and relationships.</p>

      <DownloadButton label="Class Diagram" />

      <svg viewBox="0 0 930 570" width="100%"
        role="img" aria-label="Hospital Class Diagram">

        <g stroke="#333" strokeWidth="1.8" fill="none">
          <line x1="260" y1="105" x2="670" y2="105" />
          <line x1="580" y1="155" x2="670" y2="155" />
          <line x1="145" y1="190" x2="145" y2="350" />
          <line x1="465" y1="190" x2="465" y2="350" />
          <line x1="260" y1="180" x2="670" y2="420" />
          <line x1="785" y1="190" x2="580" y2="420" />
        </g>

        <g fill="#29245f" fontSize="13" fontWeight="bold">
          <text x="270" y="95">1</text>
          <text x="645" y="95">0..*</text>
          <text x="590" y="145">1</text>
          <text x="645" y="145">0..*</text>
          <text x="153" y="210">1</text>
          <text x="153" y="340">0..*</text>
          <text x="473" y="210">1</text>
          <text x="473" y="340">0..*</text>
          <text x="270" y="195">1</text>
          <text x="650" y="405">0..*</text>
          <text x="785" y="210">1</text>
          <text x="580" y="405">0..1</text>
        </g>

        {classBoxes.map((item) => (
          <g key={item.name}>
            <rect x={item.x} y={item.y} width="230" height="145"
              rx="5" fill="white" stroke="#5148dc" strokeWidth="2" />

            <rect x={item.x} y={item.y} width="230" height="34"
              rx="5" fill="#5148dc" />
            <rect x={item.x} y={item.y + 27} width="230" height="7"
              fill="#5148dc" />

            <text x={item.x + 115} y={item.y + 22}
              textAnchor="middle" fill="white"
              fontWeight="bold" fontSize="15">{item.name}</text>

            {item.attributes.map((attribute, index) => (
              <text key={attribute} x={item.x + 12}
                y={item.y + 55 + index * 20}
                fontSize="12" fill="#333">- {attribute}</text>
            ))}

            <line x1={item.x} y1={item.y + 105}
              x2={item.x + 230} y2={item.y + 105} stroke="#bbb" />

            {item.methods.map((method, index) => (
              <text key={method} x={item.x + 12}
                y={item.y + 126 + index * 16}
                fontSize="12" fill="#333">+ {method}</text>
            ))}
          </g>
        ))}
      </svg>

      <div className="diagram-legend">
        <span>1 = One instance</span>
        <span>0..* = Zero or many</span>
        <span>0..1 = Zero or one</span>
      </div>
    </div>
  );
}

/* =====================================
   GENERAL CLASS DIAGRAM
===================================== */

function GeneralClassDiagram({ project, config }) {
  return (
    <div className="diagram-container">
      <h3>Class Diagram – {project.name}</h3>
      <p>Main classes, attributes and example methods.</p>

      <DownloadButton label="Class Diagram" />

      <div className="class-grid">
        {config.classes.map((item) => (
          <div className="class-card" key={item.name}>
            <h4>{item.name}</h4>
            {item.items.map((value) => <p key={value}>{value}</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassDiagram({ project, config, type }) {
  return type === "hospital"
    ? <HospitalClassDiagram project={project} />
    : <GeneralClassDiagram project={project} config={config} />;
}

/* =====================================
   SEQUENCE DIAGRAM
===================================== */

function SequenceDiagram({ project, config }) {
  return (
    <div className="diagram-container">
      <h3>Sequence Diagram – {project.name}</h3>
      <p>Example workflow showing the interaction sequence.</p>

      <DownloadButton label="Sequence Diagram" />

      <svg viewBox="0 0 900 550" width="100%"
        role="img" aria-label="Sequence Diagram">

        {config.sequence.map(([actor], index) => {
          const x = 90 + index * 140;

          return (
            <g key={index}>
              <rect x={x - 48} y="25" width="96" height="42"
                rx="6" fill="#5148dc" />
              <text x={x} y="51" textAnchor="middle"
                fill="white" fontSize="12">{actor}</text>
              <line x1={x} y1="67" x2={x} y2="515"
                stroke="#888" strokeDasharray="6 5" />
            </g>
          );
        })}

        {config.sequence.map(([actor, action], index) => {
          const fromX = 90 + index * 140;
          const toX = 90 + Math.min(index + 1, config.sequence.length - 1) * 140;
          const y = 110 + index * 65;

          return (
            <g key={index}>
              <line x1={fromX} y1={y} x2={toX} y2={y}
                stroke="#29245f" strokeWidth="2" />
              <text x={(fromX + toX) / 2} y={y - 8}
                textAnchor="middle" fontSize="11" fill="#29245f">
                {action}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* =====================================
   MODULES
===================================== */

const modules = [
  { id: "requirements", title: "Requirements & SRS", description: "Generate Software Requirements Specification" },
  { id: "uml", title: "UML Diagrams", description: "Create Use Case, Class and Sequence diagrams" },
  { id: "architecture", title: "Architecture Design", description: "Explore proposed system architecture" },
  { id: "traceability", title: "Traceability Checker", description: "Connect requirements with design and tests" },
  { id: "testing", title: "Test Cases", description: "View functional test cases" }
];

/* =====================================
   MAIN APP
===================================== */

function App() {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeModule, setActiveModule] = useState("uml");

  function createProject() {
    if (!projectName.trim() || !projectDescription.trim()) {
      alert("Please enter both project name and description.");
      return;
    }

    const newProject = {
      id: Date.now(),
      name: projectName.trim(),
      description: projectDescription.trim()
    };

    setProjects((previous) => [...previous, newProject]);
    setProjectName("");
    setProjectDescription("");
  }

  function downloadSRS(project, config) {
    const escapeHTML = (value) =>
      String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]);

    const content = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHTML(project.name)} - SRS</title>
<style>
body { font-family: Arial; margin: 45px; line-height: 1.7; }
h1,h2 { color: #29245f; }
</style>
</head>
<body>
<h1>Software Requirements Specification</h1>
<h2>${escapeHTML(project.name)}</h2>
<p>${escapeHTML(project.description)}</p>
<h2>System Actors</h2>
<ul>${config.actors.map(actor => `<li>${escapeHTML(actor)}</li>`).join("")}</ul>
<h2>Functional Requirements</h2>
<ol>
${[...config.leftCases, ...config.rightCases].map(item => `<li>${escapeHTML(item)}</li>`).join("")}
</ol>
<h2>Non-Functional Requirements</h2>
<ol>
<li>Security and privacy</li>
<li>Performance and responsiveness</li>
<li>Reliability and availability</li>
<li>User-friendly interface</li>
<li>Maintainability and scalability</li>
</ol>
<h2>Conclusion</h2>
<p>This is an initial requirements draft. Requirements should be reviewed and approved by stakeholders.</p>
</body>
</html>`;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/[^a-z0-9]/gi, "_")}_SRS.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderModule(project) {
    const type = detectProjectType(project);
    const config = projectTypes[type] || defaultConfig;

    if (activeModule === "uml") {
      return (
        <>
          <UseCaseDiagram project={project} config={config} />
          <ClassDiagram project={project} config={config} type={type} />
          <SequenceDiagram project={project} config={config} />
        </>
      );
    }

    if (activeModule === "requirements") {
      return (
        <div className="module-output">
          <h3>Software Requirements Specification</h3>
          <p><strong>Project:</strong> {project.name}</p>
          <p>{project.description}</p>

          <h4>System Actors</h4>
          <ul>{config.actors.map(actor => <li key={actor}>{actor}</li>)}</ul>

          <h4>Functional Requirements</h4>
          <ol>
            {[...config.leftCases, ...config.rightCases].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ol>

          <h4>Non-Functional Requirements</h4>
          <ul>
            <li>Security and privacy</li>
            <li>Performance</li>
            <li>Reliability</li>
            <li>Usability</li>
            <li>Scalability</li>
          </ul>

          <button className="primary-btn"
            onClick={() => downloadSRS(project, config)}>
            Download SRS Document
          </button>
        </div>
      );
    }

    if (activeModule === "architecture") {
      return (
        <div className="module-output">
          <h3>Proposed System Architecture</h3>
          <div className="architecture-flow">
            <div>React Frontend</div><span>↓</span>
            <div>FastAPI Backend</div><span>↓</span>
            <div>PostgreSQL Database</div>
          </div>
          <p>This is a proposed architecture, not a deployed system.</p>
        </div>
      );
    }

    if (activeModule === "traceability") {
      return (
        <div className="module-output">
          <h3>Requirement Traceability</h3>
          {[...config.leftCases, ...config.rightCases].map((item, index) => (
            <p className="trace-row" key={item}>
              FR-{String(index + 1).padStart(2, "0")} — {item} — Design and test mapping pending review
            </p>
          ))}
        </div>
      );
    }

    return (
      <div className="module-output">
        <h3>Sample Test Cases</h3>
        {[...config.leftCases, ...config.rightCases].map((item, index) => (
          <div className="test-case" key={item}>
            <strong>TC-{String(index + 1).padStart(2, "0")}</strong>
            <p>Verify that the system can successfully: {item.toLowerCase()}.</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>ArchiMind</h2>
        <p>AI Software Engineering Assistant</p>

        <nav>
          <button onClick={() => setSelectedProject(null)}>Dashboard</button>
          <button onClick={() => setActiveModule("requirements")}>Requirements & SRS</button>
          <button onClick={() => setActiveModule("uml")}>UML Diagrams</button>
          <button onClick={() => setActiveModule("architecture")}>Architecture Design</button>
          <button onClick={() => setActiveModule("traceability")}>Traceability Checker</button>
          <button onClick={() => setActiveModule("testing")}>Test Cases</button>
        </nav>
      </aside>

      <main className="main-content">
        <h1>Welcome to ArchiMind</h1>
        <p>Your Software Engineering and System Design workspace.</p>

        {!selectedProject ? (
          <>
            <section className="project-form">
              <h2>Create New Project</h2>

              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Enter project name"
              />

              <textarea
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                placeholder="Describe your software project"
              />

              <button className="primary-btn" onClick={createProject}>
                Create Project
              </button>
            </section>

            <section>
              <h2>Engineering Modules</h2>

              <div className="module-grid">
                {modules.map((module) => (
                  <button className="module-card" key={module.id}
                    onClick={() => setActiveModule(module.id)}>
                    <h3>{module.title}</h3>
                    <p>{module.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2>Recent Projects</h2>

              {projects.length === 0 && (
                <p>No projects created in this session yet.</p>
              )}

              {projects.map((project) => (
                <button className="project-card" key={project.id}
                  onClick={() => {
                    setSelectedProject(project);
                    setActiveModule("uml");
                  }}>
                  <strong>{project.name}</strong>
                  <p>{project.description}</p>
                  <span>Open Project →</span>
                </button>
              ))}
            </section>
          </>
        ) : (
          <section className="workspace">
            <button className="back-btn"
              onClick={() => setSelectedProject(null)}>
              ← Back to Dashboard
            </button>

            <h2>{selectedProject.name}</h2>
            <p>{selectedProject.description}</p>

            <div className="module-tabs">
              {modules.map((module) => (
                <button key={module.id}
                  className={activeModule === module.id ? "active-tab" : ""}
                  onClick={() => setActiveModule(module.id)}>
                  {module.title}
                </button>
              ))}
            </div>

            {renderModule(selectedProject)}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
