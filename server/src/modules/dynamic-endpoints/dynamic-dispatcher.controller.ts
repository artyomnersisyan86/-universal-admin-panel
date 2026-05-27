import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DynamicEndpointsService } from './dynamic-endpoints.service';

/**
 * Catch-all dispatcher for runtime-registered endpoints.
 *
 * Registered LAST in AppModule so static (decorated) controllers take precedence:
 * Nest's RouterExplorer matches the first controller route that fits.
 *
 * Lookup key is "METHOD:/api/<path>" — `req.baseUrl` includes the global prefix.
 */
@Controller()
export class DynamicDispatcherController {
  constructor(private readonly registry: DynamicEndpointsService) {}

  @All('*')
  async handle(@Req() req: Request, @Res() res: Response) {
    const fullPath = req.originalUrl.split('?')[0] || req.url;
    const ep = this.registry.match(req.method, fullPath);
    if (!ep) {
      return res.status(404).json({ message: 'Not found', path: fullPath });
    }
    if (ep.mode === 'static') {
      return res.json(ep.responseTemplate ?? null);
    }
    try {
      const data = await this.registry.runDbQuery(ep.dbQueryConfig);
      return res.json(data);
    } catch (e) {
      return res.status(400).json({
        message: e instanceof Error ? e.message : 'queryError',
      });
    }
  }
}
