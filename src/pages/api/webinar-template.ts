import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '../../lib/dbconnect';
import WebinarTemplate from '../../models/WebinarTemplate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
await new Promise(resolve => setTimeout(resolve, 5000));

  const { method } = req;

  switch (method) {
    case 'GET': {
      // Get data by userid from query string
      const { userid } = req.query;
      if (!userid || typeof userid !== 'string') {
        return res.status(400).json({ error: 'userid is required' });
      }
      try {
        const doc = await WebinarTemplate.findOne({ userid });
        if (!doc) {
          return res.status(404).json({ error: 'No data found' });
        }
        return res.status(200).json({ data: doc.data });
      } catch (error) {
        return res.status(500).json({ error: 'Error fetching data', details: error });
      }
    }
    case 'POST': {
      // Add or update data
      const { userid, data } = req.body;
      if (!userid || !data) {
        return res.status(400).json({ error: 'userid and data are required' });
      }
      try {
        const updated = await WebinarTemplate.findOneAndUpdate(
          { userid },
          { data },
          {upsert: true }
        );
        return res.status(200).json(updated);
      } catch (error) {
        return res.status(500).json({ error: 'Error saving data', details: error });
      }
    }
    case 'DELETE': {
      // Delete data
      const { userid } = req.body;
      if (!userid) {
        return res.status(400).json({ error: 'userid is required' });
      }
      try {
        await WebinarTemplate.deleteOne({ userid });
        return res.status(200).json({ message: 'Deleted successfully' });
      } catch (error) {
        return res.status(500).json({ error: 'Error deleting data', details: error });
      }
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
