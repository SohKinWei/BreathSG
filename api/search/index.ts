import { Router, Request, Response } from 'express';
import { onemapSearch } from '../services/onemapService.js';

const searchRouter = Router();

searchRouter.get('/', async (req: Request, res: Response) => {
  const query = String(req.query.q || req.query.searchVal || '').trim();
  const pageNum = Number(req.query.pageNum) || 1;
  const customToken = req.headers['x-onemap-token'] as string | undefined;

  if (!query) {
    return res.json({ results: [], totalNumPages: 0, found: 0 });
  }

  try {
    const result = await onemapSearch(query, pageNum, customToken);
    const data = result.data;

    const results = (data.results || [])
      .map((item: any) => ({
        name: item.SEARCHVAL || item.BUILDING || item.ADDRESS,
        address: item.ADDRESS,
        postal: item.POSTAL !== 'NIL' ? item.POSTAL : undefined,
        latitude: parseFloat(item.LATITUDE),
        longitude: parseFloat(item.LONGITUDE)
      }))
      .filter((item: any) => !isNaN(item.latitude) && !isNaN(item.longitude));

    res.json({
      ok: true,
      found: data.found ?? results.length,
      totalNumPages: data.totalNumPages ?? 1,
      pageNum,
      hasToken: result.hasToken,
      results
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message, results: [] });
  }
});

export default searchRouter;
