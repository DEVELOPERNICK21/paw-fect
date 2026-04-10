/**
 * Composition root for the auth module: wires repository implementations to use cases.
 * Keeps the Zustand store free of direct repository imports (rules: Store → UseCases only).
 */
import { createAuthRepository } from './data/repositories/AuthRepositoryImpl';
import { LoginUser } from './domain/usecases/LoginUser';
import { SignupUser } from './domain/usecases/SignupUser';
import { LogoutUser } from './domain/usecases/LogoutUser';
import { GetCurrentUser } from './domain/usecases/GetCurrentUser';
import { LoginWithGoogle } from './domain/usecases/LoginWithGoogle';
import { RequestOtp } from './domain/usecases/RequestOtp';
import { VerifyOtp } from './domain/usecases/VerifyOtp';
import { ResendOtp } from './domain/usecases/ResendOtp';
import { SendPasswordResetEmail } from './domain/usecases/SendPasswordResetEmail';
import { ProcessPasswordResetQueue } from './domain/usecases/ProcessPasswordResetQueue';
import { StartAuthSessionListener } from './domain/usecases/StartAuthSessionListener';
import { RefreshAuthProfile } from './domain/usecases/RefreshAuthProfile';
import { ExecuteAuthWithRetry } from './domain/usecases/ExecuteAuthWithRetry';
import { ResolveAuthErrorMessage } from './domain/usecases/ResolveAuthErrorMessage';
import { ValidateEmailAuthInput } from './domain/usecases/ValidateEmailAuthInput';
import { ValidatePhoneForLogin } from './domain/usecases/ValidatePhoneForLogin';
import { ValidateEmailForReset } from './domain/usecases/ValidateEmailForReset';
import { BuildUserProfileLabels } from './domain/usecases/BuildUserProfileLabels';
import { UpdateUserProfile } from './domain/usecases/UpdateUserProfile';
import { showLoginWelcomeNotification } from '../../infrastructure/notifications/loginWelcomeNotification';

const repository = createAuthRepository();

export const authComposition = {
  login: new LoginUser(repository),
  signup: new SignupUser(repository),
  logout: new LogoutUser(repository),
  getCurrentUser: new GetCurrentUser(repository),
  loginWithGoogle: new LoginWithGoogle(repository),
  requestOtp: new RequestOtp(repository),
  verifyOtp: new VerifyOtp(repository),
  resendOtp: new ResendOtp(repository),
  sendPasswordResetEmail: new SendPasswordResetEmail(repository),
  processPasswordResetQueue: new ProcessPasswordResetQueue(repository),
  startAuthSessionListener: new StartAuthSessionListener(repository),
  refreshAuthProfile: new RefreshAuthProfile(repository),
  executeAuthWithRetry: new ExecuteAuthWithRetry(),
  resolveAuthErrorMessage: new ResolveAuthErrorMessage(),
  validateEmailAuthInput: new ValidateEmailAuthInput(),
  validatePhoneForLogin: new ValidatePhoneForLogin(),
  validateEmailForReset: new ValidateEmailForReset(),
  buildUserProfileLabels: new BuildUserProfileLabels(),
  updateUserProfile: new UpdateUserProfile(repository),
  notifyLoginWelcome: showLoginWelcomeNotification,
} as const;
