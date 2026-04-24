import { NextFunction, Request, Response } from "express";
import { tokenService } from "../common/services/token.service.js";
import { UnauthorizedException } from "../common/exception/domain.exception.js";
import { tokenTypeEnum } from "../common/enums/token.enum.js";

export const authentication = (tokenType: tokenTypeEnum = tokenTypeEnum.Access) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException("Missing authorization header");
      }

      const spaceIndex = authHeader.indexOf(' ');
      const key = spaceIndex > -1 ? authHeader.substring(0, spaceIndex) : authHeader;
      const credential = spaceIndex > -1 ? authHeader.substring(spaceIndex + 1).trim() : '';

      if (!key || !credential) {
        throw new UnauthorizedException("Missing authorization header");
      }

      switch (key) {
        case 'Basic':
          throw new UnauthorizedException("Basic authentication is not supported");

        case 'Bearer':
        default:
          const { user, decoded } = await tokenService.decodedToken({
            token: credential,
            tokenType
          });

          // Attach user and decoded payload to the request object
          (req as any).user = user;
          (req as any).decoded = decoded;

          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
