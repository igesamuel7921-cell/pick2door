import React, { useState, useEffect } from "react";

// HMTI Marketplace - Single-file React component
// Tailwind-ready, single default export component
// Features:
// - List / create / delete listings
// - Search, category filter, price sort
// - Location filter with a built-in "Near HMTI" option
// - Persistence via localStorage
// - Export / Import JSON for sharing listings

const STORAGE_KEY = "hmti_marketplace_listings_v1";

const sampleData = [
  {
    id: "1",
    title: "Used Honda Motorcycle",
    description: "Good condition, recently serviced. Fuel efficient.",
    price: 220000,
    currency: "NGN",
    category: "Vehicles",
    location: "Near HMTI",
    contact: "+2348012345678"
  },
  {
    id: "2",
    title: "Android Smartphone - 32GB",
    description: "Lightly used, screen protector included.",
    price: 45000,
    currency: "NGN",
    category: "Electronics",
    location: "Port Harcourt",
    contact: "+2348098765432"
  }
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function currencyFormat(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function HMTIMarketplace() {
  const [listings, setListings] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Other",
    location: "Near HMTI",
    contact: ""
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setListings(JSON.parse(raw));
        return;
      } catch (e) {
        console.error("Failed to parse listings in storage", e);
      }
    }
    setListings(sampleData);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  }, [listings]);

  function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.price) return alert("Give a title and price.");
    const newItem = {
      id: uid(),
      title: form.title,
      description: form.description,
      price: Number(form.price),
      currency: "NGN",
      category: form.category || "Other",
      location: form.location || "Near HMTI",
      contact: form.contact || ""
    };
    setListings([newItem, ...listings]);
    setForm({ title: "", description: "", price: "", category: "Other", location: "Near HMTI", contact: "" });
  }

  function handleDelete(id) {
    if (!confirm("Delete this listing?")) return;
    setListings(listings.filter(l => l.id !== id));
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(listings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hmti_listings.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Invalid file");
        // basic validation
        const clean = data.map((d) => ({
          id: d.id || uid(),
          title: d.title || "Untitled",
          description: d.description || "",
          price: Number(d.price) || 0,
          currency: d.currency || "NGN",
          category: d.category || "Other",
          location: d.location || "Unknown",
          contact: d.contact || ""
        }));
        setListings(clean.concat(listings));
        e.target.value = null;
        alert("Imported listings — check them in the feed.");
      } catch (err) {
        alert("Failed to import: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  const categories = ["All", ...Array.from(new Set(listings.map(l => l.category)))];
  const locations = ["All", "Near HMTI", ...Array.from(new Set(listings.map(l => l.location).filter(x => x && x !== "Near HMTI")))]

  const filtered = listings.filter(l => {
    if (category !== "All" && l.category !== category) return false;
    if (locationFilter !== "All" && l.location !== locationFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!(l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || (l.category && l.category.toLowerCase().includes(q)))) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    // newest first (by array order - we put newest at front)
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">HMTI Marketplace</h1>
          <p className="text-sm text-gray-600">Buy & sell goods around HMTI — NGN pricing, local contact. Built for demo & local use.</p>
        </header>

        <section className="grid md:grid-cols-3 gap-6">
          <form onSubmit={handleCreate} className="md:col-span-1 bg-white p-4 rounded-2xl shadow">
            <h2 className="font-semibold mb-2">Create Listing</h2>
            <label className="text-xs">Title</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-2 border rounded mt-1 mb-2" placeholder="e.g. Second-hand laptop" />
            <label className="text-xs">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full p-2 border rounded mt-1 mb-2" placeholder="Condition, age, extras..."></textarea>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs">Price (NGN)</label>
                <input value={form.price} onChange={e => setForm({...form, price: e.target.value.replace(/[^0-9]/g, '')})} className="w-full p-2 border rounded mt-1 mb-2" placeholder="120000" />
              </div>
              <div className="w-32">
                <label className="text-xs">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-2 border rounded mt-1 mb-2">
                  <option>Electronics</option>
                  <option>Furniture</option>
                  <option>Clothing</option>
                  <option>Vehicles</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <label className="text-xs">Location</label>
            <select value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full p-2 border rounded mt-1 mb-2">
              <option>Near HMTI</option>
              <option>Port Harcourt</option>
              <option>Rivers State</option>
              <option>Other</option>
            </select>
            <label className="text-xs">Contact (phone / WhatsApp)</label>
            <input value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="w-full p-2 border rounded mt-1 mb-2" placeholder="+23480..." />
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-2xl" type="submit">Create</button>
              <button type="button" onClick={() => { setForm({ title: "", description: "", price: "", category: "Other", location: "Near HMTI", contact: "" }) }} className="px-4 py-2 border rounded-2xl">Clear</button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>Tip: Use a WhatsApp link in contact (e.g. +234801234...) so buyers can reach you quickly.</p>
            </div>
          </form>

          <div className="md:col-span-2">
            <div className="bg-white p-4 rounded-2xl shadow mb-4">
              <div className="flex gap-2 flex-col sm:flex-row sm:items-center">
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title, description, category..." className="flex-1 p-2 border rounded" />
                <select value={category} onChange={e => setCategory(e.target.value)} className="p-2 border rounded">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="p-2 border rounded">
                  {locations.map(l => <option key={l}>{l}</option>)}
                </select>
                <select value={sort} onChange={e => setSort(e.target.value)} className="p-2 border rounded">
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
                <div className="flex gap-2 ml-auto">
                  <button onClick={handleExport} className="px-3 py-2 border rounded">Export JSON</button>
                  <label className="px-3 py-2 border rounded cursor-pointer">
                    Import
                    <input type="file" accept="application/json" onChange={handleImport} style={{ display: "none" }} />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.length === 0 && (
                <div className="p-6 bg-white rounded-2xl shadow text-center text-gray-500">No listings found — try widening filters or add the first listing.</div>
              )}

              {filtered.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <div className="text-xs text-gray-500">{item.category} • {item.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">NGN {currencyFormat(item.price)}</div>
                      <div className="text-xs text-gray-400">{item.contact ? "Contact available" : "No contact"}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700 flex-1">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">ID: {item.id}</div>
                    <div className="flex gap-2">
                      {item.contact && (
                        <a className="px-3 py-1 border rounded text-xs" href={`https://wa.me/${item.contact.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="px-3 py-1 border rounded text-xs">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        <footer className="text-center text-xs text-gray-500 mt-8">Built for demonstration at HMTI • Data stored locally in your browser</footer>
      </div>
    </div>
  );
}
