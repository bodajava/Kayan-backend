import { NextFunction, Response, Request } from "express";
import { RoleEnum } from "../common/enums/user.enum.js";
import { ForbiddenException } from "../common/exception/domain.exception.js";

export const authorization = (accessRoles: RoleEnum[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !accessRoles.includes(user.role)) {
      return next(new ForbiddenException("Not authorized account 👀"));
    }
    return next();
  };
};
