import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const THEMES = [
  "fear and love","the last time","something you never said",
  "a door you closed","what home meant","the person you were becoming",
  "a kindness you never forgot","what the city taught you",
  "the version of you nobody knew","distance",
  "the best day","a risk that paid off","something you're proud of",
  "a stranger who changed things","where you were at midnight",
  "the job you'll never forget","a place you miss","what you learned too late",
  "the conversation that changed everything","something that still makes you laugh",
  "a decision you'd make again","a year that surprised you",
  "what you'd tell your younger self","the meal you still think about",
  "a friendship that faded","something you built","a moment of pure luck",
  "what nobody knew you were going through","the thing you're most grateful for",
  "a lesson from someone unexpected","what you found when you weren't looking",
  "the summer of","a second chance","what home sounds like",
  "the trip that changed you","a promise you kept"
];

const GLYPHS = ["★","☆","✦","♥","♡","◆","◇","✿","~","—","•","∞"];

const PROMPTS = [
  "what do you keep coming back to?",
  "what year changed you the most?",
  "who taught you something without knowing it?",
  "what do you wish you'd said?",
  "where were you when you finally felt like yourself?",
  "what have you forgiven yourself for?",
  "what would the ten-years-ago you need to hear?",
  "what did you lose that you never looked for?"
];

const SEEDS = [
  {
    id:"s1", handle:"dan_k", anon:false, ts:"2001-06-14T19:32:00",
    tags:["travel","spontaneous","friendship"],
    blocks:[{ type:"text", value:"In 2001 I quit my job on a Friday and by Sunday I was on a train to Edinburgh with £40 and a mate who also had no plan. We busked outside a chip shop even though neither of us can really play guitar. Made £11.50. Best weekend of my life. Still friends with that guy. He's my best man in September." }]
  },
  {
    id:"s2", handle:"", anon:true, ts:"2005-08-03T11:15:00",
    tags:["food","family","memory"],
    blocks:[{ type:"text", value:"My dad made the same pasta every Sunday for 30 years. Never used a recipe. Just threw things in. I used to think it was embarrassing how simple it was.\n\nLast year I finally wrote down what he does, step by step, while watching him. It took four Sundays to get it right.\n\nI make it now. It tastes exactly the same. I don't know why that surprised me." }]
  },
  {
    id:"s3", handle:"priya_writes", anon:false, ts:"2009-03-21T08:44:00",
    tags:["career","courage","change"],
    blocks:[{ type:"text", value:"I handed in my notice at a job I'd been at for 9 years. Everyone thought I was mad. I thought I was mad.\n\nThat was 15 years ago. I started a bakery with my sister. We have four of them now.\n\nMy old boss came in last month. He ordered a coffee and a croissant and said 'good for you.' I think that was his version of an apology." }]
  },
  {
    id:"s4", handle:"T_Okafor", anon:false, ts:"2019-01-01T00:03:00",
    tags:["hope","letters","turning-point"],
    blocks:[{ type:"text", value:"Age 22. Completely broke. I wrote a letter to myself to open in ten years. Described the person I wanted to be. Mailed it to my mum's.\n\nI read it last month. Every single thing I wrote down happened. I cried for about an hour.\n\nI don't believe in much. But I believe in that letter." }]
  },
  {
    id:"s5", handle:"", anon:true, ts:"2022-07-19T14:20:00",
    tags:["kindness","strangers","city"],
    blocks:[{ type:"text", value:"I was having a genuinely awful day. Missed a deadline, got soaked, my phone died. I sat down outside a cafe and a woman I'd never met put a coffee on the table in front of me and said 'you look like you need this' and walked off before I could say thank you.\n\nI think about her a lot. I try to be her sometimes." }]
  },
  {
    id:"s6", handle:"marcus_b", anon:false, ts:"2015-04-11T20:05:00",
    tags:["running","fitness","unexpected"],
    blocks:[{ type:"text", value:"I started running at 47 because my doctor told me to. I hated every second of the first three months.\n\nI ran a half marathon at 51. Then a full one at 53. Last year I ran across the Lake District for no reason other than I wanted to see if I could.\n\nMy doctor retired. I sent him a photo from the finish line." }]
  }
];

