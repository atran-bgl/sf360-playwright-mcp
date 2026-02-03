/**
 * AWS Cognito JWT Authentication with TOTP
 * Handles authentication flow: username/password + TOTP 2FA
 */

const axios = require('axios');
const { authenticator } = require('otplib');

/**
 * Authenticate with AWS Cognito using TOTP 2FA
 * @param {string} username - User email
 * @param {string} password - User password
 * @param {string} totpSecret - TOTP secret (base32 encoded)
 * @param {Object} cognitoConfig - Cognito configuration
 * @param {string} cognitoConfig.url - Cognito endpoint URL
 * @param {string} cognitoConfig.clientId - Cognito app client ID
 * @returns {Promise<string>} JWT IdToken
 */
async function authenticateWithCognito(username, password, totpSecret, cognitoConfig) {
  try {
    console.log('Authenticating with Cognito...');

    // Step 1: InitiateAuth with username/password
    const initiateAuthResponse = await axios.post(
      cognitoConfig.url,
      {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: cognitoConfig.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password
        },
        ClientMetadata: {}
      },
      {
        headers: {
          'content-type': 'application/x-amz-json-1.1',
          'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        }
      }
    );

    const session = initiateAuthResponse.data.Session;

    if (!session) {
      throw new Error('No session returned from InitiateAuth');
    }

    // Step 2: Generate TOTP code
    const totpCode = authenticator.generate(totpSecret);

    // Step 3: RespondToAuthChallenge with TOTP
    const respondResponse = await axios.post(
      cognitoConfig.url,
      {
        ChallengeName: 'SOFTWARE_TOKEN_MFA',
        ChallengeResponses: {
          USERNAME: username,
          SOFTWARE_TOKEN_MFA_CODE: totpCode
        },
        ClientId: cognitoConfig.clientId,
        Session: session
      },
      {
        headers: {
          'content-type': 'application/x-amz-json-1.1',
          'x-amz-target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
        }
      }
    );

    const idToken = respondResponse.data.AuthenticationResult.IdToken;

    if (!idToken) {
      throw new Error('No IdToken returned from RespondToAuthChallenge');
    }

    console.log('✓ Cognito authentication successful');
    return idToken;

  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      const errorData = error.response.data;

      if (errorData.__type === 'NotAuthorizedException') {
        throw new Error('Cognito authentication failed: Invalid username or password');
      } else if (errorData.__type === 'CodeMismatchException') {
        throw new Error('Cognito authentication failed: Invalid TOTP code');
      } else if (errorData.__type === 'ExpiredCodeException') {
        throw new Error('Cognito authentication failed: TOTP code expired (try again immediately)');
      } else if (errorData.__type === 'UserNotFoundException') {
        throw new Error('Cognito authentication failed: User does not exist');
      } else if (errorData.__type === 'TooManyRequestsException') {
        throw new Error('Cognito authentication failed: Rate limit exceeded (wait 5 minutes)');
      } else {
        throw new Error(`Cognito authentication failed: ${errorData.__type || error.response.status}`);
      }
    } else if (error.request) {
      throw new Error('Cognito authentication failed: No response from server');
    } else {
      throw new Error(`Cognito authentication failed: ${error.message}`);
    }
  }
}

module.exports = { authenticateWithCognito };
