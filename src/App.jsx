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
    if (token) setUser({ loggedIn: true });

    api.get("/api/voices?language=en").then((res) => {
      setVoices(res.data);
    });
  }, []);

  const handleLogin = async () => {
    setAuthError("");
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("access_token", res.data.access_token);
      setUser({ loggedIn: true });
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Login failed");
    }
  };

  const handleSignup = async () => {
    setAuthError("");
    try {
      await api.post("/api/auth/signup", { email, password });
      setAuthError("Account created - now click Login");
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Signup failed");
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
        { text, voice },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      setAudioUrl(url);

      if (user) {
        await api.post("/api/history", { text, voice });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate speech");
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
      loadHistory();
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      await api.delete(`/api/history/${id}`);
      loadHistory();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const playHistoryItem = async (item) => {
    try {
      const res = await api.post(
        "/api/tts",
        { text: item.text, voice: item.voice },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      setAudioUrl(url);
    } catch (err) {
      console.error("Failed to replay", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-80">
          <h1 className="text-xl font-bold mb-4">Text to Speech</h1>
          <input
            className="w-full border rounded p-2 mb-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded p-2 mb-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {authError && <p className="text-red-500 text-sm mb-2">{authError}</p>}
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white rounded p-2 mb-2">
            Login
          </button>
          <button onClick={handleSignup} className="w-full bg-gray-200 rounded p-2">
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Text to Speech</h1>
          <div className="flex gap-3">
            <button onClick={loadHistory} className="text-sm text-blue-600">
              History
            </button>
            <button onClick={handleLogout} className="text-sm text-gray-500">
              Logout
            </button>
          </div>
        </div>

        <textarea
          className="w-full border rounded p-3 mb-2 h-32"
          placeholder="Enter your text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={3000}
        />
        <p className="text-xs text-gray-400 mb-3">{text.length} / 3000 characters</p>

        <select className="w-full border rounded p-2 mb-4" value={voice} onChange={(e) => setVoice(e.target.value)}>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.gender})
            </option>
          ))}
        </select>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button onClick={handleGenerate} disabled={loading} className="w-full bg-blue-600 text-white rounded p-3 font-medium disabled:opacity-50">
          {loading ? "Generating..." : "Generate Speech"}
        </button>

        {audioUrl && (
          <div className="mt-4">
            <audio key={audioUrl} controls src={audioUrl} className="w-full mb-2" />
            <a href={audioUrl} download="speech.mp3" className="text-blue-600 text-sm underline">
              Download Audio
            </a>
          </div>
        )}

        {showHistory && (
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">History</h2>
              <button onClick={() => setShowHistory(false)} className="text-sm text-gray-400">
                Close
              </button>
            </div>
            {history.length === 0 && (
              <p className="text-sm text-gray-400">No history yet.</p>
            )}
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((item) => (
                <li key={item.id} className="border rounded p-2 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm truncate">{item.text}</p>
                    <p className="text-xs text-gray-400">{item.voice}</p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button onClick={() => playHistoryItem(item)} className="text-blue-600 text-xs">
                      Play
                    </button>
                    <button onClick={() => toggleFavorite(item.id)} className="text-xs">
                      {item.is_favorite ? "★" : "☆"}
                    </button>
                    <button onClick={() => deleteHistoryItem(item.id)} className="text-red-500 text-xs">
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
  );
}

export default App;