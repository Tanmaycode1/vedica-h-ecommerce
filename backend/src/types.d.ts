import { User } from './models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: number;
    }
  }
}

declare module 'morgan' {
  const morgan: any;
  export default morgan;
}

declare module 'swagger-ui-express' {
  const swaggerUi: any;
  export default swaggerUi;
} 