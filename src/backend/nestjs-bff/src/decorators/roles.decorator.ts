import { SetMetadata } from '@nestjs/common';
import { AppRole } from '../guards/roles.guard';

export const ROLES_KEY = 'roles';

/** Restrict a route to one or more roles. */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
