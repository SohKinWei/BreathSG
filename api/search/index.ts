import { Router, Request, Response } from 'express';

const searchRouter = Router();

searchRouter.get('/', async (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    return res.json({ results: [] });
  }

  try {
    const onemapUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y`;
    const response = await fetch(onemapUrl);
    const data = await response.json();

    const results = (data.results || [])
      .slice(0, 10)
      .map((item: any) => ({
        name: item.SEARCHVAL || item.BUILDING || item.ADDRESS,
        address: item.ADDRESS,
        postal: item.POSTAL !== 'NIL' ? item.POSTAL : undefined,
        latitude: parseFloat(item.LATITUDE),
        longitude: parseFloat(item.LONGITUDE)
      }))
      .filter((item: any) => !isNaN(item.latitude) && !isNaN(item.longitude));

    res.json({ ok: true, results });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message, results: [] });
  }
});

export default searchRouter;
