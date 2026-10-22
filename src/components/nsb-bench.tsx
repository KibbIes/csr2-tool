import { useRef, useState, useEffect } from "react";

const BACKEND = "http://127.0.0.1:8000";
const VALUE_OPTIONS = ["0", "100000", "500000", "1000000", "5000000", "10000000", "50000000", "100000000", "500000000", "1000000000"];

export function NsbBench() {
  const inputRef = useRef<HTMLInputElement>(null);
  const scbInputRef = useRef<HTMLInputElement>(null);
  
  // NSB State
  const [jsonText, setJsonText] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [version, setVersion] = useState(2); 
  const [trailingHex, setTrailingHex] = useState("");
  
  // SCB State
  const [scbJsonText, setScbJsonText] = useState("");
  const [scbOriginalName, setScbOriginalName] = useState("");
  const [scbVersion, setScbVersion] = useState(6);
  const [scbTrailingHex, setScbTrailingHex] = useState("");

  // Modifiers
  const [playerId, setPlayerId] = useState("");
  const [cashVal, setCashVal] = useState("1000000000");
  const [goldVal, setGoldVal] = useState("1000000000");
  const [levelVal, setLevelVal] = useState("999");
  const [afmVal, setAfmVal] = useState("999");
  const [gachaVal, setGachaVal] = useState("Unlocked");
  
  const [unlockAllCars, setUnlockAllCars] = useState(false);
  const [carsText, setCarsText] = useState("");
  
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/all_cars.txt").then(r => r.text()).then(t => setCarsText(t)).catch(() => {});
  }, []);

  async function handleUpload(file: File, type: "nsb" | "scb") {
    setError("");
    setStatus(`Unpacking ${type.toUpperCase()}...`);
    try {
      const raw = new Uint8Array(await file.arrayBuffer());
      const res = await fetch(`${BACKEND}/unpack`, {
        method: "POST",
        body: raw,
        headers: { "Content-Type": "application/octet-stream" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      if (type === "nsb") {
        setJsonText(data.json);
        setVersion(data.version || 2); 
        setTrailingHex(data.trailing_hex || "");
        setOriginalName(file.name);
      } else {
        setScbJsonText(data.json);
        setScbVersion(data.version || 6);
        setScbTrailingHex(data.trailing_hex || "");
        setScbOriginalName(file.name);
      }
      setStatus(`Unpacked ${type.toUpperCase()}.`);
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("");
    }
  }

  async function buildFile(type: "nsb" | "scb") {
    if (!playerId) { setError("Please enter your Player ID."); return; }
    const isNsb = type === "nsb";
    const sourceJson = isNsb ? jsonText : scbJsonText;
    
    if (!sourceJson) { setError(`No ${type.toUpperCase()} loaded.`); return; }
    setError("");
    setStatus(`Packing ${type.toUpperCase()}...`);
    
    try {
      const d = JSON.parse(sourceJson);
      
      if (isNsb) {
        d.caea = parseInt(cashVal);
        d.goea = parseInt(goldVal);
        d.agprlv = parseInt(levelVal);
        d.afme = { Green: parseInt(afmVal), Blue: parseInt(afmVal), Red: parseInt(afmVal), Yellow: parseInt(afmVal) };
        if (gachaVal === "Unlocked" && d.gfsi) {
          Object.keys(d.gfsi).forEach(k => { d.gfsi[k] = 0; });
        }
        if (unlockAllCars && carsText) {
          try {
            const parsedCars = JSON.parse(carsText);
            if (Array.isArray(parsedCars)) d.caow = parsedCars;
          } catch (e) {}
        }
      } else {
        // Sync SCB values with NSB selections so the server doesn't flag it
        d['CashEarned'] = parseInt(cashVal);
        d['GoldEarned'] = parseInt(goldVal);
      }

      const editedJson = JSON.stringify(d);

      const res = await fetch(`${BACKEND}/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: editedJson,
          player_id: playerId,
          version: isNsb ? version : scbVersion, 
          trailing_hex: isNsb ? trailingHex : scbTrailingHex,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Pack failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (isNsb ? originalName : scbOriginalName).replace(/\.(nsb|scb)$/i, "") + "_modded";
      a.click();
      URL.revokeObjectURL(url);
      setStatus(`Done. ${type.toUpperCase()} downloaded.`);
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("");
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">CSR2 Save Editor</h1>
        <p className="text-sm text-gray-500 mt-1">Modify NSB & SCB with dynamic 6.8.0 signatures.</p>
      </div>

      <section className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Player ID</label>
        <input type="text" value={playerId} onChange={(e) => setPlayerId(e.target.value)} placeholder="Enter your Player ID" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </section>

      <section className="flex flex-col gap-4 border-b pb-4">
        <h3 className="text-sm font-semibold text-gray-700">1. Upload Files</h3>
        <div>
          <label className="block text-xs text-gray-600 mb-1">NSB File (Profile)</label>
          <input type="file" accept="application/octet-stream" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "nsb")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          {originalName && <p className="text-xs text-green-600 mt-1">Loaded: {originalName} (v{version})</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">SCB File (Cloud Backup)</label>
          <input type="file" accept="application/octet-stream" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "scb")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          {scbOriginalName && <p className="text-xs text-green-600 mt-1">Loaded: {scbOriginalName} (v{scbVersion})</p>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">2. Options (Applies to Both)</h3>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Cash</label>
          <select value={cashVal} onChange={(e) => setCashVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            {VALUE_OPTIONS.map(o => <option key={o} value={o}>{Number(o).toLocaleString()}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Gold</label>
          <select value={goldVal} onChange={(e) => setGoldVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            {VALUE_OPTIONS.map(o => <option key={o} value={o}>{Number(o).toLocaleString()}</option>)}
          </select>
        </div>
        
        <div className="pt-2">
          <label className="block text-xs text-gray-600 mb-1">Level (NSB Only)</label>
          <select value={levelVal} onChange={(e) => setLevelVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="1">1</option><option value="50">50</option><option value="99">99</option><option value="999">999</option><option value="9999">9999</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Aftermarket (NSB Only)</label>
          <select value={afmVal} onChange={(e) => setAfmVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="0">0</option><option value="100">100</option><option value="500">500</option><option value="999">999</option><option value="9999">9999</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Gacha Items (NSB Only)</label>
          <select value={gachaVal} onChange={(e) => setGachaVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="Locked">Locked</option><option value="Unlocked">Unlocked</option>
          </select>
        </div>
      </section>

      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" id="unlockCars" checked={unlockAllCars} onChange={(e) => setUnlockAllCars(e.target.checked)} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
        <label htmlFor="unlockCars" className="text-sm font-medium text-gray-700">Unlock All Cars (Experimental)</label>
      </div>

      <section className="flex flex-col gap-2 border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">3. Build & Download</h3>
        <button onClick={() => buildFile("nsb")} disabled={!jsonText} className="w-full rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400">
          Build NSB
        </button>
        <button onClick={() => buildFile("scb")} disabled={!scbJsonText} className="w-full rounded-md bg-green-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:bg-gray-400">
          Build SCB
        </button>
      </section>

      <div className="flex flex-col gap-2 mt-2">
        {status && <p className="text-xs text-green-600 text-center">{status}</p>}
        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
}