function fmtShort(iso) {
  const d = new Date(iso);
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${mo[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function uid() { return "e" + Date.now() + Math.random().toString(36).slice(2,5); }
function readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function parseTags(raw) {
  return raw.split(/[,\s]+/).map(t => t.replace(/^#+/,"").trim().toLowerCase()).filter(Boolean);
}

const W = {
  win:   { background:"#c0c0c0", border:"2px solid", borderColor:"#ffffff #808080 #808080 #ffffff", boxShadow:"2px 2px 0 #000" },
  tbar:  { background:"linear-gradient(to right,#00007f,#0000cd,#1084d0)", color:"#fff", padding:"6px 8px", fontFamily:"Arial,sans-serif", fontSize:"13px", fontWeight:"bold", display:"flex", alignItems:"center", justifyContent:"space-between", userSelect:"none" },
  btn:   { background:"#c0c0c0", border:"2px solid", borderColor:"#ffffff #808080 #808080 #ffffff", padding:"10px 18px", fontFamily:"Arial,sans-serif", fontSize:"14px", cursor:"pointer", color:"#000", minWidth:"80px", WebkitTapHighlightColor:"transparent" },
  btnSm: { background:"#c0c0c0", border:"2px solid", borderColor:"#ffffff #808080 #808080 #ffffff", padding:"6px 12px", fontFamily:"Arial,sans-serif", fontSize:"13px", cursor:"pointer", color:"#000", WebkitTapHighlightColor:"transparent" },
  inp:   { background:"#fff", border:"2px solid", borderColor:"#808080 #fff #fff #808080", padding:"10px", fontFamily:"Times New Roman,serif", fontSize:"16px", width:"100%", boxSizing:"border-box", WebkitAppearance:"none", borderRadius:"0" },
  ta:    { background:"#fff", border:"2px solid", borderColor:"#808080 #fff #fff #808080", padding:"10px", fontFamily:"Times New Roman,serif", fontSize:"16px", width:"100%", boxSizing:"border-box", resize:"vertical", lineHeight:1.7, WebkitAppearance:"none", borderRadius:"0" },
  inset: { background:"#c0c0c0", border:"2px solid", borderColor:"#808080 #fff #fff #808080", padding:"8px 10px" },
};

function RainbowHR() {
  return <div style={{ height:"4px", background:"linear-gradient(to right,#f00,#f80,#ff0,#0c0,#00f,#80c,#f00)", margin:"8px 0" }} />;
}

function Counter({ n }) {
  return (
    <span style={{ display:"inline-flex", gap:"1px" }}>
      {String(n).padStart(5,"0").split("").map((d,i) => (
        <span key={i} style={{ background:"#000", color:"#00ff00", fontFamily:"Courier New,monospace", fontSize:"18px", fontWeight:"bold", padding:"2px 5px", border:"1px solid #333", minWidth:"20px", textAlign:"center" }}>{d}</span>
      ))}
    </span>
  );
}

function UCon() {
  const [f,setF] = useState(0);
  useEffect(() => { const t = setInterval(() => setF(x=>(x+1)%2),700); return ()=>clearInterval(t); },[]);
  return <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#ff8800", fontWeight:"bold" }}>{f?"🔧":"⚠️"} UNDER CONSTRUCTION</span>;
}

function Win({ title, icon="📄", children, style={} }) {
  return (
    <div style={{ ...W.win, marginBottom:"12px", ...style }}>
      <div style={W.tbar}>
        <span style={{ fontSize:"13px" }}>{icon} {title}</span>
      </div>
      <div style={{ padding:"10px" }}>{children}</div>
    </div>
  );
}

function ShareSheet({ entry, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = entry.blocks.filter(b=>b.type==="text").map(b=>b.value).join("\n\n");
  const author = entry.anon ? "Anonymous" : entry.handle;
  const url = window.location.origin + "/entry/" + entry.id;

  const copyLink = () => { navigator.clipboard.writeText(url).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const mailTo = () => {
    const subject = encodeURIComponent("Found this on The Public Journal");
    const body = encodeURIComponent('"' + text.slice(0,200) + (text.length>200?"...":"") + '" — ' + author + "\n\n" + url);
    window.open("mailto:?subject=" + subject + "&body=" + body);
  };
  const copyText = () => { navigator.clipboard.writeText(`"${text}" — ${author}\n${url}`).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"flex-end" }} onClick={onClose}>
      <div style={{ ...W.win, width:"100%", borderBottom:"none" }} onClick={e=>e.stopPropagation()}>
        <div style={W.tbar}><span>📤 Share This Entry</span><span onClick={onClose} style={{ cursor:"pointer", fontSize:"16px", padding:"0 4px" }}>✕</span></div>
        <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:"8px" }}>
          <div style={{ ...W.inset, fontSize:"13px", fontFamily:"Times New Roman,serif", fontStyle:"italic", lineHeight:1.6, maxHeight:"70px", overflow:"hidden" }}>
            "{text.slice(0,100)}{text.length>100?"...":""}" — {author}
          </div>
          <button style={{ ...W.btn, width:"100%", textAlign:"left", fontSize:"15px" }} onClick={copyLink}>{copied?"✓ Copied!":"🔗 Copy Link"}</button>
          <button style={{ ...W.btn, width:"100%", textAlign:"left", fontSize:"15px" }} onClick={mailTo}>📧 Send by E-Mail</button>
          <button style={{ ...W.btn, width:"100%", textAlign:"left", fontSize:"15px" }} onClick={copyText}>📋 Copy Entry Text</button>
          <button style={{ ...W.btn, width:"100%", textAlign:"center", fontSize:"15px" }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Card({ s, idx, onShare, onTagClick }) {
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(s.likes || 0);
  const firstText = s.blocks.find(b=>b.type==="text");
  const preview = firstText ? firstText.value.slice(0,200)+(firstText.value.length>200?"...":"") : "";
  const hasMore = s.blocks.length>1||(firstText&&firstText.value.length>200);
  const author = s.anon ? "Anonymous" : s.handle;

  const handleLike = async (e) => {
    e.stopPropagation();
    if (liked) return;
    setLiked(true);
    setLikes(n=>n+1);
    await supabase.from("entries").update({ likes: likes+1 }).eq("id", s.id);
  };

  return (
    <div style={{ ...W.win, marginBottom:"12px" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ ...W.tbar, cursor:"pointer", minHeight:"44px" }}>
        <span style={{ display:"flex", alignItems:"center", gap:"8px", flex:1, minWidth:0, overflow:"hidden" }}>
          <span style={{ fontSize:"15px" }}>{open?"📖":"📄"}</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{author}</span>
          <span style={{ fontWeight:"normal", fontSize:"11px", opacity:0.8, whiteSpace:"nowrap" }}>{fmtShort(s.ts)}</span>
        </span>
        <span style={{ fontFamily:"Arial,sans-serif", fontSize:"12px", fontWeight:"normal", whiteSpace:"nowrap", marginLeft:"8px", opacity:0.85 }}>{open?"▲":"▼"}</span>
      </div>

      <div style={{ background:"#d4d0c8", borderBottom:"1px solid #808080", padding:"4px 10px", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"4px" }}>
        <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#555" }}>
          {s.anon ? <em>anonymous</em> : <strong style={{ color:"#000080" }}>{s.handle}</strong>}
        </span>
        <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#777" }}>
          {liked?"♥":"♡"} {likes} found this meaningful
        </span>
      </div>

      <div onClick={()=>setOpen(o=>!o)} style={{ padding:"12px 10px 8px", cursor:"pointer", background:open?"#fff":"#f0efe8" }}>
        <p style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", lineHeight:1.8, color:"#000", margin:0, whiteSpace:"pre-wrap" }}>
          {preview}
          {hasMore&&!open&&<span style={{ color:"#000080" }}> <u>[more]</u></span>}
        </p>
      </div>

      {open && (
        <div style={{ padding:"4px 10px 10px", background:"#fff", borderTop:"1px dotted #aaa" }}>
          <RainbowHR />
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {s.blocks.map((b,i)=>(
              b.type==="image"
                ? <img key={i} src={b.value} alt="" style={{ maxWidth:"100%", border:"2px solid", borderColor:"#808080 #fff #fff #808080" }} />
                : <p key={i} style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", lineHeight:1.8, color:"#000", margin:0, whiteSpace:"pre-wrap" }}>{b.value}</p>
            ))}
          </div>
          <RainbowHR />
        </div>
      )}

      <div style={{ background:"#d4d0c8", borderTop:"1px solid #808080", padding:"6px 10px", display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
        <button style={{ ...W.btnSm, color:liked?"#cc0000":"#000", minWidth:"100px", minHeight:"36px" }} onClick={handleLike}>
          {liked?"♥ Meaningful":"♡ Meaningful"}
        </button>
        <button style={{ ...W.btnSm, minHeight:"36px" }} onClick={e=>{e.stopPropagation();onShare(s);}}>📤 Share</button>
        {hasMore&&(
          <button style={{ ...W.btnSm, minHeight:"36px" }} onClick={e=>{e.stopPropagation();setOpen(o=>!o);}}>
            {open?"▲ Less":"▼ More"}
          </button>
        )}
        {(s.tags||[]).length>0&&(
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"2px", width:"100%" }}>
            {(s.tags||[]).map(t=>(
              <button key={t} onClick={e=>{e.stopPropagation();onTagClick(t);}}
                style={{ ...W.btnSm, color:"#000080", fontSize:"12px", padding:"3px 8px", fontFamily:"Courier New,monospace", minHeight:"30px" }}>
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockEditor({ blocks, setBlocks }) {
  const updateText=(i,v)=>setBlocks(bs=>bs.map((b,idx)=>idx===i?{...b,value:v}:b));
  const addTextAfter=(i)=>setBlocks(bs=>{const n=[...bs];n.splice(i+1,0,{type:"text",value:""});return n;});
  const addImageAfter=async(i,file)=>{
    if(!file)return;
    const d=await readFile(file);
    setBlocks(bs=>{const n=[...bs];n.splice(i+1,0,{type:"image",value:d});return n;});
  };
  const removeBlock=(i)=>setBlocks(bs=>bs.length===1?bs:bs.filter((_,idx)=>idx!==i));
  const addGlyph=(i,g)=>setBlocks(bs=>bs.map((b,idx)=>idx===i&&b.type==="text"?{...b,value:b.value+g}:b));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      {blocks.map((block,i)=>(
        <div key={i}>
          {block.type==="text"?(
            <>
              <textarea value={block.value} onChange={e=>updateText(i,e.target.value)}
                placeholder="Write here..." rows={5} style={W.ta} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", margin:"6px 0 4px" }}>
                <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#555", alignSelf:"center", marginRight:"2px" }}>Add:</span>
                {GLYPHS.map(g=>(
                  <button key={g} onClick={()=>addGlyph(i,g)} style={{ ...W.btnSm, minWidth:"unset", padding:"4px 8px", fontSize:"16px", minHeight:"36px" }}>{g}</button>
                ))}
              </div>
            </>
          ):(
            <div style={{ ...W.inset, textAlign:"center" }}>
              <img src={block.value} alt="" style={{ maxWidth:"100%", maxHeight:"240px", objectFit:"contain", border:"2px solid", borderColor:"#808080 #fff #fff #808080" }} />
            </div>
          )}
          <div style={{ display:"flex", gap:"6px", alignItems:"center", padding:"6px 0", borderBottom:"1px dotted #999", marginBottom:"4px", flexWrap:"wrap" }}>
            <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#666" }}>After this:</span>
            <button style={{ ...W.btnSm, minHeight:"36px" }} onClick={()=>addTextAfter(i)}>+ Text</button>
            <label style={{ ...W.btnSm, cursor:"pointer", display:"inline-flex", alignItems:"center", minHeight:"36px" }}>
              + Photo
              <input type="file" accept="image/*" style={{ display:"none" }}
                onChange={async e=>{if(e.target.files[0])await addImageAfter(i,e.target.files[0]);e.target.value="";}} />
            </label>
            {blocks.length>1&&(
              <button style={{ ...W.btnSm, color:"#990000", marginLeft:"auto", minHeight:"36px" }} onClick={()=>removeBlock(i)}>✕ Remove</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("feed");
  const [blocks, setBlocks]     = useState([{type:"text",value:""}]);
  const [handle, setHandle]     = useState("");
  const [anon, setAnon]         = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [sort, setSort]         = useState("newest");
  const [posted, setPosted]     = useState(false);
  const [searchQ, setSearchQ]   = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [shareEntry, setShareEntry] = useState(null);
  const [visitorCount, setVisitorCount] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(()=>THEMES[Math.floor(Math.random()*THEMES.length)]);
  const [gbName, setGbName]     = useState("");
  const [gbMsg, setGbMsg]       = useState("");
  const [gbEntries, setGbEntries] = useState([]);
  const [gbPosted, setGbPosted] = useState(false);
  const todayPrompt = PROMPTS[new Date().getDay()%PROMPTS.length];

  const refreshTheme=()=>{
    setCurrentTheme(prev=>{
      let next;
      do{next=THEMES[Math.floor(Math.random()*THEMES.length)];}while(next===prev&&THEMES.length>1);
      return next;
    });
  };

  // Load entries from Supabase
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("ts", { ascending: false });
      if (error || !data || data.length === 0) {
        // Seed the database with initial entries if empty
        if (!error && data && data.length === 0) {
          await supabase.from("entries").insert(
            SEEDS.map(s => ({ id:s.id, handle:s.handle, anon:s.anon, ts:s.ts, tags:s.tags, blocks:s.blocks, likes:0 }))
          );
          setEntries(SEEDS);
        } else {
          setEntries(SEEDS);
        }
      } else {
        setEntries(data);
      }
      setLoading(false);
    })();
  },[]);

  // Load guestbook
  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.from("guestbook").select("*").order("ts", { ascending:false });
      if (data && data.length > 0) {
        setGbEntries(data);
      } else {
        setGbEntries([{ name:"webmaster_99", msg:"Thank you for visiting. This site is a labour of love. Sign and tell your friends. — est. 1999", ts:"1999-01-01T00:00:00" }]);
      }
    })();
  },[]);

  // Visitor counter
  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.from("visitors").select("count").eq("id",1).single();
      const current = data?.count || 38;
      const next = current + 1;
      await supabase.from("visitors").update({ count: next }).eq("id",1);
      setVisitorCount(next);
    })();
  },[]);

  const submit = async () => {
    const ok = blocks.some(b=>b.type==="image"||(b.type==="text"&&b.value.trim()));
    if (!ok) return;
    const entry = {
      id: uid(),
      handle: anon ? "" : (handle.trim() || ""),
      anon,
      ts: new Date().toISOString(),
      tags: parseTags(tagInput),
      blocks: blocks.filter(b=>b.type==="image"||(b.type==="text"&&b.value.trim())),
      likes: 0
    };
    const { error } = await supabase.from("entries").insert([entry]);
    if (!error) {
      setEntries(prev => [entry, ...prev]);
      setBlocks([{type:"text",value:""}]);
      setTagInput("");
      setPosted(true);
      setTimeout(()=>{ setPosted(false); setTab("feed"); }, 2200);
    }
  };

  const signGuestbook = async () => {
    if (!gbMsg.trim()) return;
    const entry = { name: gbName.trim()||"Anonymous", msg: gbMsg.trim(), ts: new Date().toISOString() };
    const { error } = await supabase.from("guestbook").insert([entry]);
    if (!error) {
      setGbEntries(prev => [entry, ...prev]);
      setGbName(""); setGbMsg(""); setGbPosted(true);
      setTimeout(()=>setGbPosted(false), 3000);
    }
  };

  const allTags = Object.entries(
    entries.flatMap(e=>e.tags||[]).reduce((acc,t)=>{acc[t]=(acc[t]||0)+1;return acc;},{})
  ).sort((a,b)=>b[1]-a[1]);

  const filterTag = (t) => { setActiveTag(t); setTab("feed"); };

  const feed = [...entries]
    .filter(e=>{
      if (activeTag && !(e.tags||[]).includes(activeTag)) return false;
      if (searchQ && !JSON.stringify(e).toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    })
    .sort((a,b)=>sort==="newest" ? new Date(b.ts)-new Date(a.ts) : new Date(a.ts)-new Date(b.ts));

  const hasContent = blocks.some(b=>b.type==="image"||(b.type==="text"&&b.value.trim()));

  const NAV=[
    {id:"feed",icon:"📋",label:"Feed"},
    {id:"submit",icon:"✏️",label:"Write"},
    {id:"hashtags",icon:"#",label:"Tags"},
    {id:"about",icon:"❓",label:"About"},
    {id:"guestbook",icon:"📒",label:"Guestbook"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#c0c0c0", fontFamily:"Arial,sans-serif", paddingBottom:"72px" }}>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#c0c0c0;-webkit-text-size-adjust:100%;}
        input,textarea,select{font-size:16px!important;}
        ::placeholder{color:#999;font-style:italic;}
        textarea:focus,input:focus{outline:1px dotted #000080;}
        ::-webkit-scrollbar{width:8px;background:#c0c0c0;}
        ::-webkit-scrollbar-thumb{background:#808080;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadeIn 0.25s ease;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .blink{animation:blink 1s step-end infinite;}
        button{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
      `}</style>

      {shareEntry&&<ShareSheet entry={shareEntry} onClose={()=>setShareEntry(null)}/>}

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#000080 0%,#0000cd 35%,#1084d0 65%,#000080 100%)", borderBottom:"3px solid #ffff00", padding:"12px 12px 10px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <div style={{ fontFamily:"Arial Black,Arial,sans-serif", fontSize:"clamp(22px,6vw,40px)", fontWeight:900, color:"#fff", textShadow:"2px 2px 0 #000,3px 3px 0 #000040", letterSpacing:"1px", lineHeight:1 }}>
              THE PUBLIC<br/>JOURNAL
            </div>
            <div style={{ marginTop:"6px" }}><UCon/></div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"Arial,sans-serif", fontSize:"10px", color:"#aad4ff", marginBottom:"4px" }}>visitor no.</div>
            {visitorCount!==null&&<Counter n={visitorCount}/>}
            <div style={{ fontFamily:"Arial,sans-serif", fontSize:"10px", color:"#aad4ff", marginTop:"4px" }}>{entries.length} entries</div>
          </div>
        </div>
      </div>

      {/* TICKER */}
      <div style={{ background:"#000080", color:"#ffff00", padding:"3px 0", overflow:"hidden", whiteSpace:"nowrap", borderBottom:"2px solid #ffff00" }}>
        <style>{`@keyframes mq{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
        <span style={{ display:"inline-block", animation:"mq 28s linear infinite", fontFamily:"Arial,sans-serif", fontSize:"12px", fontWeight:"bold", letterSpacing:"1px" }}>
          {`:: THE PUBLIC JOURNAL :: ${entries.length} ENTRIES :: YOUR LIFE IS WORTH READING :: ANONYMOUS OR NAMED :: `.repeat(5)}
        </span>
      </div>

      {/* CONTENT */}
      <div style={{ padding:"10px 10px 0", maxWidth:"600px", margin:"0 auto" }}>

        {/* FEED */}
        {tab==="feed"&&(
          <div className="fadein">
            <div style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
              <input type="search" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                placeholder="Search entries..." style={{ ...W.inp, flex:1 }} />
              {searchQ&&<button style={{ ...W.btnSm, minHeight:"44px" }} onClick={()=>setSearchQ("")}>✕</button>}
            </div>
            <div style={{ display:"flex", gap:"6px", marginBottom:"10px", flexWrap:"wrap" }}>
              {["newest","oldest"].map(s=>(
                <button key={s} onClick={()=>setSort(s)}
                  style={{ ...W.btnSm, background:sort===s?"#000080":"#c0c0c0", color:sort===s?"#fff":"#000", borderColor:sort===s?"#000080 #000040 #000040 #000080":"#fff #808080 #808080 #fff", minHeight:"36px" }}>
                  {s==="newest"?"🕐 Newest":"📅 Oldest"}
                </button>
              ))}
              {activeTag&&(
                <button onClick={()=>setActiveTag(null)}
                  style={{ ...W.btnSm, background:"#000080", color:"#fff", borderColor:"#000080 #000040 #000040 #000080", fontFamily:"Courier New,monospace", minHeight:"36px" }}>
                  #{activeTag} ✕
                </button>
              )}
            </div>
            <Win title="Welcome" icon="🏠">
              <p style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", margin:"0 0 6px", lineHeight:1.75 }}>
                <strong>The Public Journal</strong> — leave a piece of your life on the internet. Anonymous or named. A sentence or a thousand words.
              </p>
              <button style={{ ...W.btn, width:"100%" }} onClick={()=>setTab("submit")}>✏️ Add Your Entry</button>
            </Win>
            <RainbowHR/>
            {loading ? (
              <Win title="Loading..." icon="⏳">
                <p style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", margin:0, fontStyle:"italic", color:"#555" }}>Fetching entries from the database...</p>
              </Win>
            ) : feed.length===0 ? (
              <Win title="No Results" icon="🔍">
                <p style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", margin:0 }}>
                  Nothing found. <button style={W.btnSm} onClick={()=>{setSearchQ("");setActiveTag(null);}}>Clear filters</button>
                </p>
              </Win>
            ) : (
              feed.map((e,i)=><Card key={e.id} s={e} idx={i} onShare={setShareEntry} onTagClick={filterTag}/>)
            )}
          </div>
        )}

        {/* SUBMIT */}
        {tab==="submit"&&(
          <div className="fadein">
            {posted?(
              <Win title="Entry Posted!" icon="✅">
                <div style={{ padding:"12px", textAlign:"center" }}>
                  <div style={{ fontSize:"40px", marginBottom:"10px" }}>✅</div>
                  <p style={{ fontFamily:"Times New Roman,serif", fontSize:"16px", margin:"0 0 8px" }}>Your entry has been added.</p>
                  <p style={{ fontFamily:"Times New Roman,serif", fontSize:"13px", fontStyle:"italic", color:"#555", margin:0, lineHeight:1.7 }}>
                    It takes courage to look at your own life and write it down. We're glad you did.
                  </p>
                </div>
              </Win>
            ):(
              <>
                <Win title="🎲 Theme Finder" icon="🎲">
                  <div style={{ fontFamily:"Arial,sans-serif", fontSize:"12px", color:"#555", marginBottom:"8px" }}>Not sure what to write? Keep rolling until one clicks.</div>
                  <div style={{ ...W.inset, fontFamily:"Times New Roman,serif", fontSize:"15px", fontStyle:"italic", color:"#000080", lineHeight:1.7, textAlign:"center", padding:"12px", marginBottom:"8px" }}>
                    &ldquo;{currentTheme}&rdquo;
                  </div>
                  <div style={{ display:"flex", gap:"6px" }}>
                    <button style={{ ...W.btnSm, flex:1, textAlign:"center", minHeight:"44px", fontSize:"14px" }} onClick={refreshTheme}>🎲 New theme</button>
                    <button style={{ ...W.btn, flex:1, minHeight:"44px", fontSize:"14px", minWidth:"unset" }} onClick={()=>setTab("submit")}>✏️ Write this</button>
                  </div>
                </Win>
                <Win title="💭 Reflect" icon="💭">
                  <div style={{ ...W.inset, fontFamily:"Times New Roman,serif", fontSize:"14px", fontStyle:"italic", color:"#333", lineHeight:1.7 }}>
                    &ldquo;{todayPrompt}&rdquo;
                  </div>
                </Win>
                <Win title="Your Entry" icon="✏️">
                  <div style={{ marginBottom:"12px" }}>
                    <div style={{ fontFamily:"Arial,sans-serif", fontSize:"13px", fontWeight:"bold", marginBottom:"8px" }}>Post as:</div>
                    <div style={{ display:"flex", gap:"12px", marginBottom:"8px" }}>
                      {[["Anonymous",true],["Use a name",false]].map(([l,v])=>(
                        <label key={l} style={{ display:"flex", alignItems:"center", gap:"6px", fontFamily:"Arial,sans-serif", fontSize:"14px", cursor:"pointer", minHeight:"44px" }}>
                          <input type="radio" checked={anon===v} onChange={()=>setAnon(v)} style={{ width:"18px", height:"18px", accentColor:"#000080" }}/>
                          {l}
                        </label>
                      ))}
                    </div>
                    {!anon&&(
                      <input type="text" value={handle} onChange={e=>setHandle(e.target.value)}
                        placeholder="e.g. vera_M or T_Okafor" style={W.inp} />
                    )}
                  </div>
                  <hr style={{ border:"none", borderTop:"1px solid #808080", margin:"10px 0" }}/>
                  <div style={{ fontFamily:"Arial,sans-serif", fontSize:"13px", fontWeight:"bold", marginBottom:"6px" }}>Your story:</div>
                  <BlockEditor blocks={blocks} setBlocks={setBlocks}/>
                  <hr style={{ border:"none", borderTop:"1px solid #808080", margin:"10px 0" }}/>
                  <div style={{ fontFamily:"Arial,sans-serif", fontSize:"13px", fontWeight:"bold", marginBottom:"4px" }}>
                    Hashtags <span style={{ fontWeight:"normal", color:"#555", fontSize:"12px" }}>(comma separated)</span>
                  </div>
                  <input type="text" value={tagInput} onChange={e=>setTagInput(e.target.value)}
                    placeholder="e.g. family, courage, travel" style={{ ...W.inp, marginBottom:"6px" }} />
                  {tagInput&&(
                    <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"6px" }}>
                      {parseTags(tagInput).map(t=>(
                        <span key={t} style={{ fontFamily:"Courier New,monospace", fontSize:"12px", color:"#000080", background:"#e0e8ff", border:"1px solid #aab", padding:"2px 8px" }}>#{t}</span>
                      ))}
                    </div>
                  )}
                  <hr style={{ border:"none", borderTop:"1px solid #808080", margin:"10px 0" }}/>
                  <div style={{ display:"flex", gap:"8px" }}>
                    <button style={{ ...W.btn, flex:2, minHeight:"48px", fontSize:"15px", background:hasContent?"#c0c0c0":"#e0e0e0", color:hasContent?"#000":"#888" }}
                      onClick={submit} disabled={!hasContent}>✅ Post Entry</button>
                    <button style={{ ...W.btn, flex:1, minHeight:"48px", fontSize:"15px" }}
                      onClick={()=>{setBlocks([{type:"text",value:""}]);setTagInput("");}}>🗑️ Clear</button>
                  </div>
                </Win>
              </>
            )}
          </div>
        )}

        {/* HASHTAGS */}
        {tab==="hashtags"&&(
          <div className="fadein">
            <Win title="# Hashtag Directory" icon="#">
              <p style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", margin:"0 0 10px", lineHeight:1.75 }}>
                Tap any hashtag to filter the feed to entries with that tag.
              </p>
              <RainbowHR/>
              {allTags.length===0?(
                <p style={{ fontFamily:"Times New Roman,serif", fontSize:"13px", fontStyle:"italic", color:"#555" }}>No tags yet — add some when you submit an entry.</p>
              ):(
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", padding:"8px 0" }}>
                  {allTags.map(([tag,count])=>(
                    <button key={tag} onClick={()=>filterTag(tag)}
                      style={{ ...W.btnSm, fontFamily:"Courier New,monospace", fontSize:"13px",
                        color:activeTag===tag?"#fff":"#000080",
                        background:activeTag===tag?"#000080":"#c0c0c0",
                        borderColor:activeTag===tag?"#000080 #000040 #000040 #000080":"#fff #808080 #808080 #fff",
                        padding:"6px 12px", minHeight:"36px" }}>
                      #{tag} <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", opacity:0.7 }}>({count})</span>
                    </button>
                  ))}
                </div>
              )}
            </Win>
            {allTags.length>0&&(
              <Win title="Tag Stats" icon="📊">
                <table style={{ borderCollapse:"collapse", width:"100%", fontFamily:"Arial,sans-serif", fontSize:"13px" }}>
                  <thead>
                    <tr style={{ borderBottom:"2px solid #808080" }}>
                      <th style={{ textAlign:"left", padding:"4px 8px 4px 0", color:"#000080" }}>Tag</th>
                      <th style={{ textAlign:"right", padding:"4px 0", color:"#000080" }}>Entries</th>
                      <th style={{ textAlign:"right", padding:"4px 0 4px 8px", color:"#000080" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTags.map(([tag,count])=>(
                      <tr key={tag} style={{ borderBottom:"1px dotted #aaa", cursor:"pointer" }} onClick={()=>filterTag(tag)}>
                        <td style={{ padding:"6px 8px 6px 0", fontFamily:"Courier New,monospace", color:"#000080" }}>#{tag}</td>
                        <td style={{ padding:"6px 0", textAlign:"right", fontWeight:"bold" }}>{count}</td>
                        <td style={{ padding:"6px 0 6px 8px", textAlign:"right", color:"#555" }}>{Math.round(count/entries.length*100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Win>
            )}
          </div>
        )}

        {/* ABOUT */}
        {tab==="about"&&(
          <div className="fadein">
            <Win title="Why Write Your Story?" icon="❓">
              <div style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", lineHeight:1.85, color:"#000" }}>
                <p><strong>Most of us move through life without ever stopping to look at it.</strong> We get busy. We forget. We assume our memories will stay clear. Then years pass.</p>
                <p>Writing about your life, even a few lines, does something to you. It forces honesty. It surfaces things you didn&rsquo;t know you were carrying.</p>
                <div style={{ ...W.inset, background:"#ffffcc", border:"1px solid #cc9900", margin:"12px 0" }}>
                  <strong style={{ fontFamily:"Arial,sans-serif", fontSize:"12px" }}>Did you know?</strong>
                  <p style={{ margin:"6px 0 0", fontSize:"13px" }}>Research consistently shows that expressive writing reduces stress, helps process grief, and strengthens your sense of who you are. Even 15 minutes can make a lasting difference.</p>
                </div>
                <p>You don&rsquo;t need to be a writer. A single memory. A few true sentences. That&rsquo;s enough.</p>
                <p><strong style={{ color:"#000080" }}>The Public Journal exists to hold whatever you give it.</strong></p>
              </div>
              <button style={{ ...W.btn, width:"100%", minHeight:"48px", fontSize:"15px" }} onClick={()=>setTab("submit")}>✏️ Write Something Now</button>
            </Win>
            <Win title="About" icon="📜">
              <table style={{ borderCollapse:"collapse", width:"100%", fontFamily:"Times New Roman,serif", fontSize:"14px" }}>
                <tbody>
                  {[["Established","1999"],["Location","The World Wide Web"],["Purpose","To hold pieces of real lives"],["Algorithm","No such thing here."],["Your data","Yours. Always."],["Anonymity","Supported and respected."]].map(([k,v])=>(
                    <tr key={k} style={{ borderBottom:"1px dotted #ccc" }}>
                      <td style={{ padding:"6px 12px 6px 0", fontWeight:"bold", fontFamily:"Arial,sans-serif", fontSize:"12px", color:"#000080", whiteSpace:"nowrap" }}>{k}:</td>
                      <td style={{ padding:"6px 0" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Win>
          </div>
        )}

        {/* GUESTBOOK */}
        {tab==="guestbook"&&(
          <div className="fadein">
            <Win title="Guestbook" icon="📒">
              <p style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", margin:"0 0 10px", lineHeight:1.75 }}>
                Sign below and let us know you were here.
              </p>
              <RainbowHR/>
              <div style={{ maxHeight:"280px", overflowY:"auto", marginBottom:"10px" }}>
                {gbEntries.map((g,i)=>(
                  <div key={i} style={{ ...W.inset, marginBottom:"8px", lineHeight:1.65 }}>
                    <div style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#666", marginBottom:"3px" }}>
                      <strong style={{ color:"#000080" }}>{g.name}</strong> &mdash; {fmtShort(g.ts)}
                    </div>
                    <div style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", fontStyle:"italic", color:"#333" }}>
                      &ldquo;{g.msg}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
              <RainbowHR/>
              {gbPosted?(
                <div style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", fontStyle:"italic", color:"#006600", padding:"10px 0" }}>
                  ✓ Your message has been added. Thank you for signing.
                </div>
              ):(
                <>
                  <input type="text" value={gbName} onChange={e=>setGbName(e.target.value)}
                    placeholder="Your name (optional)" style={{ ...W.inp, marginBottom:"8px" }} />
                  <textarea value={gbMsg} onChange={e=>setGbMsg(e.target.value)}
                    placeholder="You were here. Say something." rows={3} style={{ ...W.ta, marginBottom:"10px" }} />
                  <div style={{ display:"flex", gap:"8px" }}>
                    <button style={{ ...W.btn, flex:2, minHeight:"48px", fontSize:"15px", background:gbMsg.trim()?"#c0c0c0":"#e0e0e0", color:gbMsg.trim()?"#000":"#888" }}
                      onClick={signGuestbook} disabled={!gbMsg.trim()}>📝 Sign Guestbook</button>
                    <button style={{ ...W.btn, flex:1, minHeight:"48px", fontSize:"15px" }} onClick={()=>setTab("feed")}>← Back</button>
                  </div>
                </>
              )}
            </Win>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ borderTop:"3px solid #ffff00", background:"#000080", color:"#fff", padding:"12px", marginTop:"4px", textAlign:"center" }}>
          <div style={{ fontWeight:"bold", fontSize:"13px", letterSpacing:"2px", marginBottom:"4px" }}>THEPUBLICJOURNAL.NET</div>
          <div style={{ color:"#aad4ff", fontSize:"11px" }}>ANONYMOUS IS VALID &bull; NAMED IS BRAVE &bull; BOTH ARE WELCOME</div>
          <div style={{ color:"#7aafdd", fontSize:"10px", marginTop:"4px" }}>&copy; 1999&ndash;{new Date().getFullYear()} The Public Journal</div>
        </div>

      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#c0c0c0", borderTop:"2px solid", borderColor:"#fff #808080 #808080 #fff", boxShadow:"0 -2px 0 #000", display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{
            flex:1, border:"none", borderRight:"1px solid #808080",
            borderTop: tab===n.id ? "3px solid #000080" : "3px solid transparent",
            background: tab===n.id ? "#fff" : "#c0c0c0",
            padding:"8px 2px 6px", cursor:"pointer", minHeight:"56px",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            gap:"2px", WebkitTapHighlightColor:"transparent"
          }}>
            <span style={{ fontSize:"18px", lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontFamily:"Arial,sans-serif", fontSize:"9px", color:tab===n.id?"#000080":"#444", fontWeight:tab===n.id?"bold":"normal", letterSpacing:"0.3px" }}>
              {n.label}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}
