# Job Runner

Job Runner ist eine kleine Auftragsverarbeitung in drei einzeln startbaren
Diensten, die sich eine gemeinsame SQLite-Datei teilen. Die FastAPI-API nimmt
Textaufträge zusammen mit einer gewünschten Auswertung entgegen und legt sie als
wartend an. Ein separater Python-Worker holt offene Aufträge, führt die
Auswertung aus und schreibt Ergebnis und Status zurück. Ein Vite/React-Frontend
legt Aufträge an, zeigt die Liste mit Status und Ergebnis und aktualisiert sich
im Hintergrund selbst.

## Tech-Stack

- Python 3.12 für API und Worker
- FastAPI + Uvicorn, Pydantic-Modelle
- SQLite als gemeinsame Datenhaltung (WAL-Modus, `busy_timeout`)
- TypeScript, Vite und React für das Frontend
- pytest für API und Worker, Vitest für das Frontend

## Projektstruktur

- `backend/` — FastAPI-Dienst `api` auf Port 8000
- `worker/` — eigenständiger Python-Dienst `worker` mit Polling-Schleife
- `frontend/` — Vite/React-Oberfläche `web` auf Port 3000

## Installation

Für die API (Python 3.12+):

```bash
cd backend
python -m pip install -r requirements.txt
```

## Starten in der Entwicklung

Der Dienst wird über seinen Eintrag in `RUN.json` gestartet. Für die API ist das
im Verzeichnis `backend/`:

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Beim Start legt die API die SQLite-Datei samt Tabelle `jobs` an, sofern sie noch
nicht existiert. Danach sind die Endpunkte unter `http://localhost:8000`
erreichbar. Der Worker und das Frontend werden ebenfalls über ihre Einträge in
`RUN.json` gestartet.

## Build für die Auslieferung

Das Frontend wird in `frontend/` gebaut:

```bash
cd frontend
npm install
npm run build
```

Der Build legt die statischen Dateien in `frontend/dist/` ab; diese können von
einem beliebigen Dateiserver ausgeliefert werden. Die API und der Worker sind
reine Python-Prozesse und benötigen keinen eigenen Build-Schritt.

## Umgebungsvariablen

| Variable | Dienst | Standard | Bedeutung |
| --- | --- | --- | --- |
| `JOBS_DB_PATH` | api, worker | `<Repo-Wurzel>/jobs.db` | Pfad zur gemeinsamen SQLite-Datei. Beide Dienste leiten den Standard aus ihrem Dateipfad ab, sodass sie dieselbe Datei öffnen. |
| `CORS_ALLOWED_ORIGIN` | api | `http://localhost:3000` | Origin, der Cross-Origin-Zugriff auf die API erhält (die Adresse des Frontends). |
| `WORKER_POLL_INTERVAL_SECONDS` | worker | `2` | Wartezeit des Workers zwischen zwei Abfragen offener Aufträge. |
| `VITE_API_BASE_URL` | web | Adresse der API | Basis-URL, unter der das Frontend die API erreicht. |

## API

Alle Antworten sind JSON. Die API antwortet auf Port `8000`.

### `GET /api/health`

Prüft, ob der Dienst bereit ist.

Antwort `200`:

```json
{ "status": "ok" }
```

### `POST /api/jobs`

Legt einen neuen Auftrag an.

Anfragekörper:

```json
{ "text": "drei kleine Wörter", "analysis": "word_count" }
```

- `text` — nicht leer und nicht nur aus Leerzeichen bestehend
- `analysis` — eine von `word_count`, `top_words`, `reading_time`

Antwort `201`:

```json
{
  "id": 1,
  "text": "drei kleine Wörter",
  "analysis": "word_count",
  "status": "pending",
  "result": null,
  "error": null,
  "created_at": "2026-10-08T12:00:00Z",
  "updated_at": "2026-10-08T12:00:00Z"
}
```

### `GET /api/jobs`

Liefert alle Aufträge, neueste zuerst.

Antwort `200`:

```json
{
  "jobs": [
    {
      "id": 1,
      "text": "drei kleine Wörter",
      "analysis": "word_count",
      "status": "done",
      "result": { "words": 3 },
      "error": null,
      "created_at": "2026-10-08T12:00:00Z",
      "updated_at": "2026-10-08T12:00:05Z"
    }
  ]
}
```

### `GET /api/jobs/{id}`

Liefert einen einzelnen Auftrag.

- Antwort `200`: ein `JobResponse`-Objekt wie oben.
- Antwort `404`: unbekannte `id`.

### Ergebnisform je Auswertung

- `word_count` → `{ "words": 3 }`
- `top_words` → `{ "words": [ { "word": "und", "count": 4 } ] }` (höchstens zehn Einträge, absteigend nach Häufigkeit)
- `reading_time` → `{ "minutes": 0.015, "words": 3 }` (bei 200 Wörtern pro Minute)

### Einheitliches Fehlerformat

Jede Nicht-2xx-Antwort hat denselben Körper:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": null
  }
}
```

## Tests

```bash
cd backend
PYTHONPATH=. python -m pytest
```

## Funktionen

- FastAPI-Skelett mit den Routern `health` und `jobs`
- `GET /api/health` als sichtbarer Ende-zu-Ende-Pfad
- Vollständige Pydantic-Modelle für Auftrag, Status, Ergebnis und Fehler
- Einheitliches Fehlerformat für HTTP- und Validierungsfehler
- Gemeinsame SQLite-Datei mit WAL-Modus und `busy_timeout`, Tabelle `jobs` wird beim Start angelegt
- CORS für die konfigurierbare Frontend-Adresse
- Signatur aller Auftrags-Endpunkte deklariert; die Auftragslogik folgt in einem späteren Schritt
