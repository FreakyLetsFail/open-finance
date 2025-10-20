import express, { Request, Response } from 'express';
import { userService } from './services/userService';
import { errorHandler, asyncHandler, AppError } from './middleware/errorHandler';

export const app = express();

app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User routes
app.post('/api/users', asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
}));

app.get('/api/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  res.json(user);
}));

app.get('/api/users', asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.listUsers();
  res.json(users);
}));

app.put('/api/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json(user);
}));

app.delete('/api/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const deleted = await userService.deleteUser(req.params.id);
  if (!deleted) {
    throw new AppError(404, 'User not found');
  }
  res.status(204).send();
}));

// Error handling
app.use(errorHandler);

export function startServer(port: number = 3000) {
  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
