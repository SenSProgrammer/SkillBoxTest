import React from "react"; export default function ThesisView({html}:{html?:string}){ return <div dangerouslySetInnerHTML={{__html: html || "<p>Нет данных</p>"}}/> }
