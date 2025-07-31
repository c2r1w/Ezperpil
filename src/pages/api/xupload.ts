import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false,
  },
};

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest & { file?: Express.Multer.File }, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await runMiddleware(req, res, upload.single('file'));
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      return res.status(200).json({ fileName: req.file.filename });
    } catch (error: any) {
      return res.status(500).json({ error: `Sorry something happened! ${error.message}` });
    }
  } else {
    return res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }
}
