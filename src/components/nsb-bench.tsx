import { useRef, useState, useEffect } from "react";

const BACKEND = "http://127.0.0.1:8000";
const VALUE_OPTIONS = ["0", "100000", "500000", "1000000", "5000000", "10000000", "50000000", "100000000", "500000000", "1000000000"];

export function NsbBench() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [trailingHex, setTrailingHex] = useState("");
  const [version, setVersion] = useState(2); 
  const [playerId, setPlayerId] = useState("95209805285");
  
  const [cashVal, setCashVal] = useState("1000000000");
  const [goldVal, setGoldVal] = useState("1000000000");
  const [levelVal, setLevelVal] = useState("999");
  const [afmVal, setAfmVal] = useState("999");
  const [gachaVal, setGachaVal] = useState("Unlocked");
  
  // New toggle for cars
  const [unlockAllCars, setUnlockAllCars] = useState(false);
  const [carsText, setCarsText] = useState("");
  
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/all_cars.txt").then(r => r.text()).then(t => setCarsText(t)).catch(() => {});
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setStatus("Unpacking...");
    try {
      const raw = new Uint8Array(await file.arrayBuffer());
      const res = await fetch(`${BACKEND}/unpack`, {
        method: "POST",
        body: raw,
        headers: { "Content-Type": "application/octet-stream" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setJsonText(data.json);
      setTrailingHex(data.trailing_hex || "");
      setVersion(data.version || 2); 
      setOriginalName(file.name || "nsb");
      
      setStatus("Unpacked. Edit fields, then Build.");
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("");
    }
  }

  async function onBuild() {
    if (!jsonText) { setError("No JSON loaded."); return; }
    setError("");
    setStatus("Packing...");
    try {
      const d = JSON.parse(jsonText);
      
      d.caea = parseInt(cashVal);
      d.goea = parseInt(goldVal);
      d.agprlv = parseInt(levelVal);
      d.afme = { Green: parseInt(afmVal), Blue: parseInt(afmVal), Red: parseInt(afmVal), Yellow: parseInt(afmVal) };
      
      if (gachaVal === "Unlocked" && d.gfsi) {
        Object.keys(d.gfsi).forEach(k => { d.gfsi[k] = 0; });
      }

      // Conditionally inject all cars
      if (unlockAllCars && carsText) {
        try {
          const parsedCars = JSON.parse(carsText);
          if (Array.isArray(parsedCars)) {
            d.caow = parsedCars;
          }
        } catch (e) {
          console.warn("Could not parse all_cars.txt as valid JSON array.");
        }
      }

      const editedJson = JSON.stringify(d);

      const res = await fetch(`${BACKEND}/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: editedJson,
          player_id: playerId,
          version: version, 
          trailing_hex: trailingHex,
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
      a.download = originalName.replace(/\.nsb$/i, "") + "_modded.nsb";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Done. File downloaded.");
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("");
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">CSR2 NSB Editor</h1>
        <p className="text-sm text-gray-500 mt-1">Upload NSB → edit JSON → download modded file.</p>
      </div>

      <section className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Player ID</label>
        <input type="text" value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </section>

      <section className="flex flex-col gap-4">
        <label htmlFor="nsbFile" className="text-sm font-medium text-gray-700">Select NSB File:</label>
        <input ref={inputRef} type="file" id="nsbFile" accept="application/octet-stream" onChange={onFile} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        {originalName && <p className="text-xs text-green-600">Loaded: {originalName} (Version {version})</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">Options</h3>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Cash (Max 1 Billion)</label>
          <select value={cashVal} onChange={(e) => setCashVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            {VALUE_OPTIONS.map(o => <option key={o} value={o}>{Number(o).toLocaleString()}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Gold (Max 1 Billion)</label>
          <select value={goldVal} onChange={(e) => setGoldVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            {VALUE_OPTIONS.map(o => <option key={o} value={o}>{Number(o).toLocaleString()}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Level</label>
          <select value={levelVal} onChange={(e) => setLevelVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="1">1</option><option value="50">50</option><option value="99">99</option><option value="999">999</option><option value="9999">9999</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Aftermarket (all colors)</label>
          <select value={afmVal} onChange={(e) => setAfmVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="0">0</option><option value="100">100</option><option value="500">500</option><option value="999">999</option><option value="9999">9999</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Gacha Items</label>
          <select value={gachaVal} onChange={(e) => setGachaVal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="Locked">Locked</option><option value="Unlocked">Unlocked</option>
          </select>
        </div>
      </section>

      <div className="flex items-center gap-2 mb-2">
        <input 
          type="checkbox" 
          id="unlockCars" 
          checked={unlockAllCars} 
          onChange={(e) => setUnlockAllCars(e.target.checked)} 
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="unlockCars" className="text-sm font-medium text-gray-700">
          Unlock All Cars (Warning: May crash game)
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={onBuild} className="w-full rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          Build NSB
        </button>
        {status && <p className="text-xs text-green-600 text-center">{status}</p>}
        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
}