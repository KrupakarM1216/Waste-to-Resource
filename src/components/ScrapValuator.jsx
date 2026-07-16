import { useCallback, useRef, useState } from 'react';

// CRITICAL FIX: Pointing to your live Render backend for the file upload
const API_URL = `${import.meta.env.VITE_API_URL || 'https://waste-to-resource.onrender.com'}/api/evaluate-scrap`;

const formatINR = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

export default function ScrapValuator() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const acceptFile = useCallback((selected) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or WebP).');
      return;
    }
    setError('');
    setResult(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file || isLoading) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // THIS IS THE MAGIC THAT PREVENTS THE 422 ERROR
      const formData = new FormData();
      formData.append('file', file); // 'file' matches your FastAPI expected field exactly

      const res = await fetch(API_URL, { 
        method: 'POST', 
        body: formData // NO Headers here! The browser handles it automatically.
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Valuation failed (${res.status})`);
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="relative mx-auto max-w-3xl px-6">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-green-900">AI Scrap Vision</h2>
          <p className="mt-4 text-gray-600">Upload a photo to estimate value and CO2 savings.</p>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-3xl border-2 border-dashed border-green-300 bg-green-50 p-10 text-center hover:bg-green-100 transition"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />
          
          {preview ? (
            <img src={preview} alt="Scrap preview" className="h-48 w-48 mx-auto rounded-xl object-cover shadow" />
          ) : (
            <p className="text-green-800 font-semibold">Drag & drop a photo here, or click to browse</p>
          )}
        </div>

        {error && <p className="mt-4 text-red-600 text-center font-bold">{error}</p>}

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={!file || isLoading}
            className="bg-green-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Photo'}
          </button>
          
          {(file || result) && (
            <button onClick={handleReset} className="text-green-700 underline font-bold">
              Reset
            </button>
          )}
        </div>

        {/* The Results Dashboard */}
        {result && (
          <div className="mt-10 p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-4 mb-4">Analysis Complete</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                <p className="text-gray-500 uppercase text-xs font-bold">Category</p>
                <p className="text-lg font-bold text-gray-900">{result.material_category}</p>
                <p className="text-xs text-gray-500">{result.specific_materials?.join(", ")}</p>
              </div>

              <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                <p className="text-gray-500 uppercase text-xs font-bold">Est. Value (per kg)</p>
                <p className="text-lg font-bold text-green-700">{formatINR(result.market_value_inr)}</p>
              </div>

              <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                <p className="text-gray-500 uppercase text-xs font-bold">Visual Weight</p>
                <p className="text-lg font-bold text-gray-900">{result.estimated_weight_kg} kg</p>
              </div>

              <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                <p className="text-gray-500 uppercase text-xs font-bold">CO2 Savings</p>
                <p className="text-lg font-bold text-emerald-600">{result.carbon_saved_kg} kg</p>
              </div>
            </div>

            <div className="mt-4 bg-white p-4 rounded shadow-sm border border-gray-100">
              <p className="text-gray-500 uppercase text-xs font-bold mb-1">Purity & Quality</p>
              <p className="text-gray-900">{result.purity_assessment}</p>
            </div>

            {result.hazard_flags?.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold text-sm">
                ⚠️ Hazards Detected: {result.hazard_flags.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}