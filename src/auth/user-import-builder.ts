/*!
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FirebaseArrayIndexError } from '../app/index';
import { deepCopy, deepExtend } from '../utils/deep-copy';
import * as utils from '../utils';
import * as validator from '../utils/validator';
import { AuthClientErrorCode, FirebaseAuthError } from '../utils/error';
import {
  UpdateMultiFactorInfoRequest, UpdatePhoneMultiFactorInfoRequest,
  MultiFactorUpdateSettings, UpdateTotpMultiFactorInfoRequest
} from './auth-config';

export type HashAlgorithmType = 'SCRYPT' | 'STANDARD_SCRYPT' | 'HMAC_SHA512' |
  'HMAC_SHA256' | 'HMAC_SHA1' | 'HMAC_MD5' | 'MD5' | 'PBKDF_SHA1' | 'BCRYPT' |
  'PBKDF2_SHA256' | 'SHA512' | 'SHA256' | 'SHA1';

/**
   * Interface representing the user import options needed for
   * {@link BaseAuth.importUsers} method. This is used to
   * provide the password hashing algorithm information.
   */
export interface UserImportOptions {

  /**
   * The password hashing information.
   */
  hash: {

    /**
     * The password hashing algorithm identifier. The following algorithm
     * identifiers are supported:
     * `SCRYPT`, `STANDARD_SCRYPT`, `HMAC_SHA512`, `HMAC_SHA256`, `HMAC_SHA1`,
     * `HMAC_MD5`, `MD5`, `PBKDF_SHA1`, `BCRYPT`, `PBKDF2_SHA256`, `SHA512`,
     * `SHA256` and `SHA1`.
     */
    algorithm: HashAlgorithmType;

    /**
     * The signing key used in the hash algorithm in buffer bytes.
     * Required by hashing algorithms `SCRYPT`, `HMAC_SHA512`, `HMAC_SHA256`,
     * `HAMC_SHA1` and `HMAC_MD5`.
     */
    key?: Buffer;

    /**
     * The salt separator in buffer bytes which is appended to salt when
     * verifying a password. This is only used by the `SCRYPT` algorithm.
     */
    saltSeparator?: Buffer;

    /**
     * The number of rounds for hashing calculation.
     * Required for `SCRYPT`, `MD5`, `SHA512`, `SHA256`, `SHA1`, `PBKDF_SHA1` and
     * `PBKDF2_SHA256`.
     */
    rounds?: number;

    /**
     * The memory cost required for `SCRYPT` algorithm, or the CPU/memory cost.
     * Required for `STANDARD_SCRYPT` algorithm.
     */
    memoryCost?: number;

    /**
     * The parallelization of the hashing algorithm. Required for the
     * `STANDARD_SCRYPT` algorithm.
     */
    parallelization?: number;

    /**
     * The block size (normally 8) of the hashing algorithm. Required for the
     * `STANDARD_SCRYPT` algorithm.
     */
    blockSize?: number;
    /**
     * The derived key length of the hashing algorithm. Required for the
     * `STANDARD_SCRYPT` algorithm.
     */
    derivedKeyLength?: number;
  };
}

/**
 * Interface representing a user to import to Firebase Auth via the
 * {@link BaseAuth.importUsers} method.
 */
export interface UserImportRecord {

  /**
   * The user's `uid`.
   */
  uid: string;

  /**
   * The user's primary email, if set.
   */
  email?: string;

  /**
   * Whether or not the user's primary email is verified.
   */
  emailVerified?: boolean;

  /**
   * The user's display name.
   */
  displayName?: string;

  /**
   * The user's primary phone number, if set.
   */
  phoneNumber?: string;

  /**
   * The user's photo URL.
   */
  photoURL?: string;

  /**
   * Whether or not the user is disabled: `true` for disabled; `false` for
   * enabled.
   */
  disabled?: boolean;

  /**
   * Additional metadata about the user.
   */
  metadata?: UserMetadataRequest;

