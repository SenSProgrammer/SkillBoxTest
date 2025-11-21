import ky from "ky"; import { authHeaders } from "./auth"; const api=ky.create({ prefixUrl: import.meta.env.VITE_API_BASE || "http://localhost:8080" });
export const getTree=(slug:string)=>api.get(`api/books/${slug}/tree`).json<any>(); export const getThesis=(slug:string)=>api.get(`api/theses/${slug}`).json<any>();
export const getComments=(id:string)=>api.get(`api/comments/${id}`).json<any>(); export const postComment=(id:string,body:any)=>api.post(`api/comments/${id}`,{json:body}).json<any>();
export const login=(email:string,name?:string)=>api.post(`api/auth/login`,{json:{email,name}}).json<any>();
export const getModQueue=()=>api.get(`api/editor/modqueue/comments`,{headers:authHeaders() as any}).json<any>();
export const moderate=(id:string,action:"APPROVE"|"REJECT")=>api.post(`api/editor/comments/${id}/moderate`,{headers:authHeaders() as any,json:{action}}).json<any>();
export const exportBook=async(fmt:"pdf"|"epub"|"html",scope:any,store?:boolean,title?:string)=>{ const res=await api.post(`api/editor/export${store?"?store=1":""}`,{headers:authHeaders() as any,json:{fmt,scope,title}}); if(fmt==="html") return res.text(); const ct=res.headers.get("content-type")||""; if(ct.includes("json")) return res.json(); return res.blob(); };
export const initTranslations=()=>api.post(`api/editor/translations/init`,{headers:authHeaders() as any}).json<any>();
