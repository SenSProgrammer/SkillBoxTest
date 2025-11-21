import ky from "ky";
const api = ky.create({ prefixUrl: import.meta.env.VITE_API_BASE || "http://localhost:8080" });
export const getTree = (bookSlug: string) => api.get(`api/books/${bookSlug}/tree`).json<any>();
export const getThesis = (slug: string) => api.get(`api/theses/${slug}`).json<any>();
export const getComments = (thesisId: string) => api.get(`api/comments/${thesisId}`).json<any>();
export const postComment = (thesisId: string, body: any) => api.post(`api/comments/${thesisId}`, { json: body }).json<any>();
