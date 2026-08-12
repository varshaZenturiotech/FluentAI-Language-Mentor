import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileRepository, ProfileWithUser } from '../repositories/profile.repository';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

/**
 * Profile Service
 *
 * Responsibility: Business logic ONLY.
 * Orchestrates repository calls, enforces domain rules, and throws
 * semantic ApiErrors that the global error handler understands.
 * Never performs direct Prisma queries.
 */
export class ProfileService {
  private profileRepository: ProfileRepository;

  constructor(profileRepository: ProfileRepository = new ProfileRepository()) {
    this.profileRepository = profileRepository;
  }

  /**
   * Retrieves the authenticated user's profile merged with their base user data.
   *
   * @throws {ApiError} 404 – when no profile record exists for the given userId
   */
  async getProfile(userId: string): Promise<ProfileWithUser> {
    const profile = await this.profileRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'Profile not found.');
    }

    return profile;
  }

  /**
   * Applies a partial update to the authenticated user's profile.
   * Ensures the profile exists before attempting an update to return a
   * meaningful 404 rather than a cryptic Prisma "Record not found" error.
   *
   * @throws {ApiError} 404 – when the profile does not exist
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileWithUser> {
    // Guard: confirm the profile exists before attempting update
    const existing = await this.profileRepository.findProfileByUserId(userId);
    if (!existing) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'Profile not found.');
    }

    return this.profileRepository.updateProfile(userId, dto);
  }

  /**
   * Permanently deletes the authenticated user's account and all associated data.
   * After deletion the caller must invalidate the user's session.
   *
   * @throws {ApiError} 404 – when the profile / user does not exist
   */
  async deleteAccount(userId: string): Promise<void> {
    // Guard: confirm the user/profile exists before attempting deletion
    const existing = await this.profileRepository.findProfileByUserId(userId);
    if (!existing) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'Account not found.');
    }

    await this.profileRepository.deleteAccount(userId);
  }
}