  /**
   * An array of providers (for example, Google, Facebook) linked to the user.
   */
  providerData?: UserProviderRequest[];

  /**
   * The user's custom claims object if available, typically used to define
   * user roles and propagated to an authenticated user's ID token.
   */
  customClaims?: { [key: string]: any };

  /**
   * The buffer of bytes representing the user's hashed password.
   * When a user is to be imported with a password hash,
   * {@link UserImportOptions} are required to be
   * specified to identify the hashing algorithm used to generate this hash.
   */
  passwordHash?: Buffer;

  /**
   * The buffer of bytes representing the user's password salt.
   */
  passwordSalt?: Buffer;

  /**
   * The identifier of the tenant where user is to be imported to.
   * When not provided in an `admin.auth.Auth` context, the user is uploaded to
   * the default parent project.
   * When not provided in an `admin.auth.TenantAwareAuth` context, the user is uploaded
   * to the tenant corresponding to that `TenantAwareAuth` instance's tenant ID.
   */
  tenantId?: string;

  /**
   * The user's multi-factor related properties.
   */
  multiFactor?: MultiFactorUpdateSettings;
}

/**
 * User metadata to include when importing a user.
 */
export interface UserMetadataRequest {

  /**
   * The date the user last signed in, formatted as a UTC string.
   */
  lastSignInTime?: string;

  /**
   * The date the user was created, formatted as a UTC string.
   */
  creationTime?: string;
}

/**
 * User provider data to include when importing a user.
 */
export interface UserProviderRequest {

  /**
   * The user identifier for the linked provider.
   */
  uid: string;

  /**
   * The display name for the linked provider.
   */
  displayName?: string;

  /**
   * The email for the linked provider.
   */
  email?: string;

  /**
   * The phone number for the linked provider.
   */
  phoneNumber?: string;

  /**
   * The photo URL for the linked provider.
   */
  photoURL?: string;

  /**
   * The linked provider ID (for example, "google.com" for the Google provider).
   */
  providerId: string;
}

/**
   * Interface representing the response from the
   * {@link BaseAuth.importUsers} method for batch
   * importing users to Firebase Auth.
   */
export interface UserImportResult {

  /**
   * The number of user records that failed to import to Firebase Auth.
   */
  failureCount: number;

  /**
   * The number of user records that successfully imported to Firebase Auth.
   */
  successCount: number;

  /**
   * An array of errors corresponding to the provided users to import. The
   * length of this array is equal to [`failureCount`](#failureCount).
   */
  errors: FirebaseArrayIndexError[];
}

/** Interface representing TOTP Info in server format. */
export interface TotpInfo {
  sharedSecretKey?: string;
}

/** Interface representing an Auth second factor in Auth server format. */
export interface AuthFactorInfo {
  // Not required for signupNewUser endpoint.
  mfaEnrollmentId?: string;
  displayName?: string;
  phoneInfo?: string;
  enrolledAt?: string;
  totpInfo?: TotpInfo;
  [key: string]: any;
}


/** UploadAccount endpoint request user interface. */
interface UploadAccountUser {
  localId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  disabled?: boolean;
  photoUrl?: string;
  phoneNumber?: string;
  providerUserInfo?: Array<{
    rawId: string;
    providerId: string;
    email?: string;
    displayName?: string;
    photoUrl?: string;
  }>;
  mfaInfo?: AuthFactorInfo[];
  passwordHash?: string;
  salt?: string;
  lastLoginAt?: number;
  createdAt?: number;
  customAttributes?: string;
  tenantId?: string;
}


/** UploadAccount endpoint request hash options. */
export interface UploadAccountOptions {
  hashAlgorithm?: string;
  signerKey?: string;
  rounds?: number;
  memoryCost?: number;
  saltSeparator?: string;
  cpuMemCost?: number;
  parallelization?: number;
  blockSize?: number;
  dkLen?: number;
}


/** UploadAccount endpoint complete request interface. */
export interface UploadAccountRequest extends UploadAccountOptions {
  users?: UploadAccountUser[];
}


