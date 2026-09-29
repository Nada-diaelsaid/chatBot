## Run ChromaDB on Windows

The `npx chroma` command invokes the JavaScript client's CLI, which does not support Windows x64. Install the Python Chroma server if needed:

```powershell
py -m pip install chromadb
```

Start the server from this directory. Calling the Python-installed executable explicitly avoids the `chroma` command resolving to the npm CLI:

```powershell
$pythonScripts = py -c "import sysconfig; print(sysconfig.get_path('scripts'))"
& "$pythonScripts\chroma.exe" run --path ./src/vector-data
```


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

## RAG ingestion
You can test on both ChromaDB and pgVector, change VECTOR_DB either `chroma` or `pgvector` and it will use the equivalent Vector sore.
To ingest the documents found under ./src/data/rag_docs use cmd: npm run rag:ingest look package.json
The command will chunk the documents under either chromaDB or postgres DB

