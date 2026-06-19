import { Storage } from "@google-cloud/storage"
import fs from "fs"
import path from "path"

const LOCAL_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "pdfs")

function gcsBucket(): Storage | null {
  const name = process.env.GCS_BUCKET
  if (!name) return null
  return new Storage()
}

function gcsObjectKey(orderId: string, fileName: string): string {
  return `pdfs/${orderId}/${fileName}`
}

function localPath(orderId: string, fileName: string): string {
  return path.join(LOCAL_ROOT, orderId, fileName)
}

/** Returns a storage key (local absolute path or gcs://bucket/key). */
export async function saveOrderPdf(
  orderId: string,
  fileName: string,
  data: Buffer,
): Promise<string> {
  const bucketName = process.env.GCS_BUCKET
  if (bucketName) {
    const storage = gcsBucket()!
    const key = gcsObjectKey(orderId, fileName)
    await storage.bucket(bucketName).file(key).save(data, { contentType: "application/pdf" })
    return `gcs://${bucketName}/${key}`
  }

  const dir = path.join(LOCAL_ROOT, orderId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const filePath = localPath(orderId, fileName)
  fs.writeFileSync(filePath, data)
  return filePath
}

export async function readOrderPdf(storedPath: string): Promise<Buffer> {
  if (storedPath.startsWith("gcs://")) {
    const withoutScheme = storedPath.slice("gcs://".length)
    const slash = withoutScheme.indexOf("/")
    const bucketName = withoutScheme.slice(0, slash)
    const key = withoutScheme.slice(slash + 1)
    const [data] = await gcsBucket()!.bucket(bucketName).file(key).download()
    return data
  }

  return fs.readFileSync(storedPath)
}