/** Callback function to validate an UploadAccountUser object. */
export type ValidatorFunction = (data: UploadAccountUser) => void;


/**
 * Converts a client format second factor object to server format.
 * @param multiFactorInfo - The client format second factor.
 * @returns The corresponding AuthFactorInfo server request format.
 */
export function convertMultiFactorInfoToServerFormat(multiFactorInfo: UpdateMultiFactorInfoRequest): AuthFactorInfo {
  let enrolledAt;
  if (typeof multiFactorInfo.enrollmentTime !== 'undefined') {
    if (validator.isUTCDateString(multiFactorInfo.enrollmentTime)) {
      // Convert from UTC date string (client side format) to ISO date string (server side format).
      enrolledAt = new Date(multiFactorInfo.enrollmentTime).toISOString();
    } else {
      throw new FirebaseAuthError(
        AuthClientErrorCode.INVALID_ENROLLMENT_TIME,
        `The second factor "enrollmentTime" for "${multiFactorInfo.uid}" must be a valid ` +
        'UTC date string.');
    }
  }
  // Currently only phone second factors are supported.
  if (isPhoneFactor(multiFactorInfo)) {
    // If any required field is missing or invalid, validation will still fail later.
    const authFactorInfo: AuthFactorInfo = {
      mfaEnrollmentId: multiFactorInfo.uid,
      displayName: multiFactorInfo.displayName,
      // Required for all phone second factors.
      phoneInfo: multiFactorInfo.phoneNumber,
      enrolledAt,
    };
    for (const objKey in authFactorInfo) {
      if (typeof authFactorInfo[objKey] === 'undefined') {
        delete authFactorInfo[objKey];
      }
    }
    return authFactorInfo;
  }
  if (isTotpFactor(multiFactorInfo)) {
    const TOTPInfo: TotpInfo = {
      sharedSecretKey: multiFactorInfo.sharedSecretKey,
    };
    const authFactorInfo: AuthFactorInfo = {
      mfaEnrollmentId: multiFactorInfo.uid,
      displayName: multiFactorInfo.displayName,
      totpInfo: TOTPInfo,
      enrolledAt,
    };
    for (const objKey in authFactorInfo) {
      if (typeof authFactorInfo[objKey] == 'undefined') {
        delete authFactorInfo[objKey];
      }
    }
  }
  else {
    // Unsupported second factor.
    throw new FirebaseAuthError(
      AuthClientErrorCode.UNSUPPORTED_SECOND_FACTOR,
      `Unsupported second factor "${JSON.stringify(multiFactorInfo)}" provided.`);
  }
}

function isPhoneFactor(multiFactorInfo: UpdateMultiFactorInfoRequest):
  multiFactorInfo is UpdatePhoneMultiFactorInfoRequest {
  return multiFactorInfo.factorId === 'phone';
}

function isTotpFactor(multiFactorInfo: UpdateMultiFactorInfoRequest):
  multiFactorInfo is UpdateTotpMultiFactorInfoRequest {
  return multiFactorInfo.factorId == 'totp';
}

/**
 * @param {any} obj The object to check for number field within.
 * @param {string} key The entry key.
 * @returns {number} The corresponding number if available. Otherwise, NaN.
 */
function getNumberField(obj: any, key: string): number {
  if (typeof obj[key] !== 'undefined' && obj[key] !== null) {
    return parseInt(obj[key].toString(), 10);
  }
  return NaN;
}


/**
 * Converts a UserImportRecord to a UploadAccountUser object. Throws an error when invalid
 * fields are provided.
 * @param {UserImportRecord} user The UserImportRecord to conver to UploadAccountUser.
 * @param {ValidatorFunction=} userValidator The user validator function.
 * @returns {UploadAccountUser} The corresponding UploadAccountUser to return.
 */
