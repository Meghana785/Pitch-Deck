import os

with open("CSE435_Seminar_Report.md", "a") as f:
    f.write("\n\n<div style=\"page-break-after: always;\"></div>\n\n# Appendix: Core Source Code\n\n")
    f.write("This appendix contains the core source code implemented for the PitchReady AI pipeline and backend architecture to demonstrate the extensive engineering effort involved in the project.\n\n")
    
    files_to_include = [
        "worker/pipeline/state.py",
        "worker/pipeline/agents/extractor.py",
        "worker/pipeline/agents/assumption_mapper.py",
        "worker/pipeline/agents/domain_interrogator.py",
        "worker/pipeline/agents/report_synthesizer.py",
        "worker/worker.py",
        "backend/main.py",
        "backend/db/models.py",
        "backend/middleware/auth.py",
        "backend/routers/admin.py",
        "backend/routers/jobs.py"
    ]
    
    for file_path in files_to_include:
        if os.path.exists(file_path):
            with open(file_path, "r") as code_file:
                code = code_file.read()
                f.write(f"## {file_path}\n\n```python\n{code}\n```\n\n")

