import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const THEME_CATEGORIES = {
  "Serious & Reflective": [
    "fear and love","the last time","something you never said",
    "a door you closed","what home meant","the person you were becoming",
    "a kindness you never forgot","what the city taught you",
    "the version of you nobody knew","distance",
    "what you learned too late","the conversation that changed everything",
    "what nobody knew you were going through","a lesson from someone unexpected",
    "what you found when you weren't looking","a second chance",
    "a promise you kept","a friendship that faded"
  ],
  "Funny & Light": [
    "the most embarrassing thing that turned out fine",
    "a plan that went completely wrong but worked out",
    "something you believed as a kid that was totally wrong",
    "the worst job you ever had","a holiday disaster",
    "the time you were completely out of your depth",
    "something that still makes you laugh years later",
    "a decision you'd make again just to see the chaos",
    "the meal you still think about (for the wrong reasons)",
    "the best accidental thing that ever happened to you"
  ],
  "Milestones": [
    "the best day","a risk that paid off","something you're proud of",
    "a year that surprised you","what you'd tell your younger self",
    "something you built","a moment of pure luck",
    "the trip that changed you","a turning point you didn't see coming",
    "the summer of","where you were at midnight on new year's",
    "the job you'll never forget","a place you miss"
  ],
  "People": [
    "a stranger who changed things","who taught you something without knowing it",
    "someone who believed in you before you did",
    "the friend you think about but lost touch with",
    "a conversation you'll never forget",
    "someone who showed you what kindness looks like",
    "the person who shaped how you see the world"
  ]
};

const ALL_THEMES = Object.values(THEME_CATEGORIES).flat();
const CATEGORY_NAMES = Object.keys(THEME_CATEGORIES);
const GLYPHS = ["★","☆","✦","♥","♡","◆","◇","✿","~","—","•","∞"];

const SEEDS = [
  { id:"s1", handle:"dan_k", anon:false, ts:"2026-04-19T19:32:00", tags:["travel","spontaneous","friendship"], blocks:[{ type:"text", value:"In 2001 I quit my job on a Friday and by Sunday I was on a train to Edinburgh with £40 and a mate who also had no plan. We busked outside a chip shop even though neither of us can really play guitar. Made £11.50. Best weekend of my life. Still friends with that guy. He's my best man in September." }] },
  { id:"s2", handle:"", anon:true, ts:"2026-04-20T11:15:00", tags:["food","family","memory"], blocks:[{ type:"text", value:"My dad made the same pasta every Sunday for 30 years. Never used a recipe. Just threw things in. I used to think it was embarrassing how simple it was.\n\nLast year I finally wrote down what he does, step by step, while watching him. It took four Sundays to get it right.\n\nI make it now. It tastes exactly the same. I don't know why that surprised me." }] },
  { id:"s3", handle:"priya_writes", anon:false, ts:"2026-04-20T08:44:00", tags:["career","courage","change"], blocks:[{ type:"text", value:"I handed in my notice at a job I'd been at for 9 years. Everyone thought I was mad. I thought I was mad.\n\nThat was 15 years ago. I started a bakery with my sister. We have four of them now.\n\nMy old boss came in last month. He ordered a coffee and a croissant and said 'good for you.' I think that was his version of an apology." }] },
  { id:"s4", handle:"T_Okafor", anon:false, ts:"2026-04-21T00:03:00", tags:["hope","letters","turning-point"], blocks:[{ type:"text", value:"Age 22. Completely broke. I wrote a letter to myself to open in ten years. Described the person I wanted to be. Mailed it to my mum's.\n\nI read it last month. Every single thing I wrote down happened. I cried for about an hour.\n\nI don't believe in much. But I believe in that letter." }] },
  { id:"s5", handle:"", anon:true, ts:"2026-04-22T14:20:00", tags:["kindness","strangers","city"], blocks:[{ type:"text", value:"I was having a genuinely awful day. Missed a deadline, got soaked, my phone died. I sat down outside a cafe and a woman I'd never met put a coffee on the table in front of me and said 'you look like you need this' and walked off before I could say thank you.\n\nI think about her a lot. I try to be her sometimes." }] },
  { id:"s6", handle:"marcus_b", anon:false, ts:"2026-04-23T20:05:00", tags:["running","fitness","unexpected"], blocks:[{ type:"text", value:"I started running at 47 because my doctor told me to. I hated every second of the first three months.\n\nI ran a half marathon at 51. Then a full one at 53. Last year I ran across the Lake District for no reason other than I wanted to see if I could.\n\nMy doctor retired. I sent him a photo from the finish line." }] }
];

