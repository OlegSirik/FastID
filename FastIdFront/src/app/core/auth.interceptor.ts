import { HttpInterceptorFn } from '@angular/common/http';

/** Browser calls same-origin BFF; auth is handled server-side. */
export const authInterceptor: HttpInterceptorFn = (req, next) => next(req);
