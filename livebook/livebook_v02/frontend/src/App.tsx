import React, { useEffect, useState } from "react";
import { getTree, getThesis, getComments, postComment } from "./api";
import Tree from "./components/Tree";
import ThesisView from "./components/ThesisView";
import CommentForm from "./components/CommentForm";

export default function App() {
  const [tree, setTree] = useState<any[]>([]);
  const [thesis, setThesis] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => { getTree("consciology").then((d) => setTree(d.tree)); }, []);

  const loadThesis = async (slug: string) => {
    const t = await getThesis(slug); setThesis(t);
    const c = await getComments(t.id); setComments(c);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 320px", gap: 16, padding: 16 }}>
      <aside><h3>Тезисы</h3><Tree nodes={tree} onSelect={loadThesis} /></aside>
      <main><h3>{thesis?.slug || "Выберите тезис"}</h3><ThesisView html={thesis?.textHtml} /></main>
      <aside>
        <h3>Комментарии</h3>
        <ul>
          {comments.map((c) => (<li key={c.id}><div>{c.textMd}</div></li>))}
        </ul>
        {thesis && (
          <CommentForm onSubmit={async (text) => {
            await postComment(thesis.id, { textMd: text, authorId: "demo-user" });
            const c = await getComments(thesis.id); setComments(c);
          }} />
        )}
      </aside>
    </div>
  );
}
