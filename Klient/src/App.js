import { useEffect, useState } from "react";

export default function App() {
  const path = window.location.pathname;
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  function showToast(message, type="success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      {loading && <Loader />}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {path.startsWith("/edit/") ? (
        <EditKon setLoading={setLoading} showToast={showToast} id={path.split("/")[2]} />
      ) : path === "/add" ? (
        <AddKon setLoading={setLoading} showToast={showToast} />
      ) : (
        <Home setLoading={setLoading} showToast={showToast} />
      )}
    </div>
  );
}

// =================== TOAST ===================
function Toast({ message, type }) {
  const style = {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    color: "#fff",
    backgroundColor: type === "success" ? "green" : "red",
    zIndex: 1000
  };
  return <div style={style}>{message}</div>;
}

// =================== LOADER ===================
function Loader() {
  const style = {
    position: "fixed",
    top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex", justifyContent: "center", alignItems: "center",
    color: "#fff", fontSize: "24px", zIndex: 999
  };
  return <div style={style}>Wczytywanie...</div>;
}

// =================== HOME ===================
function Home({ setLoading, showToast }) {
  const [konie, setKonie] = useState([]);
  const [filter, setFilter] = useState("all");

  function loadKonie(selectedFilter = filter) {
    const url = `http://localhost:8000/konie${selectedFilter === "all" ? "" : `?dostepnosc=${selectedFilter}`}`;
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => setKonie(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadKonie(); }, []);

  function deleteKon(id) {
    const potwierdzenie = window.confirm("Czy na pewno chcesz usunąć tego konia?");
    if (!potwierdzenie) return;

    setLoading(true);
    fetch(`http://localhost:8000/konie/${id}`, { method: "DELETE" })
      .then(async r => {
        setLoading(false);
        if (!r.ok) {
          showToast("Wystąpił błąd", "error");
          return;
        }
        showToast("Poprawnie zapisano zmiany", "success");
        loadKonie();
      })
      .catch(() => {
        setLoading(false);
        showToast("Wystąpił błąd", "error");
      });
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Lista koni</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => window.location.href = "/add"} style={{ marginRight: "20px" }}>
          Dodaj nowego konia
        </button>

        <label>
          Filtruj:{" "}
          <select
            value={filter}
            onChange={e => {
              const newFilter = e.target.value;
              setFilter(newFilter);
              loadKonie(newFilter);
            }}
          >
            <option value="all">Wszystkie</option>
            <option value="true">Tylko dostępne</option>
            <option value="false">Tylko niedostępne</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {konie.map(kon => (
          <div key={kon.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "12px", width: "220px" }}>
            <p><b>Rasa:</b> {kon.rasa}</p>
            <p><b>Wiek:</b> {kon.wiek}</p>
            <p><b>Dostępny:</b> {kon.dostepnosc_do_jazdy ? "Tak" : "Nie"}</p>

            <button onClick={() => deleteKon(kon.id)} style={{ marginRight: "10px" }}>Usuń</button>
            <button onClick={() => window.location.href = `/edit/${kon.id}`}>Edytuj</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =================== EDYCJA KONIA ===================
function EditKon({ id, setLoading, showToast }) {
  const [kon, setKon] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/konie/${id}`)
      .then(async r => {
        setLoading(false);
        if (!r.ok) throw await r.json();
        return r.json();
      })
      .then(setKon)
      .catch(err => setError(err.detail || "Nie znaleziono konia"));
  }, [id, setLoading]);

  function save(e) {
    e.preventDefault();
    setLoading(true);

    fetch(`http://localhost:8000/konie/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kon)
    })
      .then(async r => {
        setLoading(false);
        if (!r.ok) throw await r.json();
        showToast("Poprawnie zapisano zmiany", "success");
        window.location.href = "/";
      })
      .catch(err => {
        setLoading(false);
        setError(err.detail || "Błąd zapisu");
        showToast("Wystąpił błąd", "error");
      });
  }

  if (!kon) return <p>Ładowanie...</p>;

  return (
    <form onSubmit={save} style={{ padding: "20px" }}>
      <h2>Edycja konia</h2>

      <input
        placeholder="Rasa"
        value={kon.rasa}
        onChange={e => setKon({ ...kon, rasa: e.target.value })}
      /><br />

      <input
        type="number"
        placeholder="Wiek"
        value={kon.wiek}
        onChange={e => setKon({ ...kon, wiek: +e.target.value })}
      /><br />

      <label>
        <input
          type="checkbox"
          checked={kon.dostepnosc_do_jazdy}
          onChange={e => setKon({ ...kon, dostepnosc_do_jazdy: e.target.checked })}
        />
        Dostępny
      </label><br />

      {error && <p style={{ color: "red" }}>{error}</p>}
      <button>Zapisz</button>
    </form>
  );
}

// =================== DODAWANIE KONIA ===================
function AddKon({ setLoading, showToast }) {
  const [kon, setKon] = useState({ rasa: "", wiek: 0, dostepnosc_do_jazdy: true });
  const [error, setError] = useState("");

  function save(e) {
    e.preventDefault();
    setLoading(true);

    fetch("http://localhost:8000/konie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kon)
    })
      .then(async r => {
        setLoading(false);
        if (!r.ok) throw await r.json();
        showToast("Poprawnie zapisano zmiany", "success");
        window.location.href = "/";
      })
      .catch(err => {
        setLoading(false);
        setError(err.detail || "Błąd zapisu");
        showToast("Wystąpił błąd", "error");
      });
  }

  return (
    <form onSubmit={save} style={{ padding: "20px" }}>
      <h2>Dodaj nowego konia</h2>

      <input
        placeholder="Rasa"
        value={kon.rasa}
        onChange={e => setKon({ ...kon, rasa: e.target.value })}
      /><br />

      <input
        type="number"
        placeholder="Wiek"
        value={kon.wiek}
        onChange={e => setKon({ ...kon, wiek: +e.target.value })}
      /><br />

      <label>
        <input
          type="checkbox"
          checked={kon.dostepnosc_do_jazdy}
          onChange={e => setKon({ ...kon, dostepnosc_do_jazdy: e.target.checked })}
        />
        Dostępny
      </label><br />

      {error && <p style={{ color: "red" }}>{error}</p>}
      <button>Dodaj</button>
    </form>
  );
}
