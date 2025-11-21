import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const endpoint=process.env.S3_ENDPOINT, region=process.env.S3_REGION||"us-east-1", bucket=process.env.S3_BUCKET;
const accessKeyId=process.env.S3_ACCESS_KEY, secretAccessKey=process.env.S3_SECRET_KEY;
export const s3=new S3Client({region,endpoint,forcePathStyle:!!endpoint,credentials: accessKeyId&&secretAccessKey?{accessKeyId,secretAccessKey}:undefined});
export async function putExport(key:string, body:Buffer, contentType:string){ if(!bucket) throw new Error("S3_BUCKET not configured"); await s3.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:body,ContentType:contentType,ACL:"public-read"})); const base=(endpoint||"").replace(/\/$/,""); return `${base}/${bucket}/${encodeURIComponent(key)}`; }
