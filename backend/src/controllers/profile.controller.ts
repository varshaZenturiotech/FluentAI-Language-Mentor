import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

/**
 * Profile Controller
 *
 * Responsibility: HTTP request/response handling ONLY.
 * - Extracts data from the request (params, body, user context).
 * - Calls the appropriate service method.
 * - Formats and sends the response.
 * - Delegates all errors to the global error handler via next().
 *
 * No business logic. No Prisma queries.
 */
export class ProfileController {
  private profileService: ProfileService;

  constructor(profileService: ProfileService = new ProfileService()) {
    this.profileService = profileService;
  }

  /**
   * GET /api/v1/profile
   * Returns the authenticated user's profile and basic user information.
   *
   * HTTP 200 – success with profile data
   * HTTP 401 – if auth middleware did not attach req.user
   * HTTP 404 – if profile record does not exist
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const profile = await this.profileService.getProfile(req.user.id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/profile
   * Partially updates the authenticated user's profile.
   * Request body has already been validated by validateUpdateProfile middleware.
   *
   * HTTP 200 – success with updated profile data
   * HTTP 400 – validation failure (handled by validator middleware before reaching here)
   * HTTP 401 – unauthenticated request
   * HTTP 404 – profile not found
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const dto: UpdateProfileDto = req.body;
      const updatedProfile = await this.profileService.updateProfile(req.user.id, dto);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/profile
   * Permanently deletes the authenticated user's account and all associated data.
   *
   * HTTP 200 – account deleted successfully
   * HTTP 401 – unauthenticated request
   * HTTP 404 – account not found
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      await this.profileService.deleteAccount(req.user.id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        message: 'Account deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