function populateUploadAccountUser(
  user: UserImportRecord, userValidator?: ValidatorFunction): UploadAccountUser {
  const result: UploadAccountUser = {
    localId: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    disabled: user.disabled,
    photoUrl: user.photoURL,
    phoneNumber: user.phoneNumber,
    providerUserInfo: [],
    mfaInfo: [],
    tenantId: user.tenantId,
    customAttributes: user.customClaims && JSON.stringify(user.customClaims),
  };
  if (typeof user.passwordHash !== 'undefined') {
    if (!validator.isBuffer(user.passwordHash)) {
      throw new FirebaseAuthError(
        AuthClientErrorCode.INVALID_PASSWORD_HASH,
      );
    }
    result.passwordHash = utils.toWebSafeBase64(user.passwordHash);
  }
  if (typeof user.passwordSalt !== 'undefined') {
    if (!validator.isBuffer(user.passwordSalt)) {
      throw new FirebaseAuthError(
        AuthClientErrorCode.INVALID_PASSWORD_SALT,
      );
    }
    result.salt = utils.toWebSafeBase64(user.passwordSalt);
  }
  if (validator.isNonNullObject(user.metadata)) {
    if (validator.isNonEmptyString(user.metadata.creationTime)) {
      result.createdAt = new Date(user.metadata.creationTime).getTime();
    }
    if (validator.isNonEmptyString(user.metadata.lastSignInTime)) {
      result.lastLoginAt = new Date(user.metadata.lastSignInTime).getTime();
    }
  }
  if (validator.isArray(user.providerData)) {
    user.providerData.forEach((providerData) => {
      result.providerUserInfo!.push({
        providerId: providerData.providerId,
        rawId: providerData.uid,
        email: providerData.email,
        displayName: providerData.displayName,
        photoUrl: providerData.photoURL,
      });
    });
  }

  // Convert user.multiFactor.enrolledFactors to server format.
  if (validator.isNonNullObject(user.multiFactor) &&
    validator.isNonEmptyArray(user.multiFactor.enrolledFactors)) {
    user.multiFactor.enrolledFactors.forEach((multiFactorInfo) => {
      result.mfaInfo!.push(convertMultiFactorInfoToServerFormat(multiFactorInfo));
    });
  }

  // Remove blank fields.
  let key: keyof UploadAccountUser;
  for (key in result) {
    if (typeof result[key] === 'undefined') {
      delete result[key];
    }
  }
  if (result.providerUserInfo!.length === 0) {
    delete result.providerUserInfo;
  }
  if (result.mfaInfo!.length === 0) {
    delete result.mfaInfo;
  }
  // Validate the constructured user individual request. This will throw if an error
  // is detected.
  if (typeof userValidator === 'function') {
    userValidator(result);
  }
  return result;
}


/**
 * Class that provides a helper for building/validating uploadAccount requests and
 * UserImportResult responses.
 */
export class UserImportBuilder {
  private requiresHashOptions: boolean;
  private validatedUsers: UploadAccountUser[];
  private validatedOptions: UploadAccountOptions;
  private indexMap: { [key: number]: number };
  private userImportResultErrors: FirebaseArrayIndexError[];

  /**
   * @param {UserImportRecord[]} users The list of user records to import.
   * @param {UserImportOptions=} options The import options which includes hashing
   *     algorithm details.
   * @param {ValidatorFunction=} userRequestValidator The user request validator function.
   * @constructor
   */
  constructor(
    users: UserImportRecord[],
    options?: UserImportOptions,
    userRequestValidator?: ValidatorFunction) {
    this.requiresHashOptions = false;
    this.validatedUsers = [];
    this.userImportResultErrors = [];
    this.indexMap = {};

    this.validatedUsers = this.populateUsers(users, userRequestValidator);
    this.validatedOptions = this.populateOptions(options, this.requiresHashOptions);
  }

  /**
   * Returns the corresponding constructed uploadAccount request.
   * @returns {UploadAccountRequest} The constructed uploadAccount request.
   */
  public buildRequest(): UploadAccountRequest {
    const users = this.validatedUsers.map((user) => {
      return deepCopy(user);
    });
    return deepExtend({ users }, deepCopy(this.validatedOptions)) as UploadAccountRequest;
  }

