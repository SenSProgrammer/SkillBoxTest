import React,{useEffect,useState} from "react"; import { getTree,getThesis,getComments,postComment,login } from "./api";
import Tree from "./components/Tree"; import ThesisView from "./components/ThesisView"; import CommentForm from "./components/CommentForm"; import EditorPanel from "./components/EditorPanel"; import OauthSuccess from "./OauthSuccess"; import OAuthLinks from "./api_oauth_links"; import { saveToken } from "./auth";
export default function App(){ if(location.pathname==="/oauth-success") return <OauthSuccess/>;
const [tree,setTree]=useState<any[]>([]); const [thesis,setThesis]=useState<any>(null); const [comments,setComments]=useState<any[]>([]); const [user,setUser]=useState<any>(null); const [email,setEmail]=useState("");
useEffect(()=>{ getTree("consciology").then(d=>setTree(d.tree)); },[]);
const loadThesis=async(slug:string)=>{ const t=await getThesis(slug); setThesis(t); const c=await getComments(t.id); setComments(c); };
return (<div style={{display:"grid",gridTemplateColumns:"240px 1fr 360px 360px",gap:16,padding:16}}>
  <aside><h3>Тезисы</h3><Tree nodes={tree} onSelect={loadThesis}/></aside>
  <main><h3>{thesis?.slug||"Выберите тезис"}</h3><ThesisView html={thesis?.textHtml}/></main>
  <aside><h3>Комментарии</h3><ul>{comments.map((c:any)=>(<li key={c.id}><div>{c.textMd}</div></li>))}</ul>
    {thesis&&(<CommentForm onSubmit={async(text)=>{await postComment(thesis.id,{textMd:text,authorId:"demo-user"}); const c=await getComments(thesis.id); setComments(c);}}/>)}
  </aside>
  <aside><h3>Вход</h3>
    {user? (<div>В системе: {user.email} ({user.role})</div>) : (<><form onSubmit={async(e)=>{e.preventDefault(); const r=await login(email); saveToken(r.token); setUser(r.user);}}>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)}/><button type="submit">Войти (dev)</button></form><OAuthLinks/></>)}
    {(user?.role==='EDITOR'||user?.role==='ADMIN')&&(<EditorPanel/>)} 
  </aside>
</div>); }
