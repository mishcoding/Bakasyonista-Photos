import { useState, useRef, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ydwkakmfwdvkardywfy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkd2tha21tZndkdmthcmR5d2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODI0NTYsImV4cCI6MjA4NzU1ODQ1Nn0.bCiyzdHEbjZSlKh6PeNSOIPhWLmqFcxuyEr5IB90tgs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const phrases = {
  Greetings: [
    { id: 1, tagalog: "Magandang umaga!", english: "Good morning!", pronunciation: "mah-gan-DANG oo-MAH-gah" },
    { id: 2, tagalog: "Kamusta ka?", english: "How are you?", pronunciation: "kah-moos-TAH kah" },
    { id: 3, tagalog: "Salamat!", english: "Thank you!", pronunciation: "sah-LAH-mat" },
    { id: 4, tagalog: "Paalam!", english: "Goodbye!", pronunciation: "pah-AH-lahm" },
    { id: 5, tagalog: "Walang anuman.", english: "You're welcome.", pronunciation: "wah-LANG ah-noo-MAN" },
    { id: 6, tagalog: "(Your name) ang pangalan ko.", english: "My name is (your name)", pronunciation: "(your name) ang pa-nga-lan koh" },
  ],
  "Food & Dining": [
    { id: 7, tagalog: "Masarap!", english: "Delicious!", pronunciation: "mah-sah-RAP" },
    { id: 8, tagalog: "Isa pa nga!", english: "One more, please!", pronunciation: "EE-sah pah ngah" },
    { id: 9, tagalog: "Gusto ko ito.", english: "I want this.", pronunciation: "GOOS-toh koh EE-toh" },
    { id: 10, tagalog: "Busog na ako.", english: "I'm full already.", pronunciation: "BOO-sog nah ah-KOH" },
    { id: 11, tagalog: "Isa ngang latte, po.", english: "One latte, please!", pronunciation: "Ee-sah ngang la-teh, poh" },
    { id: 12, tagalog: "Isa order nang lumpia.", english: "One more order of lumpia, please!", pronunciation: "Ee-sah or-der nang loom-pyah" },
  ],
  "Getting Around": [
    { id: 13, tagalog: "Nasaan ang beach?", english: "Where is the beach?", pronunciation: "na-sa-Ahn ang BEE-ch" },
    { id: 14, tagalog: "Para po!", english: "Stop! (for jeepney)", pronunciation: "PAH-rah" },
    { id: 15, tagalog: "Dito lang.", english: "Just here. / Drop me here.", pronunciation: "DEE-toh lang" },
    { id: 16, tagalog: "Malapit lang ba?", english: "Is it nearby?", pronunciation: "mah-LAH-pit lang bah" },
  ],
  Shopping: [
    { id: 17, tagalog: "Magkano ito?", english: "How much is this?", pronunciation: "mag-KAH-noh EE-toh" },
    { id: 18, tagalog: "Mura pa rin!", english: "Can you lower the price?", pronunciation: "MOO-rah pah rin" },
    { id: 19, tagalog: "Tingnan ko lang.", english: "Just looking.", pronunciation: "ting-NAN koh lang" },
    { id: 20, tagalog: "Bili na ako!", english: "I'll buy it!", pronunciation: "BEE-lee nah ah-KOH" },
  ],
  "Making Friends": [
    { id: 21, tagalog: "Taga-saan ka?", english: "Where are you from?", pronunciation: "tah-gah-SAH-an kah" },
    { id: 22, tagalog: "Anong pangalan mo?", english: "What's your name?", pronunciation: "ah-NONG pan-GAH-lan moh" },
    { id: 23, tagalog: "Maganda ang Pilipinas!", english: "The Philippines is beautiful!", pronunciation: "mah-gan-DAH ang pee-lee-PEE-nas" },
    { id: 24, tagalog: "Mahal kita.", english: "I love you.", pronunciation: "mah-HAL kee-TAH" },
  ],
};

const categoryEmoji = { "Greetings": "👋", "Food & Dining": "🍜", "Getting Around": "🛺", "Shopping": "🛍️", "Making Friends": "🤝" };
const allPhrases = Object.values(phrases).flat();
const COL_COUNT = 3;
const MAX_PHOTOS = 3;
const getGridCols = (h) => h===null?"1fr 1fr 1fr":[0,1,2].map(c=>c===h?"2.4fr":"0.8fr").join(" ");
const GLOW = "0 0 0 2px #c8a96e, 0 20px 60px rgba(200,169,110,0.38), 0 8px 24px rgba(44,24,16,0.22)";
const SHADOW = "0 2px 8px rgba(44,24,16,0.09)";

async function hashPassword(password) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password.trim()) { setError("Please fill in both fields."); return; }
    setLoading(true); setError("");
    const hashed = await hashPassword(password);
    const key = username.trim().toLowerCase();

    try {
      if (mode === "signup") {
        const { data: existing } = await supabase.from("users").select("username").eq("username", key).single();
        if (existing) { setError("Username already taken. Try logging in."); setLoading(false); return; }
        const { error: insertErr } = await supabase.from("users").insert({ username: key, hashed_password: hashed });
        if (insertErr) throw insertErr;
        onLogin(key);
      } else {
        const { data: user, error: fetchErr } = await supabase.from("users").select("*").eq("username", key).single();
        if (fetchErr || !user) { setError("No account found. Create one first."); setLoading(false); return; }
        if (user.hashed_password !== hashed) { setError("Incorrect password."); setLoading(false); return; }
        onLogin(key);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f5f0e8",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:wght@400;500&display=swap');*{box-sizing:border-box;}`}</style>
      <div style={{background:"#fffdf7",borderRadius:20,padding:"40px 36px",maxWidth:400,width:"100%",boxShadow:"0 8px 48px rgba(44,24,16,0.12)",border:"1px solid #e0d5c0"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:12}}>🌺</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#1a3a3a",fontStyle:"italic",marginBottom:4}}>Bakasyonista Photos</div>
          <div style={{fontFamily:"'Lora',serif",fontSize:12,color:"#7a6555",letterSpacing:2,textTransform:"uppercase"}}>Tagalog for Travelers</div>
        </div>
        <div style={{display:"flex",marginBottom:24,borderRadius:8,overflow:"hidden",border:"1px solid #e0d5c0"}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}}
              style={{flex:1,padding:"10px",background:mode===m?"#1a3a3a":"#faf7f0",color:mode===m?"#e8d5a3":"#7a6555",border:"none",fontFamily:"'Lora',serif",fontSize:13,cursor:"pointer",transition:"all 0.2s"}}>
              {m==="login"?"Log In":"Create Account"}
            </button>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontFamily:"'Lora',serif",fontSize:11,color:"#c8a96e",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:5}}>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="e.g. travel_album"
            style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #e0d5c0",fontFamily:"'Lora',serif",fontSize:14,background:"#faf7f0",color:"#2c1810",outline:"none"}}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontFamily:"'Lora',serif",fontSize:11,color:"#c8a96e",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:5}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="••••••••"
            style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #e0d5c0",fontFamily:"'Lora',serif",fontSize:14,background:"#faf7f0",color:"#2c1810",outline:"none"}}/>
        </div>
        {error&&<div style={{fontFamily:"'Lora',serif",fontSize:12,color:"#c0503a",marginBottom:14,padding:"8px 12px",background:"rgba(192,80,58,0.08)",borderRadius:6}}>{error}</div>}
        <button onClick={submit} disabled={loading}
          style={{width:"100%",padding:"12px",background:"#1a3a3a",color:"#e8d5a3",border:"none",borderRadius:8,fontFamily:"'Playfair Display',serif",fontSize:16,cursor:"pointer",opacity:loading?0.6:1}}>
          {loading?"...":(mode==="login"?"Log In →":"Create Account →")}
        </button>
        <div style={{fontFamily:"'Lora',serif",fontSize:11,color:"rgba(122,101,85,0.5)",textAlign:"center",marginTop:16,lineHeight:1.6}}>
          Your memories are saved to your account<br/>and accessible from any device.
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function MainApp({ currentUser, onLogout }) {
  const [activeCategory, setActiveCategory] = useState("Greetings");
  const [activePage, setActivePage]         = useState("learn");
  const [expandedId, setExpandedId]         = useState(null);
  const [photos, setPhotos]                 = useState({});
  const [photosLoaded, setPhotosLoaded]     = useState(false);
  const [lightboxPhoto, setLightboxPhoto]   = useState(null);
  const [hoveredIdx, setHoveredIdx]         = useState(null);
  const fileInputRef    = useRef(null);
  const uploadTargetRef = useRef(null);

  // Load all photos for this user on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("phrase_id, slot_index, image_base64")
        .eq("username", currentUser)
        .order("slot_index");
      if (!error && data) {
        const rebuilt = {};
        data.forEach(({ phrase_id, slot_index, image_base64 }) => {
          if (!rebuilt[phrase_id]) rebuilt[phrase_id] = [];
          rebuilt[phrase_id][slot_index] = image_base64;
        });
        // Clean up any sparse arrays
        Object.keys(rebuilt).forEach(k => { rebuilt[k] = rebuilt[k].filter(Boolean); });
        setPhotos(rebuilt);
      }
      setPhotosLoaded(true);
    })();
  }, [currentUser]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const { phraseId, slotIdx } = uploadTargetRef.current;

    // Optimistic UI update
    setPhotos(prev => {
      const existing = prev[phraseId] ? [...prev[phraseId]] : [];
      if (slotIdx !== undefined) existing[slotIdx] = base64;
      else existing.push(base64);
      return { ...prev, [phraseId]: existing };
    });

    // Determine actual slot index
    const currentSlots = photos[phraseId] || [];
    const targetSlot = slotIdx !== undefined ? slotIdx : currentSlots.length;

    // Upsert to Supabase
    await supabase.from("photos").upsert({
      username: currentUser,
      phrase_id: phraseId,
      slot_index: targetSlot,
      image_base64: base64,
    }, { onConflict: "username,phrase_id,slot_index" });

    e.target.value = "";
  };

  const triggerUpload = (phraseId, slotIdx) => { uploadTargetRef.current = { phraseId, slotIdx }; fileInputRef.current.click(); };

  const removePhoto = async (phraseId, slotIdx) => {
    // Remove from Supabase
    await supabase.from("photos")
      .delete()
      .eq("username", currentUser)
      .eq("phrase_id", phraseId)
      .eq("slot_index", slotIdx);

    // Re-index remaining slots in Supabase
    const remaining = (photos[phraseId] || []).filter((_, i) => i !== slotIdx);
    // Update slot indices for all remaining photos
    for (let i = 0; i < remaining.length; i++) {
      await supabase.from("photos").upsert({
        username: currentUser, phrase_id: phraseId, slot_index: i, image_base64: remaining[i]
      }, { onConflict: "username,phrase_id,slot_index" });
    }

    setPhotos(prev => {
      const updated = [...(prev[phraseId]||[])];
      updated.splice(slotIdx, 1);
      return { ...prev, [phraseId]: updated };
    });
  };

  const photoEntries = Object.entries(photos).flatMap(([id, urls]) =>
    (urls||[]).map((url, slotIdx) => ({ phrase: allPhrases.find(p=>p.id===Number(id)), url, id: Number(id), slotIdx }))
  );
  const hoveredCol = hoveredIdx !== null ? hoveredIdx % COL_COUNT : null;

  if (!photosLoaded) return (
    <div style={{minHeight:"100vh",background:"#f5f0e8",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500&display=swap');`}</style>
      <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"#7a6555"}}>Loading your memories... 🌺</div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Georgia',serif",minHeight:"100vh",background:"#f5f0e8",color:"#2c1810"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:wght@400;500&display=swap');
        *{box-sizing:border-box;}
        .app-container{display:flex;min-height:100vh;}
        .sidebar{width:220px;background:#1a3a3a;flex-shrink:0;display:flex;flex-direction:column;height:100vh;overflow-y:auto;position:sticky;top:0;}
        .sidebar-header{padding:22px 18px 16px;border-bottom:1px solid rgba(255,255,255,0.1);}
        .sidebar-title{font-family:'Playfair Display',serif;font-size:17px;color:#e8d5a3;margin:0 0 2px;font-style:italic;}
        .sidebar-sub{font-size:9px;color:rgba(232,213,163,0.45);letter-spacing:2px;text-transform:uppercase;font-family:'Lora',serif;}
        .user-badge{padding:10px 18px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;}
        .user-name{font-family:'Lora',serif;font-size:11px;color:rgba(232,213,163,0.7);}
        .logout-btn{background:none;border:1px solid rgba(232,213,163,0.2);color:rgba(232,213,163,0.5);font-family:'Lora',serif;font-size:10px;padding:3px 8px;border-radius:4px;cursor:pointer;transition:all 0.2s;}
        .logout-btn:hover{border-color:rgba(232,213,163,0.5);color:#e8d5a3;}
        .nav-tabs{display:flex;padding:10px 14px 0;gap:4px;border-bottom:1px solid rgba(255,255,255,0.08);}
        .nav-tab{flex:1;padding:7px 4px;background:none;border:none;border-bottom:2px solid transparent;color:rgba(232,213,163,0.5);font-family:'Lora',serif;font-size:11px;cursor:pointer;text-align:center;transition:all 0.2s;margin-bottom:-1px;}
        .nav-tab:hover{color:#e8d5a3;} .nav-tab.active{color:#e8d5a3;border-bottom-color:#c8a96e;}
        .cat-btn{display:flex;align-items:center;gap:10px;width:100%;padding:12px 18px;background:none;border:none;border-left:3px solid transparent;color:rgba(232,213,163,0.65);font-family:'Lora',serif;font-size:12px;cursor:pointer;text-align:left;transition:all 0.2s;}
        .cat-btn:hover{background:rgba(232,213,163,0.07);color:#e8d5a3;}
        .cat-btn.active{background:rgba(232,213,163,0.12);color:#e8d5a3;border-left-color:#c8a96e;font-weight:500;}
        .sidebar-footer{margin-top:auto;padding:14px 18px;border-top:1px solid rgba(255,255,255,0.07);font-size:10px;color:rgba(232,213,163,0.3);font-family:'Lora',serif;line-height:1.5;}
        .main{flex:1;padding:30px 26px;min-width:0;overflow-y:auto;max-height:100vh;}
        .main-title{font-family:'Playfair Display',serif;font-size:26px;margin:0 0 4px;color:#1a3a3a;}
        .main-sub{font-family:'Lora',serif;font-size:13px;color:#7a6555;margin:0 0 14px;}
        .page-count{font-family:'Lora',serif;font-size:11px;color:#7a6555;margin-bottom:14px;}
        .phrase-card{background:#fffdf7;border:1px solid #e0d5c0;border-radius:12px;margin-bottom:10px;overflow:hidden;cursor:pointer;box-shadow:0 2px 8px rgba(44,24,16,0.05);transition:box-shadow 0.2s,transform 0.2s;}
        .phrase-card:hover{box-shadow:0 6px 24px rgba(44,24,16,0.1);transform:translateY(-1px);}
        .phrase-card.expanded{border-color:#c8a96e;}
        .card-top{padding:15px 18px;display:flex;justify-content:space-between;align-items:center;}
        .tagalog-text{font-family:'Playfair Display',serif;font-size:19px;color:#1a3a3a;margin:0 0 2px;}
        .english-text{font-family:'Lora',serif;font-size:12px;color:#7a6555;margin:0;}
        .expand-arrow{font-size:15px;color:#c8a96e;transition:transform 0.3s;flex-shrink:0;margin-left:8px;}
        .expand-arrow.open{transform:rotate(180deg);}
        .card-body{border-top:1px solid #e0d5c0;padding:15px 18px;background:#faf7f0;}
        .pron-label{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#c8a96e;font-family:'Lora',serif;margin-bottom:4px;}
        .pron-text{font-family:'Lora',serif;font-size:14px;color:#2c1810;margin:0 0 14px;font-style:italic;}
        .photo-slots{display:flex;gap:9px;flex-wrap:wrap;margin-top:6px;}
        .photo-slot{position:relative;width:86px;height:86px;border-radius:8px;overflow:hidden;flex-shrink:0;}
        .photo-slot img{width:100%;height:100%;object-fit:cover;display:block;}
        .slot-actions{position:absolute;inset:0;background:rgba(26,20,10,0.55);display:flex;align-items:center;justify-content:center;gap:5px;opacity:0;transition:opacity 0.2s;}
        .photo-slot:hover .slot-actions{opacity:1;}
        .slot-btn{background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.5);color:#fff;font-size:11px;padding:3px 6px;border-radius:4px;cursor:pointer;}
        .slot-btn:hover{background:rgba(255,255,255,0.35);}
        .add-photo-slot{width:86px;height:86px;border-radius:8px;border:1.5px dashed #c8a96e;background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:#c8a96e;font-family:'Lora',serif;font-size:9px;transition:background 0.2s;flex-shrink:0;}
        .add-photo-slot:hover{background:rgba(200,169,110,0.08);}
        .thumb-strip{display:flex;gap:3px;flex-shrink:0;}
        .thumb-strip img{width:26px;height:26px;border-radius:4px;object-fit:cover;border:1.5px solid #c8a96e;}
        .empty-state{text-align:center;padding:60px 20px;}
        .empty-icon{font-size:48px;margin-bottom:12px;}
        .empty-title{font-family:'Playfair Display',serif;font-size:22px;color:#1a3a3a;margin:0 0 8px;}
        .empty-sub{font-family:'Lora',serif;font-size:13px;color:#7a6555;line-height:1.6;}
        .lightbox-overlay{position:fixed;inset:0;background:rgba(26,20,10,0.88);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;animation:fi 0.2s ease;}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        .lightbox-inner{background:#fffdf7;border-radius:14px;overflow:hidden;max-width:500px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.5);}
        .lightbox-img{width:100%;max-height:380px;object-fit:cover;display:block;}
        .lightbox-footer{padding:14px 18px;display:flex;justify-content:space-between;align-items:center;}
        .lightbox-phrase{font-family:'Playfair Display',serif;font-size:18px;color:#1a3a3a;margin:0 0 2px;}
        .lightbox-english{font-family:'Lora',serif;font-size:12px;color:#7a6555;margin:0;}
        .lightbox-close{background:#1a3a3a;border:none;color:#e8d5a3;font-size:15px;width:32px;height:32px;border-radius:50%;cursor:pointer;flex-shrink:0;}
      `}</style>

      <div className="app-container">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Bakasyonista Photos</div>
            <div className="sidebar-sub">Tagalog for Travelers</div>
          </div>
          <div className="user-badge">
            <div className="user-name">🌴 {currentUser}</div>
            <button className="logout-btn" onClick={onLogout}>Log out</button>
          </div>
          <div className="nav-tabs">
            <button className={`nav-tab ${activePage==="learn"?"active":""}`} onClick={()=>setActivePage("learn")}>📖 Learn</button>
            <button className={`nav-tab ${activePage==="memories"?"active":""}`} onClick={()=>setActivePage("memories")}>🖼 Memories</button>
          </div>
          {activePage==="learn"&&(
            <div style={{paddingTop:8}}>
              {Object.keys(phrases).map(cat=>(
                <button key={cat} className={`cat-btn ${activeCategory===cat?"active":""}`}
                  onClick={()=>{setActiveCategory(cat);setExpandedId(null);}}>
                  <span>{categoryEmoji[cat]}</span>{cat}
                </button>
              ))}
            </div>
          )}
          <div className="sidebar-footer">
            {photoEntries.length===0?"Tap a phrase, learn it, use it in real life, then upload a memory 📸":`${photoEntries.length} photo${photoEntries.length===1?"":"s"} saved to your account!`}
          </div>
        </nav>

        <main className="main">
          {activePage==="learn"&&(
            <>
              <h1 className="main-title">{categoryEmoji[activeCategory]} {activeCategory}</h1>
              <p className="main-sub">Tap any phrase to expand and learn more</p>
              <p className="page-count">{phrases[activeCategory].length} phrases · {phrases[activeCategory].filter(p=>photos[p.id]?.length>0).length} with memories</p>
              {phrases[activeCategory].map(phrase=>{
                const phrasePhotos = photos[phrase.id]||[];
                return(
                  <div key={phrase.id} className={`phrase-card ${expandedId===phrase.id?"expanded":""}`}
                    onClick={()=>setExpandedId(expandedId===phrase.id?null:phrase.id)}>
                    <div className="card-top">
                      <div>
                        <p className="tagalog-text">{phrase.tagalog}</p>
                        <p className="english-text">{phrase.english}</p>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {phrasePhotos.length>0&&<div className="thumb-strip">{phrasePhotos.slice(0,3).map((url,i)=><img key={i} src={url} alt=""/>)}</div>}
                        <div className={`expand-arrow ${expandedId===phrase.id?"open":""}`}>▾</div>
                      </div>
                    </div>
                    {expandedId===phrase.id&&(
                      <div className="card-body" onClick={e=>e.stopPropagation()}>
                        <div className="pron-label">Pronunciation</div>
                        <p className="pron-text">[ {phrase.pronunciation} ]</p>
                        <div className="pron-label">Your Memories ({phrasePhotos.length}/{MAX_PHOTOS})</div>
                        <div className="photo-slots">
                          {phrasePhotos.map((url,slotIdx)=>(
                            <div key={slotIdx} className="photo-slot">
                              <img src={url} alt="memory"/>
                              <div className="slot-actions">
                                <button className="slot-btn" onClick={()=>triggerUpload(phrase.id,slotIdx)}>✏️</button>
                                <button className="slot-btn" onClick={()=>removePhoto(phrase.id,slotIdx)}>🗑</button>
                              </div>
                            </div>
                          ))}
                          {phrasePhotos.length<MAX_PHOTOS&&(
                            <button className="add-photo-slot" onClick={()=>triggerUpload(phrase.id)}>
                              <span style={{fontSize:18}}>📷</span><span>Add photo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {activePage==="memories"&&(
            <>
              <h1 className="main-title">🖼 Memory Wall</h1>
              <p className="main-sub">Every phrase you've lived out loud</p>
              {photoEntries.length===0?(
                <div className="empty-state">
                  <div className="empty-icon">🌺</div>
                  <div className="empty-title">No memories yet</div>
                  <div className="empty-sub">Go to <strong>Learn</strong>, open a phrase,<br/>use it in real life, then upload a photo!</div>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:getGridCols(hoveredCol),gap:12,alignItems:"stretch",transition:"grid-template-columns 0.45s cubic-bezier(.34,1.3,.64,1)"}}>
                  {photoEntries.map(({phrase,url,id,slotIdx},idx)=>{
                    const hov=hoveredIdx===idx,dim=hoveredIdx!==null&&!hov;
                    const cat=Object.entries(phrases).find(([,arr])=>arr.find(p=>p.id===id))?.[0];
                    return(
                      <div key={`${id}-${slotIdx}`}
                        onMouseEnter={()=>setHoveredIdx(idx)} onMouseLeave={()=>setHoveredIdx(null)}
                        onClick={()=>setLightboxPhoto({phrase,url})}
                        style={{borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative",zIndex:hov?2:1,
                          transition:"box-shadow 0.35s ease,transform 0.4s cubic-bezier(.34,1.4,.64,1),opacity 0.3s ease",
                          transform:hov?"translateY(-4px)":dim?"translateY(2px)":"translateY(0)",
                          boxShadow:hov?GLOW:SHADOW,opacity:dim?0.6:1}}>
                        <div style={{height:hov?260:dim?110:130,overflow:"hidden",position:"relative",transition:"height 0.45s cubic-bezier(.34,1.15,.64,1)"}}>
                          <img src={url} alt={phrase?.tagalog} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 55% 40%,rgba(200,169,110,0.22),transparent 65%)",opacity:hov?1:0,transition:"opacity 0.4s ease"}}/>
                        </div>
                        <div style={{background:"#fffdf7",padding:hov?"12px 14px":"7px 10px",overflow:"hidden",transition:"padding 0.35s ease"}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:hov?16:12,color:"#1a3a3a",marginBottom:3,whiteSpace:dim?"nowrap":"normal",overflow:"hidden",textOverflow:"ellipsis",transition:"font-size 0.35s ease"}}>{phrase?.tagalog}</div>
                          <div style={{fontFamily:"'Lora',serif",fontSize:12,color:"#7a6555",marginBottom:3,maxHeight:hov?36:0,opacity:hov?1:0,overflow:"hidden",transform:hov?"translateY(0)":"translateY(6px)",transition:"max-height 0.35s ease 0.1s,opacity 0.3s ease 0.1s,transform 0.3s ease 0.1s"}}>{phrase?.english}</div>
                          <div style={{fontSize:9,color:"#c8a96e",fontFamily:"'Lora',serif",letterSpacing:1,textTransform:"uppercase",maxHeight:hov?24:0,opacity:hov?1:0,overflow:"hidden",transform:hov?"translateY(0)":"translateY(6px)",transition:"max-height 0.35s ease 0.18s,opacity 0.3s ease 0.18s,transform 0.3s ease 0.18s"}}>{cat}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {lightboxPhoto&&(
        <div className="lightbox-overlay" onClick={()=>setLightboxPhoto(null)}>
          <div className="lightbox-inner" onClick={e=>e.stopPropagation()}>
            <img src={lightboxPhoto.url} className="lightbox-img" alt=""/>
            <div className="lightbox-footer">
              <div>
                <p className="lightbox-phrase">{lightboxPhoto.phrase?.tagalog}</p>
                <p className="lightbox-english">{lightboxPhoto.phrase?.english}</p>
              </div>
              <button className="lightbox-close" onClick={()=>setLightboxPhoto(null)}>✕</button>
            </div>
          </div>
        </div>
      )}
      <input type="file" accept="image/*" ref={fileInputRef} style={{display:"none"}} onChange={handlePhotoUpload}/>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return sessionStorage.getItem("bakasyonista-user") || null; } catch { return null; }
  });

  const handleLogin = (username) => {
    try { sessionStorage.setItem("bakasyonista-user", username); } catch {}
    setCurrentUser(username);
  };

  const handleLogout = () => {
    try { sessionStorage.removeItem("bakasyonista-user"); } catch {}
    setCurrentUser(null);
  };

  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;
  return <MainApp currentUser={currentUser} onLogout={handleLogout} />;
}
