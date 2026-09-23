<!-- For chromadb:
// If you restart your PC or this terminal closes, remember
//  you'll need to re-run chroma run --path ./getting-started from the agentic-app-backend directory 
// to bring the server back up. 
// Want me to set that up as an npm script (e.g. npm run chroma:serve) so it's a one-liner going forward?

// To kill chromadb server running: pkill -9 node (Linux.Mac version) -> Search for windows command. -->

## To view chromaDB use DB browser on windows.

## For pgVector:
https://node-postgres.com/
npm i pg pgvector

Follow this link: https://dev.to/mehmetakar/install-pgvector-on-windows-6gl
installation:
To install postgres sql server on windows:
https://www.postgresql.org/
Make sure to add postgres bin directory under PATH environment variable (windows).
pip install pgvector (if using python)
Run cmd prompt as Admin: choco install make -y
And install VS build tools.

<!-- We want to install vector similarity for postgres (pgvector): -->
Run x64 Native Tools Command Prompt for VS from start menu.
```cmd
set "PGROOT=C:\Program Files\PostgreSQL\18"
cd %TEMP%
git clone --branch v0.8.6 https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win (nmake.exe is already found in Native tools cmd)
nmake /F Makefile.win install
```

## Create psql DB
# You can check the create DB from pgadmin app
1) Make sure to add postgres bin directory under PATH environment variable (windows).
2) In cmd: psql -U postgres
3) To confirm the correct installtion: psql --version
4) Inside postgres:  CREATE DATABASE rag_vector_db;
5) \c rage_vector_db
6) CREATE EXTENSION IF NOT EXISTS vector;