function fmtShort(iso) {
  const d = new Date(iso);
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${mo[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function uid() { return "e" + Date.now() + Math.random().toString(36).slice(2,5); }
function readFile(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
function parseTags(raw) {
  return raw.split(/[,\s]+/).map(t => t.replace(/^#+/,"").trim().toLowerCase()).filter(Boolean);
}

const W = {
  win:   { background:"#c0c0c0", border:"2px solid", borderColor:"#ffffff #808080 #808080 #ffffff", boxShadow:"2px 2px 0 #000" },
  tbar:  { background:"linear-gradient(to right,#00007f,#0000cd,#1084d0)", color:"#fff", padding:"6px 8px", fontFamily:"Arial,sans-serif", fontSize:"13px", fontWeight:"bold", display:"flex", alignItems:"center", justifyContent:"space-between", userSelect:"none" },
  btn:   { background:"#c0c0c0", border:"2px solid", borderColor:"#ffffff #808080 #808080 #ffffff", padding:"10px 18px", fontFamily:"Arial,sans-serif", fontSize:"14px", cursor:"pointer", color:"#000", minWidth:"80px", WebkitTapHighlightColor:"transparent" },
  btnSm: { background:"#c0c0c0", border:"2px solid", borderColor:"#ffffff #808080 #808080 #ffffff", padding:"6px 12px", fontFamily:"Arial,sans-serif", fontSize:"13px", cursor:"pointer", color:"#000", WebkitTapHighlightColor:"transparent" },
  inp:   { background:"#fff", border:"2px solid", borderColor:"#808080 #fff #fff #808080", padding:"10px", fontFamily:"Times New Roman,serif", fontSize:"16px", width:"100%", boxSizing:"border-box", WebkitAppearance:"none", borderRadius:"0", color:"#000" },
  ta:    { background:"#fff", border:"2px solid", borderColor:"#808080 #fff #fff #808080", padding:"10px", fontFamily:"Times New Roman,serif", fontSize:"16px", width:"100%", boxSizing:"border-box", resize:"vertical", lineHeight:1.7, WebkitAppearance:"none", borderRadius:"0", color:"#000" },
  sel:   { background:"#fff", border:"2px solid", borderColor:"#808080 #fff #fff #808080", padding:"8px 10px", fontFamily:"Arial,sans-serif", fontSize:"14px", width:"100%", boxSizing:"border-box", WebkitAppearance:"none", borderRadius:"0", color:"#000" },
  inset: { background:"#c0c0c0", border:"2px solid", borderColor:"#808080 #fff #fff #808080", padding:"8px 10px" },
};

function RainbowHR() { return <div style={{ height:"4px", background:"linear-gradient(to right,#f00,#f80,#ff0,#0c0,#00f,#80c,#f00)", margin:"8px 0" }} />; }

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
      <div style={W.tbar}><span style={{ fontSize:"13px" }}>{icon} {title}</span></div>
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
  const mailTo = () => { window.open("mailto:?subject=" + encodeURIComponent("Found this on The Public Journal") + "&body=" + encodeURIComponent('"' + text.slice(0,200) + '" — ' + author + "\n\n" + url)); };
  const copyText = () => { navigator.clipboard.writeText(`"${text}" — ${author}\n${url}`).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"flex-end" }} onClick={onClose}>
      <div style={{ ...W.win, width:"100%", borderBottom:"none" }} onClick={e=>e.stopPropagation()}>
        <div style={W.tbar}><span>📤 Share This Entry</span><span onClick={onClose} style={{ cursor:"pointer", fontSize:"16px", padding:"0 4px" }}>✕</span></div>
        <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:"8px" }}>
          <div style={{ ...W.inset, fontSize:"13px", fontFamily:"Times New Roman,serif", fontStyle:"italic", lineHeight:1.6, maxHeight:"70px", overflow:"hidden" }}>"{text.slice(0,100)}{text.length>100?"...":""}" — {author}</div>
          <button style={{ ...W.btn, width:"100%", textAlign:"left", fontSize:"15px" }} onClick={copyLink}>{copied?"✓ Copied!":"🔗 Copy Link"}</button>
          <button style={{ ...W.btn, width:"100%", textAlign:"left", fontSize:"15px" }} onClick={mailTo}>📧 Send by E-Mail</button>
          <button style={{ ...W.btn, width:"100%", textAlign:"left", fontSize:"15px" }} onClick={copyText}>📋 Copy Entry Text</button>
          <button style={{ ...W.btn, width:"100%", textAlign:"center", fontSize:"15px" }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
function generateStoryCard(entry) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  // bg
  ctx.fillStyle = "#c0c0c0"; ctx.fillRect(0,0,1080,1920);

  // outer win95 border
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(40,40,1000,1840);
  ctx.fillStyle = "#808080";
  ctx.fillRect(48,48,992,1832);
  ctx.fillStyle = "#c0c0c0";
  ctx.fillRect(52,52,984,1824);

  // title bar
  const grad = ctx.createLinearGradient(52,52,1036,52);
  grad.addColorStop(0,"#00007f"); grad.addColorStop(0.5,"#0000cd"); grad.addColorStop(1,"#1084d0");
  ctx.fillStyle = grad; ctx.fillRect(52,52,984,110);

  // title bar text
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 52px Arial, sans-serif";
  ctx.fillText("THE PUBLIC JOURNAL", 80, 122);

  // author + date right side
  const author = entry.anon ? "Anonymous" : entry.handle;
  const date = new Date(entry.ts).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  ctx.font = "36px Arial, sans-serif"; ctx.fillStyle = "#aad4ff";
  ctx.textAlign = "right";
  ctx.fillText(author + "  •  " + date, 1020, 122);
  ctx.textAlign = "left";

  // rainbow bar top
  const rb = ["#f00","#f80","#ff0","#0c0","#00f","#80c","#f00"];
  const rw = 984/rb.length;
  rb.forEach((c,i)=>{ctx.fillStyle=c; ctx.fillRect(52+i*rw,162,rw+2,18);});

  // entry text - vertically centred in middle zone
  const text = entry.blocks.filter(b=>b.type==="text").map(b=>b.value).join("\n\n");
  const textAreaTop = 200;
  const textAreaBottom = 1700;
  const textAreaH = textAreaBottom - textAreaTop;

  // first pass — measure how many lines
  ctx.font = "60px 'Times New Roman', Times, serif";
  const mw = 920;
  const lh = 90;
  let lines = [];
  for (const para of text.split("\n\n")) {
    const words = para.split(" "); let line = "";
    for (let w of words) {
      const t = line + w + " ";
      if (ctx.measureText(t).width > mw && line) { lines.push(line.trim()); line = w + " "; }
      else { line = t; }
    }
    if (line.trim()) lines.push(line.trim());
    lines.push("");
  }
  lines = lines.slice(0, Math.floor(textAreaH / lh));
  const totalH = lines.length * lh;
  let y = textAreaTop + (textAreaH - totalH) / 2 + lh;

  // draw open quote
  ctx.fillStyle = "#000080"; ctx.font = "bold 160px 'Times New Roman', Times, serif";
  ctx.fillText("“", 60, y + 60);

  ctx.fillStyle = "#000000"; ctx.font = "60px 'Times New Roman', Times, serif";
  for (const line of lines) {
    if (line === "") { y += lh * 0.6; continue; }
    ctx.fillText(line, 100, y); y += lh;
  }

  // close quote
  ctx.fillStyle = "#000080"; ctx.font = "bold 160px 'Times New Roman', Times, serif";
  ctx.textAlign = "right";
  ctx.fillText("”", 1020, y + 20);
  ctx.textAlign = "left";

  // rainbow bar bottom
  rb.forEach((c,i)=>{ctx.fillStyle=c; ctx.fillRect(52+i*rw,1730,rw+2,18);});

  // footer
  ctx.fillStyle = "#000080"; ctx.fillRect(52,1748,984,124);
  ctx.fillStyle = "#ffff00"; ctx.fillRect(52,1745,984,4);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 46px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("THEPUBLICJOURNAL.ONLINE", 540, 1816);
  ctx.fillStyle = "#aad4ff"; ctx.font = "30px Arial, sans-serif";
  ctx.fillText("Leave your own story — free, anonymous, always", 540, 1858);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}
function Card({ s, idx, onShare, onTagClick, onReply }) {
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState(()=>localStorage.getItem("liked_"+s.id)==="1");
  const [likes, setLikes] = useState(s.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentPosted, setCommentPosted] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const firstText = s.blocks.find(b=>b.type==="text");
  const fullText = firstText ? firstText.value : "";
  const hasMore = s.blocks.length > 1 || fullText.length > 200;
  const preview = hasMore ? fullText.slice(0,200) + "..." : fullText;
  const author = s.anon ? "Anonymous" : s.handle;

  const handleLike = async (e) => {
    e.stopPropagation();
    if (liked) return;
    setLiked(true); setLikes(n=>n+1); localStorage.setItem("liked_"+s.id,"1");
    await supabase.from("entries").update({ likes: likes+1 }).eq("id", s.id);
  };

  const toggle = () => { if (hasMore) setOpen(o=>!o); };

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true); setShowComments(true);
    const { data } = await supabase.from("comments").select("*").eq("entry_id", s.id).order("ts", { ascending:true });
    setComments(data || []); setLoadingComments(false);
  };

  const postComment = async () => {
    if (!commentBody.trim()) return;
    const c = { entry_id: s.id, name: commentName.trim()||"Anonymous", body: commentBody.trim(), ts: new Date().toISOString() };
    const { error } = await supabase.from("comments").insert([c]);
    if (!error) {
      setComments(prev=>[...prev, c]);
      setCommentBody(""); setCommentName("");
      setCommentPosted(true); setTimeout(()=>setCommentPosted(false), 2000);
    }
  };

  return (
    <div style={{ ...W.win, marginBottom:"12px" }}>
      {s.reply_to && (
        <div style={{ background:"#e8e4dc", borderBottom:"1px solid #aaa", padding:"4px 10px", fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#555", fontStyle:"italic" }}>
          ↩ in reply to an entry
        </div>
      )}
      <div onClick={toggle} style={{ ...W.tbar, cursor:hasMore?"pointer":"default", minHeight:"44px" }}>
        <span style={{ display:"flex", alignItems:"center", gap:"8px", flex:1, minWidth:0, overflow:"hidden" }}>
          <span style={{ fontSize:"15px" }}>{open?"📖":"📄"}</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{author}</span>
          <span style={{ fontWeight:"normal", fontSize:"11px", opacity:0.8, whiteSpace:"nowrap" }}>{fmtShort(s.ts)}</span>
        </span>
        {hasMore && <span style={{ fontFamily:"Arial,sans-serif", fontSize:"12px", fontWeight:"normal", whiteSpace:"nowrap", marginLeft:"8px", opacity:0.85 }}>{open?"▲":"▼"}</span>}
      </div>
      <div style={{ background:"#d4d0c8", borderBottom:"1px solid #808080", padding:"4px 10px", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"4px" }}>
        <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#555" }}>
          {s.anon ? <em>anonymous</em> : <strong style={{ color:"#000080" }}>{s.handle}</strong>}
        </span>
        <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#777" }}>{liked?"♥":"♡"} {likes} found this meaningful</span>
      </div>
      <div onClick={toggle} style={{ padding:"12px 10px 8px", cursor:hasMore?"pointer":"default", background:open?"#fff":"#f0efe8" }}>
        <p style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", lineHeight:1.8, color:"#000", margin:0, whiteSpace:"pre-wrap" }}>
          {open ? fullText : preview}
          {hasMore&&!open&&<span style={{ color:"#000080" }}> <u>[more]</u></span>}
        </p>
      </div>
      {open && s.blocks.length > 1 && (
        <div style={{ padding:"4px 10px 10px", background:"#fff", borderTop:"1px dotted #aaa" }}>
          <RainbowHR />
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {s.blocks.slice(1).map((b,i)=>(
              b.type==="image"
                ? <img key={i} src={b.value} alt="" style={{ maxWidth:"100%", border:"2px solid", borderColor:"#808080 #fff #fff #808080" }} />
                : <p key={i} style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", lineHeight:1.8, color:"#000", margin:0, whiteSpace:"pre-wrap" }}>{b.value}</p>
            ))}
          </div>
          <RainbowHR />
        </div>
      )}
      {showComments && (
        <div style={{ background:"#f8f6f0", borderTop:"1px solid #aaa", padding:"10px" }}>
          {loadingComments ? (
            <div style={{ fontFamily:"Arial,sans-serif", fontSize:"12px", color:"#888", fontStyle:"italic" }}>Loading comments...</div>
          ) : (
            <>
              {comments.length === 0 && (
                <div style={{ fontFamily:"Times New Roman,serif", fontSize:"13px", color:"#888", fontStyle:"italic", marginBottom:"10px" }}>No comments yet. Be the first.</div>
              )}
              {comments.map((c,i) => (
                <div key={i} style={{ borderBottom:"1px dotted #ccc", paddingBottom:"8px", marginBottom:"8px" }}>
                  <div style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#666", marginBottom:"3px" }}>
                    <strong style={{ color:"#000080" }}>{c.name}</strong> &mdash; {fmtShort(c.ts)}
                  </div>
                  <div style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", color:"#333", lineHeight:1.6 }}>{c.body}</div>
                </div>
              ))}
              {commentPosted ? (
                <div style={{ fontFamily:"Times New Roman,serif", fontSize:"13px", color:"#006600", fontStyle:"italic" }}>✓ Comment posted.</div>
              ) : (
                <>
                  <input type="text" value={commentName} onChange={e=>setCommentName(e.target.value)}
                    placeholder="Your name (optional)" style={{ ...W.inp, marginBottom:"6px", fontSize:"14px" }} />
                  <textarea value={commentBody} onChange={e=>setCommentBody(e.target.value)}
                    placeholder="Leave a comment..." rows={2} style={{ ...W.ta, marginBottom:"6px", fontSize:"14px" }} />
                  <button style={{ ...W.btnSm, background:commentBody.trim()?"#c0c0c0":"#e0e0e0", color:commentBody.trim()?"#000":"#888" }}
                    onClick={postComment} disabled={!commentBody.trim()}>Post Comment</button>
                </>
              )}
            </>
          )}
        </div>
      )}
      <div style={{ background:"#d4d0c8", borderTop:"1px solid #808080", padding:"6px 10px", display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
        <button style={{ ...W.btnSm, color:liked?"#cc0000":"#000", minWidth:"100px", minHeight:"36px" }} onClick={handleLike}>{liked?"♥ Meaningful":"♡ Meaningful"}</button>
        <button style={{ ...W.btnSm, minHeight:"36px" }} onClick={e=>{e.stopPropagation();loadComments();}}>💬 {showComments?"Hide":"Comments"}</button>
        <button style={{ ...W.btnSm, minHeight:"36px" }} onClick={e=>{e.stopPropagation();onReply(s);}}>↩ Reply</button>
        <button style={{ ...W.btnSm, minHeight:"36px" }} onClick={e=>{e.stopPropagation();onShare(s);}}>📤 Share</button>
        <button style={{ ...W.btnSm, minHeight:"36px" }} onClick={e=>{e.stopPropagation();const img=generateStoryCard(s);const a=document.createElement('a');a.href=img;a.download='tpj-story.png';a.click();}}>📸 Story</button>
        {hasMore&&(<button style={{ ...W.btnSm, minHeight:"36px" }} onClick={e=>{e.stopPropagation();setOpen(o=>!o);}}>{open?"▲ Less":"▼ More"}</button>)}
        {(s.tags||[]).length>0&&(
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"2px", width:"100%" }}>
            {(s.tags||[]).map(t=>(
              <button key={t} onClick={e=>{e.stopPropagation();onTagClick(t);}}
                style={{ ...W.btnSm, color:"#000080", fontSize:"12px", padding:"3px 8px", fontFamily:"Courier New,monospace", minHeight:"30px" }}>#{t}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockEditor({ blocks, setBlocks }) {
  const updateText=(i,v)=>setBlocks(bs=>bs.map((b,idx)=>idx===i?{...b,value:v}:b));
  const addImageAfter=async(i,file)=>{ if(!file)return; const d=await readFile(file); setBlocks(bs=>{const n=[...bs];n.splice(i+1,0,{type:"image",value:d});return n;}); };
  const removeBlock=(i)=>setBlocks(bs=>bs.length===1?bs:bs.filter((_,idx)=>idx!==i));
  const addGlyph=(i,g)=>setBlocks(bs=>bs.map((b,idx)=>idx===i&&b.type==="text"?{...b,value:b.value+g}:b));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      {blocks.map((block,i)=>(
        <div key={i}>
          {block.type==="text"?(
            <>
              <textarea value={block.value} onChange={e=>updateText(i,e.target.value)} placeholder="Write here..." rows={5} style={W.ta} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", margin:"6px 0 4px" }}>
                <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#555", alignSelf:"center", marginRight:"2px" }}>Add:</span>
                {GLYPHS.map(g=>(<button key={g} onClick={()=>addGlyph(i,g)} style={{ ...W.btnSm, minWidth:"unset", padding:"4px 8px", fontSize:"16px", minHeight:"36px" }}>{g}</button>))}
              </div>
            </>
          ):(
            <div style={{ ...W.inset, textAlign:"center" }}>
              <img src={block.value} alt="" style={{ maxWidth:"100%", maxHeight:"240px", objectFit:"contain", border:"2px solid", borderColor:"#808080 #fff #fff #808080" }} />
            </div>
          )}
          <div style={{ display:"flex", gap:"6px", alignItems:"center", padding:"6px 0", borderBottom:"1px dotted #999", marginBottom:"4px", flexWrap:"wrap" }}>
            <label style={{ ...W.btnSm, cursor:"pointer", display:"inline-flex", alignItems:"center", minHeight:"36px" }}>
              + Add Photo
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={async e=>{if(e.target.files[0])await addImageAfter(i,e.target.files[0]);e.target.value="";}} />
            </label>
            {blocks.length>1&&(<button style={{ ...W.btnSm, color:"#990000", marginLeft:"auto", minHeight:"36px" }} onClick={()=>removeBlock(i)}>✕ Remove</button>)}
          </div>
        </div>
      ))}
    </div>
  );
}export default function App() {
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
  const [replyTo, setReplyTo]   = useState(null);
  const [visitorCount, setVisitorCount] = useState(null);
  const [themeCategory, setThemeCategory] = useState("Serious & Reflective");
  const [currentTheme, setCurrentTheme] = useState(()=>THEME_CATEGORIES["Serious & Reflective"][0]);
  const [gbName, setGbName]     = useState("");
  const [gbMsg, setGbMsg]       = useState("");
  const [gbEntries, setGbEntries] = useState([]);
  const [gbPosted, setGbPosted] = useState(false);

  const handleCategoryChange = (cat) => {
    setThemeCategory(cat);
    const pool = THEME_CATEGORIES[cat];
    setCurrentTheme(pool[Math.floor(Math.random()*pool.length)]);
  };

  const refreshTheme = () => {
    const pool = THEME_CATEGORIES[themeCategory];
    setCurrentTheme(prev=>{ let next; do{next=pool[Math.floor(Math.random()*pool.length)];}while(next===prev&&pool.length>1); return next; });
  };

  const useTheme = () => {
    setBlocks([{type:"text", value:`Writing about: "${currentTheme}"\n\n`}]);
    setTab("submit");
  };

  const handleReply = (entry) => {
    const author = entry.anon ? "Anonymous" : entry.handle;
    const preview = entry.blocks.find(b=>b.type==="text")?.value?.slice(0,80) || "";
    setReplyTo(entry.id);
    setBlocks([{type:"text", value:`↩ Replying to ${author}: "${preview}..."\n\n`}]);
    setTab("submit");
  };

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const { data, error } = await supabase.from("entries").select("*").order("ts", { ascending:false });
      if (error || !data || data.length===0) {
        if (!error && data && data.length===0) {
          await supabase.from("entries").insert(SEEDS.map(s=>({ id:s.id, handle:s.handle, anon:s.anon, ts:s.ts, tags:s.tags, blocks:s.blocks, likes:0 })));
          setEntries(SEEDS);
        } else { setEntries(SEEDS); }
      } else { setEntries(data); }
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.from("guestbook").select("*").order("ts",{ascending:false});
      if (data && data.length>0) { setGbEntries(data); }
      else { setGbEntries([]); }
    })();
  },[]);

  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.from("visitors").select("count").eq("id",1).single();
      const current = data?.count || 38;
      const next = current+1;
      await supabase.from("visitors").update({count:next}).eq("id",1);
      setVisitorCount(next);
    })();
  },[]);

  const submit = async () => {
    const ok = blocks.some(b=>b.type==="image"||(b.type==="text"&&b.value.trim()));
    if (!ok) return;
    const entry = {
      id:uid(), handle:anon?"":(handle.trim()||""), anon,
      ts:new Date().toISOString(), tags:parseTags(tagInput),
      blocks:blocks.filter(b=>b.type==="image"||(b.type==="text"&&b.value.trim())),
      likes:0, reply_to: replyTo || null
    };
    const { error } = await supabase.from("entries").insert([entry]);
    if (!error) {
      setEntries(prev=>[entry,...prev]);
      setBlocks([{type:"text",value:""}]); setTagInput(""); setReplyTo(null);
      setPosted(true);
      setTimeout(()=>{ setPosted(false); setTab("feed"); }, 2200);
    }
  };

  const signGuestbook = async () => {
    if (!gbMsg.trim()) return;
    const entry = {name:gbName.trim()||"Anonymous",msg:gbMsg.trim(),ts:new Date().toISOString()};
    const { error } = await supabase.from("guestbook").insert([entry]);
    if (!error) { setGbEntries(prev=>[entry,...prev]); setGbName(""); setGbMsg(""); setGbPosted(true); setTimeout(()=>setGbPosted(false),3000); }
  };

  const allTags = Object.entries(entries.flatMap(e=>e.tags||[]).reduce((acc,t)=>{acc[t]=(acc[t]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]);
  const filterTag = (t) => { setActiveTag(t); setTab("feed"); };
  const feed = [...entries].filter(e=>{ if(activeTag&&!(e.tags||[]).includes(activeTag))return false; if(searchQ&&!JSON.stringify(e).toLowerCase().includes(searchQ.toLowerCase()))return false; return true; }).sort((a,b)=>sort==="newest"?new Date(b.ts)-new Date(a.ts):new Date(a.ts)-new Date(b.ts));
  const hasContent = blocks.some(b=>b.type==="image"||(b.type==="text"&&b.value.trim()));
  const NAV=[{id:"feed",icon:"📋",label:"Feed"},{id:"submit",icon:"✏️",label:"Write"},{id:"hashtags",icon:"#",label:"Tags"},{id:"about",icon:"❓",label:"About"},{id:"guestbook",icon:"📒",label:"Guestbook"}];

  return (
    <div style={{ minHeight:"100vh", background:"#c0c0c0", fontFamily:"Arial,sans-serif", paddingBottom:"72px" }}>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#c0c0c0;-webkit-text-size-adjust:100%;}
        input,textarea,select{font-size:16px!important;color:#000!important;}
        ::placeholder{color:#999;font-style:italic;}
        textarea:focus,input:focus,select:focus{outline:1px dotted #000080;}
        ::-webkit-scrollbar{width:8px;background:#c0c0c0;}
        ::-webkit-scrollbar-thumb{background:#808080;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadeIn 0.25s ease;}
        button{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}p{color:#000;}p{color:#000;}
      `}</style>

      {shareEntry&&<ShareSheet entry={shareEntry} onClose={()=>setShareEntry(null)}/>}
      <DonatePopup/>

      <div style={{ background:"linear-gradient(135deg,#000080 0%,#0000cd 35%,#1084d0 65%,#000080 100%)", borderBottom:"3px solid #ffff00", padding:"12px 12px 10px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <div style={{ fontFamily:"Arial Black,Arial,sans-serif", fontSize:"clamp(22px,6vw,40px)", fontWeight:900, color:"#fff", textShadow:"2px 2px 0 #000,3px 3px 0 #000040", letterSpacing:"1px", lineHeight:1 }}>THE PUBLIC<br/>JOURNAL</div>
            <div style={{ marginTop:"6px" }}><UCon/></div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"Arial,sans-serif", fontSize:"10px", color:"#aad4ff", marginBottom:"4px" }}>visitor no.</div>
            {visitorCount!==null&&<Counter n={visitorCount}/>}
            <div style={{ fontFamily:"Arial,sans-serif", fontSize:"10px", color:"#aad4ff", marginTop:"4px" }}>{entries.length} entries</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"10px 10px 0", maxWidth:"600px", margin:"0 auto" }}>

        {tab==="feed"&&(
          <div className="fadein">
            <div style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
              <input type="search" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search entries..." style={{ ...W.inp, flex:1 }} />
              {searchQ&&<button style={{ ...W.btnSm, minHeight:"44px" }} onClick={()=>setSearchQ("")}>✕</button>}
            </div>
            <div style={{ display:"flex", gap:"6px", marginBottom:"10px", flexWrap:"wrap" }}>
              {["newest","oldest"].map(s=>(<button key={s} onClick={()=>setSort(s)} style={{ ...W.btnSm, background:sort===s?"#000080":"#c0c0c0", color:sort===s?"#fff":"#000", borderColor:sort===s?"#000080 #000040 #000040 #000080":"#fff #808080 #808080 #fff", minHeight:"36px" }}>{s==="newest"?"🕐 Newest":"📅 Oldest"}</button>))}
              {activeTag&&(<button onClick={()=>setActiveTag(null)} style={{ ...W.btnSm, background:"#000080", color:"#fff", borderColor:"#000080 #000040 #000040 #000080", fontFamily:"Courier New,monospace", minHeight:"36px" }}>#{activeTag} ✕</button>)}
            </div>
            <Win title="Welcome" icon="🏠">
              <p style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", margin:"0 0 6px", lineHeight:1.75 }}><strong>The Public Journal</strong> — leave a piece of your life on the internet. Anonymous or named. A sentence or a thousand words.</p>
              <button style={{ ...W.btn, width:"100%" }} onClick={()=>setTab("submit")}>✏️ Add Your Entry</button>
            </Win>
            <RainbowHR/>
            {loading ? (
              <Win title="Loading..." icon="⏳"><p style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", margin:0, fontStyle:"italic", color:"#555" }}>Fetching entries...</p></Win>
            ) : feed.length===0 ? (
              <Win title="No Results" icon="🔍"><p style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", margin:0 }}>Nothing found. <button style={W.btnSm} onClick={()=>{setSearchQ("");setActiveTag(null);}}>Clear filters</button></p></Win>
            ) : (
              feed.map((e,i)=><Card key={e.id} s={e} idx={i} onShare={setShareEntry} onTagClick={filterTag} onReply={handleReply}/>)
            )}
          </div>
        )}{tab==="submit"&&(
          <div className="fadein">
            {posted?(
              <Win title="Entry Posted!" icon="✅">
                <div style={{ padding:"12px", textAlign:"center" }}>
                  <div style={{ fontSize:"40px", marginBottom:"10px" }}>✅</div>
                  <p style={{ fontFamily:"Times New Roman,serif", fontSize:"16px", margin:"0 0 8px" }}>Your entry has been added.</p>
                  <p style={{ fontFamily:"Times New Roman,serif", fontSize:"13px", fontStyle:"italic", color:"#555", margin:0, lineHeight:1.7 }}>It takes courage to look at your own life and write it down. We're glad you did.</p>
                </div>
              </Win>
            ):(
              <>
                {replyTo && (
                  <div style={{ ...W.inset, background:"#e8e4dc", marginBottom:"8px", fontFamily:"Arial,sans-serif", fontSize:"12px", color:"#555", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>↩ Replying to an entry</span>
                    <button style={{ ...W.btnSm, fontSize:"11px", padding:"2px 8px" }} onClick={()=>{setReplyTo(null);setBlocks([{type:"text",value:""}]);}}>✕ Cancel reply</button>
                  </div>
                )}
                <Win title="🎲 Theme Finder" icon="🎲">
                  <div style={{ fontFamily:"Arial,sans-serif", fontSize:"12px", color:"#555", marginBottom:"8px" }}>Not sure what to write? Pick a mood, keep rolling until one clicks.</div>
                  <div style={{ marginBottom:"8px" }}>
                    <label style={{ fontFamily:"Arial,sans-serif", fontSize:"12px", color:"#333", display:"block", marginBottom:"4px" }}>Mood:</label>
                    <select value={themeCategory} onChange={e=>handleCategoryChange(e.target.value)} style={W.sel}>
                      {CATEGORY_NAMES.map(c=>(<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  <div style={{ ...W.inset, fontFamily:"Times New Roman,serif", fontSize:"15px", fontStyle:"italic", color:"#000080", lineHeight:1.7, textAlign:"center", padding:"12px", marginBottom:"8px" }}>&ldquo;{currentTheme}&rdquo;</div>
                  <div style={{ display:"flex", gap:"6px" }}>
                    <button style={{ ...W.btnSm, flex:1, textAlign:"center", minHeight:"44px", fontSize:"14px" }} onClick={refreshTheme}>🎲 New theme</button>
                    <button style={{ ...W.btn, flex:1, minHeight:"44px", fontSize:"14px", minWidth:"unset" }} onClick={useTheme}>✏️ Write this</button>
                  </div>
                </Win>
                <Win title="Your Entry" icon="✏️">
                  <div style={{ marginBottom:"12px" }}>
                    <div style={{ fontFamily:"Arial,sans-serif", fontSize:"13px", fontWeight:"bold", marginBottom:"8px" }}>Post as:</div>
                    <div style={{ display:"flex", gap:"12px", marginBottom:"8px" }}>
                      {[["Anonymous",true],["Use a name",false]].map(([l,v])=>(
                        <label key={l} style={{ display:"flex", alignItems:"center", gap:"6px", fontFamily:"Arial,sans-serif", fontSize:"14px", cursor:"pointer", minHeight:"44px", color:"#000" }}>
                          <input type="radio" checked={anon===v} onChange={()=>setAnon(v)} style={{ width:"18px", height:"18px", accentColor:"#000080" }}/>{l}
                        </label>
                      ))}
                    </div>
                    {!anon&&(<input type="text" value={handle} onChange={e=>setHandle(e.target.value)} placeholder="e.g. vera_M or T_Okafor" style={W.inp} />)}
                  </div>
                  <hr style={{ border:"none", borderTop:"1px solid #808080", margin:"10px 0" }}/>
                  <div style={{ fontFamily:"Arial,sans-serif", fontSize:"13px", fontWeight:"bold", marginBottom:"6px", color:"#000" }}>Your story:</div>
                  <BlockEditor blocks={blocks} setBlocks={setBlocks}/>
                  <hr style={{ border:"none", borderTop:"1px solid #808080", margin:"10px 0" }}/>
                  <div style={{ fontFamily:"Arial,sans-serif", fontSize:"13px", fontWeight:"bold", marginBottom:"4px", color:"#000" }}>
                    Hashtags <span style={{ fontWeight:"normal", color:"#555", fontSize:"12px" }}>(comma separated)</span>
                  </div>
                  <input type="text" value={tagInput} onChange={e=>setTagInput(e.target.value)} placeholder="e.g. family, courage, travel" style={{ ...W.inp, marginBottom:"6px" }} />
                  {tagInput&&(
                    <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"6px" }}>
                      {parseTags(tagInput).map(t=>(<span key={t} style={{ fontFamily:"Courier New,monospace", fontSize:"12px", color:"#000080", background:"#e0e8ff", border:"1px solid #aab", padding:"2px 8px" }}>#{t}</span>))}
                    </div>
                  )}
                  <hr style={{ border:"none", borderTop:"1px solid #808080", margin:"10px 0" }}/>
                  <div style={{ display:"flex", gap:"8px" }}>
                    <button style={{ ...W.btn, flex:2, minHeight:"48px", fontSize:"15px", background:hasContent?"#c0c0c0":"#e0e0e0", color:hasContent?"#000":"#888" }} onClick={submit} disabled={!hasContent}>✅ Post Entry</button>
                    <button style={{ ...W.btn, flex:1, minHeight:"48px", fontSize:"15px" }} onClick={()=>{setBlocks([{type:"text",value:""}]);setTagInput("");}}>🗑️ Clear</button>
                  </div>
                </Win>
              </>
            )}
          </div>
        )}

        {tab==="hashtags"&&(
          <div className="fadein">
            <Win title="# Hashtag Directory" icon="#">
              <p style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", margin:"0 0 10px", lineHeight:1.75 }}>Tap any hashtag to filter the feed.</p>
              <RainbowHR/>
              {allTags.length===0?(
                <p style={{ fontFamily:"Times New Roman,serif", fontSize:"13px", fontStyle:"italic", color:"#555" }}>No tags yet.</p>
              ):(
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", padding:"8px 0" }}>
                  {allTags.map(([tag,count])=>(<button key={tag} onClick={()=>filterTag(tag)} style={{ ...W.btnSm, fontFamily:"Courier New,monospace", fontSize:"13px", color:activeTag===tag?"#fff":"#000080", background:activeTag===tag?"#000080":"#c0c0c0", borderColor:activeTag===tag?"#000080 #000040 #000040 #000080":"#fff #808080 #808080 #fff", padding:"6px 12px", minHeight:"36px" }}>#{tag} <span style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", opacity:0.7 }}>({count})</span></button>))}
                </div>
              )}
            </Win>
            {allTags.length>0&&(
              <Win title="Tag Stats" icon="📊">
                <table style={{ borderCollapse:"collapse", width:"100%", fontFamily:"Arial,sans-serif", fontSize:"13px" }}>
                  <thead><tr style={{ borderBottom:"2px solid #808080" }}><th style={{ textAlign:"left", padding:"4px 8px 4px 0", color:"#000080" }}>Tag</th><th style={{ textAlign:"right", padding:"4px 0", color:"#000080" }}>Entries</th><th style={{ textAlign:"right", padding:"4px 0 4px 8px", color:"#000080" }}>%</th></tr></thead>
                  <tbody>
                    {allTags.map(([tag,count])=>(<tr key={tag} style={{ borderBottom:"1px dotted #aaa", cursor:"pointer" }} onClick={()=>filterTag(tag)}><td style={{ padding:"6px 8px 6px 0", fontFamily:"Courier New,monospace", color:"#000080" }}>#{tag}</td><td style={{ padding:"6px 0", textAlign:"right", fontWeight:"bold", color:"#000" }}>{count}</td><td style={{ padding:"6px 0 6px 8px", textAlign:"right", color:"#555" }}>{Math.round(count/entries.length*100)}%</td></tr>))}
                  </tbody>
                </table>
              </Win>
            )}
          </div>
        )}

        {tab==="about"&&(
          <div className="fadein">
            <Win title="Why Write Publicly?" icon="❓">
              <div style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", lineHeight:1.85, color:"#000" }}>
                <p><strong>A private journal is powerful. A public one is something else entirely.</strong></p>
                <p>When you write knowing someone might read it, something shifts. You get more honest, not less. You stop performing and start saying the thing you actually mean.</p>
                <p>And when a stranger reads your story and thinks <em>&ldquo;that happened to me too&rdquo;</em> — that&rsquo;s a connection that wouldn&rsquo;t exist any other way.</p>
                <div style={{ ...W.inset, background:"#ffffcc", border:"1px solid #cc9900", margin:"12px 0" }}>
                  <strong style={{ fontFamily:"Arial,sans-serif", fontSize:"12px" }}>Why anonymous works:</strong>
                  <p style={{ margin:"6px 0 0", fontSize:"13px" }}>You don&rsquo;t need your name on it. Some of the most powerful things ever written were left unsigned. What matters is that it&rsquo;s true — not who said it.</p>
                </div>
                <p>You don&rsquo;t need to be a writer. One memory. A few honest sentences. Leave it here and move on.</p>
                <p><strong style={{ color:"#000080" }}>The Public Journal exists to hold whatever you give it.</strong></p>
              </div>
              <button style={{ ...W.btn, width:"100%", minHeight:"48px", fontSize:"15px" }} onClick={()=>setTab("submit")}>✏️ Write Something Now</button>
            </Win>
            <Win title="About" icon="📜">
              <table style={{ borderCollapse:"collapse", width:"100%", fontFamily:"Times New Roman,serif", fontSize:"14px" }}>
                <tbody>
                  {[["Purpose","To hold pieces of real lives"],["Algorithm","No such thing here."],["Your data","Yours. Always."],["Anonymity","Supported and respected."]].map(([k,v])=>(
                    <tr key={k} style={{ borderBottom:"1px dotted #ccc" }}>
                      <td style={{ padding:"6px 12px 6px 0", fontWeight:"bold", fontFamily:"Arial,sans-serif", fontSize:"12px", color:"#000080", whiteSpace:"nowrap" }}>{k}:</td>
                      <td style={{ padding:"6px 0", color:"#000" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Win>
          </div>
        )}

        {tab==="guestbook"&&(
          <div className="fadein">
            <Win title="Guestbook" icon="📒">
              <p style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", margin:"0 0 10px", lineHeight:1.75, color:"#000" }}>Sign below and let us know you were here.</p>
              <RainbowHR/>
              <div style={{ maxHeight:"280px", overflowY:"auto", marginBottom:"10px" }}>
                {gbEntries.map((g,i)=>(
                  <div key={i} style={{ ...W.inset, marginBottom:"8px", lineHeight:1.65 }}>
                    <div style={{ fontFamily:"Arial,sans-serif", fontSize:"11px", color:"#666", marginBottom:"3px" }}><strong style={{ color:"#000080" }}>{g.name}</strong> &mdash; {fmtShort(g.ts)}</div>
                    <div style={{ fontFamily:"Times New Roman,serif", fontSize:"14px", fontStyle:"italic", color:"#333" }}>&ldquo;{g.msg}&rdquo;</div>
                  </div>
                ))}
              </div>
              <RainbowHR/>
              {gbPosted?(
                <div style={{ fontFamily:"Times New Roman,serif", fontSize:"15px", fontStyle:"italic", color:"#006600", padding:"10px 0" }}>✓ Your message has been added. Thank you for signing.</div>
              ):(
                <>
                  <input type="text" value={gbName} onChange={e=>setGbName(e.target.value)} placeholder="Your name (optional)" style={{ ...W.inp, marginBottom:"8px" }} />
                  <textarea value={gbMsg} onChange={e=>setGbMsg(e.target.value)} placeholder="You were here. Say something." rows={3} style={{ ...W.ta, marginBottom:"10px" }} />
                  <div style={{ display:"flex", gap:"8px" }}>
                    <button style={{ ...W.btn, flex:2, minHeight:"48px", fontSize:"15px", background:gbMsg.trim()?"#c0c0c0":"#e0e0e0", color:gbMsg.trim()?"#000":"#888" }} onClick={signGuestbook} disabled={!gbMsg.trim()}>📝 Sign Guestbook</button>
                    <button style={{ ...W.btn, flex:1, minHeight:"48px", fontSize:"15px" }} onClick={()=>setTab("feed")}>← Back</button>
                  </div>
                </>
              )}
            </Win>
          </div>
        )}

        <div style={{ borderTop:"3px solid #ffff00", background:"#000080", color:"#fff", padding:"12px", marginTop:"4px", textAlign:"center" }}>
          <div style={{ fontWeight:"bold", fontSize:"13px", letterSpacing:"2px", marginBottom:"4px" }}>THEPUBLICJOURNAL.ONLINE</div>
          <div style={{ color:"#aad4ff", fontSize:"11px" }}>ANONYMOUS IS VALID &bull; NAMED IS BRAVE &bull; BOTH ARE WELCOME</div>
          <div style={{ color:"#7aafdd", fontSize:"10px", marginTop:"4px" }}>&copy; {new Date().getFullYear()} The Public Journal</div>
        </div>

      </div>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#c0c0c0", borderTop:"2px solid", borderColor:"#fff #808080 #808080 #fff", boxShadow:"0 -2px 0 #000", display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{ flex:1, border:"none", borderRight:"1px solid #808080", borderTop:tab===n.id?"3px solid #000080":"3px solid transparent", background:tab===n.id?"#fff":"#c0c0c0", padding:"8px 2px 6px", cursor:"pointer", minHeight:"56px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2px", WebkitTapHighlightColor:"transparent" }}>
            <span style={{ fontSize:"18px", lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontFamily:"Arial,sans-serif", fontSize:"9px", color:tab===n.id?"#000080":"#444", fontWeight:tab===n.id?"bold":"normal", letterSpacing:"0.3px" }}>{n.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}function DonatePopup() {
  const [show, setShow] = useState(()=>!sessionStorage.getItem("donate_seen"));
  if (!show) return null;
  const close = () => { sessionStorage.setItem("donate_seen","1"); setShow(false); };
  return (
    <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }} onClick={close}>
      <div style={{ background:"#c0c0c0",border:"2px solid",borderColor:"#fff #808080 #808080 #fff",boxShadow:"2px 2px 0 #000",maxWidth:"340px",width:"100%" }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:"linear-gradient(to right,#00007f,#0000cd,#1084d0)",color:"#fff",padding:"6px 8px",fontFamily:"Arial,sans-serif",fontSize:"13px",fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span>☕ Support The Public Journal</span>
          <span onClick={close} style={{ cursor:"pointer",fontSize:"16px",padding:"0 4px" }}>✕</span>
        </div>
        <div style={{ padding:"16px" }}>
          <p style={{ fontFamily:"Times New Roman,serif",fontSize:"15px",lineHeight:1.8,color:"#000",margin:"0 0 16px" }}>The Public Journal is free, ad-free, and always will be. If you've read something here that stayed with you, or left a story of your own, a coffee keeps the lights on. Thank you.</p>
          <a href="https://buymeacoffee.com/theonlinejournal" target="_blank" rel="noreferrer" style={{ display:"block",textDecoration:"none" }}>
            <button style={{ background:"#FFDD00",border:"2px solid",borderColor:"#cca800 #665400 #665400 #cca800",padding:"10px 18px",fontFamily:"Arial,sans-serif",fontSize:"15px",cursor:"pointer",color:"#000",width:"100%",minHeight:"48px" }}>☕ Buy me a coffee</button>
          </a>
          <button style={{ background:"#c0c0c0",border:"2px solid",borderColor:"#fff #808080 #808080 #fff",padding:"10px 18px",fontFamily:"Arial,sans-serif",fontSize:"14px",cursor:"pointer",color:"#000",width:"100%",minHeight:"44px",marginTop:"8px" }} onClick={close}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}