  /**
   * Populates the UserImportResult using the client side detected errors and the server
   * side returned errors.
   * @returns {UserImportResult} The user import result based on the returned failed
   *     uploadAccount response.
   */
  public buildResponse(
    failedUploads: Array<{ index: number; message: string }>): UserImportResult {
    // Initialize user import result.
    const importResult: UserImportResult = {
      successCount: this.validatedUsers.length,
      failureCount: this.userImportResultErrors.length,
      errors: deepCopy(this.userImportResultErrors),
    };
    importResult.failureCount += failedUploads.length;
    importResult.successCount -= failedUploads.length;
    failedUploads.forEach((failedUpload) => {
      importResult.errors.push({
        // Map backend request index to original developer provided array index.
        index: this.indexMap[failedUpload.index],
        error: new FirebaseAuthError(
          AuthClientErrorCode.INVALID_USER_IMPORT,
          failedUpload.message,
        ),
      });
    });
    // Sort errors by index.
    importResult.errors.sort((a, b) => {
      return a.index - b.index;
    });
    // Return sorted result.
    return importResult;
  }

  /**
   * Validates and returns the hashing options of the uploadAccount request.
   * Throws an error whenever an invalid or missing options is detected.
   * @param {UserImportOptions} options The UserImportOptions.
   * @param {boolean} requiresHashOptions Whether to require hash options.
   * @returns {UploadAccountOptions} The populated UploadAccount options.
   */
  private populateOptions(
    options: UserImportOptions | undefined, requiresHashOptions: boolean): UploadAccountOptions {
    let populatedOptions: UploadAccountOptions;
    if (!requiresHashOptions) {
      return {};
    }
    if (!validator.isNonNullObject(options)) {
      throw new FirebaseAuthError(
        AuthClientErrorCode.INVALID_ARGUMENT,
        '"UserImportOptions" are required when importing users with passwords.',
      );
    }
    if (!validator.isNonNullObject(options.hash)) {
      throw new FirebaseAuthError(
        AuthClientErrorCode.MISSING_HASH_ALGORITHM,
        '"hash.algorithm" is missing from the provided "UserImportOptions".',
      );
    }
    if (typeof options.hash.algorithm === 'undefined' ||
      !validator.isNonEmptyString(options.hash.algorithm)) {
      throw new FirebaseAuthError(
        AuthClientErrorCode.INVALID_HASH_ALGORITHM,
        '"hash.algorithm" must be a string matching the list of supported algorithms.',
      );
    }

    let rounds: number;
    switch (options.hash.algorithm) {
      case 'HMAC_SHA512':
      case 'HMAC_SHA256':
      case 'HMAC_SHA1':
      case 'HMAC_MD5':
        if (!validator.isBuffer(options.hash.key)) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_KEY,
            'A non-empty "hash.key" byte buffer must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        populatedOptions = {
          hashAlgorithm: options.hash.algorithm,
          signerKey: utils.toWebSafeBase64(options.hash.key),
        };
        break;

      case 'MD5':
      case 'SHA1':
      case 'SHA256':
      case 'SHA512': {
        // MD5 is [0,8192] but SHA1, SHA256, and SHA512 are [1,8192]
        rounds = getNumberField(options.hash, 'rounds');
        const minRounds = options.hash.algorithm === 'MD5' ? 0 : 1;
        if (isNaN(rounds) || rounds < minRounds || rounds > 8192) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_ROUNDS,
            `A valid "hash.rounds" number between ${minRounds} and 8192 must be provided for ` +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        populatedOptions = {
          hashAlgorithm: options.hash.algorithm,
          rounds,
        };
        break;
      }
      case 'PBKDF_SHA1':
      case 'PBKDF2_SHA256':
        rounds = getNumberField(options.hash, 'rounds');
        if (isNaN(rounds) || rounds < 0 || rounds > 120000) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_ROUNDS,
            'A valid "hash.rounds" number between 0 and 120000 must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        populatedOptions = {
          hashAlgorithm: options.hash.algorithm,
          rounds,
        };
        break;

