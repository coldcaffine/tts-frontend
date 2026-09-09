
import { useState, useEffect } from "react";
import api from "./api";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState("en-US-JennyNeural");
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      setUser({ loggedIn: true });
    }

    api
      .get("/api/voices?language=en")
      .then((res) => {
        setVoices(res.data);
      })
      .catch((err) => {
        console.error("Failed to load voices", err);
      });
  }, []);

  const handleLogin = async () => {
    setAuthError("");

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("access_token", res.data.access_token);
      setUser({ loggedIn: true });
    } catch (err) {
      setAuthError(
        err.response?.data?.detail || "Login failed"
      );
    }
  };

  const handleSignup = async () => {
    setAuthError("");

    try {
      await api.post("/api/auth/signup", {
        email,
        password,
      });

      setAuthError("Account created - now click Login");
    } catch (err) {
      setAuthError(
        err.response?.data?.detail || "Signup failed"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const handleGenerate = async () => {
    setError("");

    if (!text.trim()) {
      setError("Text cannot be empty");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(
        "/api/tts",
        {
          text,
          voice,
        },
        {
          responseType: "blob",
        }
      );

      const url = URL.createObjectURL(res.data);
      setAudioUrl(url);

      if (user) {
        await api.post("/api/history", {
          text,
          voice,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to generate speech"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get("/api/history");
      setHistory(res.data);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await api.patch(`/api/history/${id}/favorite`);
      await loadHistory();
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      await api.delete(`/api/history/${id}`);
      await loadHistory();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const playHistoryItem = async (item) => {
    try {
      const res = await api.post(
        "/api/tts",
        {
          text: item.text,
          voice: item.voice,
        },
        {
          responseType: "blob",
        }
      );

      const url = URL.createObjectURL(res.data);
      setAudioUrl(url);
    } catch (err) {
      console.error("Failed to replay", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 p-4">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-xl shadow-indigo-100 w-full max-w-sm border border-white">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200">
              🎙️
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">
            Text to Speech
          </h1>

          <p className="text-center text-sm text-gray-400 mb-6">
            Turn your words into natural voice
          </p>

          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {authError && (
            <p className="text-red-500 text-xs mb-3 text-center">
              {authError}
            </p>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl py-3 mb-2 text-sm font-medium shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:opacity-95 active:scale-[0.98] transition"
          >
            Login
          </button>

          <button
            onClick={handleSignup}
            className="w-full bg-gray-50 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-100 active:scale-[0.98] transition"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-indigo-100 border border-white p-6 sm:p-8">

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-200">
                🎙️
              </div>

              <h1 className="text-lg font-bold text-gray-800">
                Text to Speech
              </h1>
            </div>

            <div className="flex gap-4">
              <button
                onClick={loadHistory}
                className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition"
              >
                History
              </button>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-gray-600 transition"
              >
                Logout
              </button>
            </div>
          </div>

          <textarea
            className="w-full border border-gray-200 rounded-2xl p-4 mb-2 h-32 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
            placeholder="Type or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={3000}
          />

          <p className="text-xs text-gray-400 mb-4 text-right">
            {text.length} / 3000
          </p>

          <select
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.gender})
              </option>
            ))}
          </select>

          {error && (
            <p className="text-red-500 text-sm mb-3 text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl py-3.5 font-medium shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Generating..." : "✨ Generate Speech"}
          </button>

          {audioUrl && (
            <div className="mt-5 bg-indigo-50/60 rounded-2xl p-4">
              <audio
                key={audioUrl}
                controls
                src={audioUrl}
                className="w-full mb-2"
              />

              <a
                href={audioUrl}
                download="speech.mp3"
                className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition"
              >
                ⬇ Download Audio
              </a>
            </div>
          )}

          {showHistory && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-700 text-sm">
                  History
                </h2>

                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  Close
                </button>
              </div>

              {history.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No history yet.
                </p>
              )}

              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 flex justify-between items-start transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        {item.text}
                      </p>

                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.voice}
                      </p>
                    </div>

                    <div className="flex gap-3 ml-3 items-center shrink-0">
                      <button
                        onClick={() => playHistoryItem(item)}
                        className="text-indigo-500 text-xs font-medium hover:text-indigo-700 transition"
                      >
                        Play
                      </button>

                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="text-amber-400 text-sm hover:scale-110 transition"
                      >
                        {item.is_favorite ? "★" : "☆"}
                      </button>

                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-red-400 text-xs font-medium hover:text-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;