      case 'SCRYPT': {
        if (!validator.isBuffer(options.hash.key)) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_KEY,
            'A "hash.key" byte buffer must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        rounds = getNumberField(options.hash, 'rounds');
        if (isNaN(rounds) || rounds <= 0 || rounds > 8) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_ROUNDS,
            'A valid "hash.rounds" number between 1 and 8 must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        const memoryCost = getNumberField(options.hash, 'memoryCost');
        if (isNaN(memoryCost) || memoryCost <= 0 || memoryCost > 14) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_MEMORY_COST,
            'A valid "hash.memoryCost" number between 1 and 14 must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        if (typeof options.hash.saltSeparator !== 'undefined' &&
          !validator.isBuffer(options.hash.saltSeparator)) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_SALT_SEPARATOR,
            '"hash.saltSeparator" must be a byte buffer.',
          );
        }
        populatedOptions = {
          hashAlgorithm: options.hash.algorithm,
          signerKey: utils.toWebSafeBase64(options.hash.key),
          rounds,
          memoryCost,
          saltSeparator: utils.toWebSafeBase64(options.hash.saltSeparator || Buffer.from('')),
        };
        break;
      }
      case 'BCRYPT':
        populatedOptions = {
          hashAlgorithm: options.hash.algorithm,
        };
        break;

      case 'STANDARD_SCRYPT': {
        const cpuMemCost = getNumberField(options.hash, 'memoryCost');
        if (isNaN(cpuMemCost)) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_MEMORY_COST,
            'A valid "hash.memoryCost" number must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        const parallelization = getNumberField(options.hash, 'parallelization');
        if (isNaN(parallelization)) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_PARALLELIZATION,
            'A valid "hash.parallelization" number must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        const blockSize = getNumberField(options.hash, 'blockSize');
        if (isNaN(blockSize)) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_BLOCK_SIZE,
            'A valid "hash.blockSize" number must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        const dkLen = getNumberField(options.hash, 'derivedKeyLength');
        if (isNaN(dkLen)) {
          throw new FirebaseAuthError(
            AuthClientErrorCode.INVALID_HASH_DERIVED_KEY_LENGTH,
            'A valid "hash.derivedKeyLength" number must be provided for ' +
            `hash algorithm ${options.hash.algorithm}.`,
          );
        }
        populatedOptions = {
          hashAlgorithm: options.hash.algorithm,
          cpuMemCost,
          parallelization,
          blockSize,
          dkLen,
        };
        break;
      }
      default:
        throw new FirebaseAuthError(
          AuthClientErrorCode.INVALID_HASH_ALGORITHM,
          `Unsupported hash algorithm provider "${options.hash.algorithm}".`,
        );
    }
    return populatedOptions;
  }

  /**
   * Validates and returns the users list of the uploadAccount request.
   * Whenever a user with an error is detected, the error is cached and will later be
   * merged into the user import result. This allows the processing of valid users without
   * failing early on the first error detected.
   * @param {UserImportRecord[]} users The UserImportRecords to convert to UnploadAccountUser
   *     objects.
   * @param {ValidatorFunction=} userValidator The user validator function.
   * @returns {UploadAccountUser[]} The populated uploadAccount users.
   */
  private populateUsers(
    users: UserImportRecord[], userValidator?: ValidatorFunction): UploadAccountUser[] {
    const populatedUsers: UploadAccountUser[] = [];
    users.forEach((user, index) => {
      try {
        const result = populateUploadAccountUser(user, userValidator);
        if (typeof result.passwordHash !== 'undefined') {
          this.requiresHashOptions = true;
        }
        // Only users that pass client screening will be passed to backend for processing.
        populatedUsers.push(result);
        // Map user's index (the one to be sent to backend) to original developer provided array.
        this.indexMap[populatedUsers.length - 1] = index;
      } catch (error) {
        // Save the client side error with respect to the developer provided array.
        this.userImportResultErrors.push({
          index,
          error,
        });
      }
    });
    return populatedUsers;
  }
}
